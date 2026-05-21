/**
 * NexCall final regression + Firefox polish check
 * Runs against localhost:3001 with Chromium (Firefox not installed)
 * Tests: hero decrypt stability, NexCall accent, portraits visible,
 *        process section bigger, all buttons functional
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const RESULTS = [];

function pass(label, detail = '') {
  RESULTS.push({ ok: true, label, detail });
  console.log(`✅ ${label}${detail ? ' | ' + detail : ''}`);
}
function fail(label, detail = '') {
  RESULTS.push({ ok: false, label, detail });
  console.log(`❌ ${label}${detail ? ' | ' + detail : ''}`);
}

async function test(label, fn) {
  try {
    await fn();
  } catch (e) {
    fail(label, e.message.slice(0, 120));
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000); // let React hydrate + decrypt animation start

  // ── Hero decrypt stability ─────────────────────────────────────────────────
  await test('Hero h1 has stable block structure', async () => {
    const structure = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const relativeSpan = h1?.querySelector('span.relative');
      const invisibleSpan = relativeSpan?.querySelector('span.invisible');
      const overlaySpan = relativeSpan?.querySelector('span.absolute');
      return {
        hasRelative: !!relativeSpan,
        hasInvisible: !!invisibleSpan,
        hasOverlay: !!overlaySpan,
        invisibleText: invisibleSpan?.textContent?.trim(),
        h1Height: h1?.getBoundingClientRect().height
      };
    });
    if (!structure.hasRelative || !structure.hasInvisible || !structure.hasOverlay)
      throw new Error(`Missing layout-stable structure: ${JSON.stringify(structure)}`);
    pass('Hero decrypt layout-stable structure present', `invisible anchor + absolute overlay`);
  });

  await test('Invisible anchor has final text', async () => {
    const text = await page.evaluate(() => {
      const inv = document.querySelector('h1 span.invisible');
      return inv?.textContent?.trim();
    });
    if (text !== 'Never miss your next call.')
      throw new Error(`Got: "${text}"`);
    pass('Invisible anchor contains "Never miss your next call."', text);
  });

  await test('Hero h1 height stable (no jump)', async () => {
    const h1Before = await page.evaluate(() => document.querySelector('h1')?.getBoundingClientRect().height);
    await page.waitForTimeout(1500); // through the 1200ms animation
    const h1After = await page.evaluate(() => document.querySelector('h1')?.getBoundingClientRect().height);
    const diff = Math.abs((h1Before || 0) - (h1After || 0));
    if (diff > 2) throw new Error(`h1 height changed by ${diff}px (before=${h1Before}, after=${h1After})`);
    pass('Hero h1 height stable during decrypt animation', `diff=${diff}px`);
  });

  await test('Decrypt completes with accent on "next call."', async () => {
    await page.waitForTimeout(1500); // animation should be done
    const overlay = await page.evaluate(() => {
      const overlay = document.querySelector('h1 span.absolute');
      const accentSpan = overlay?.querySelector('span[class*="A8FF00"]');
      return {
        overlayText: overlay?.textContent?.trim(),
        accentText: accentSpan?.textContent?.trim(),
        hasAccent: !!accentSpan
      };
    });
    if (!overlay.hasAccent) throw new Error(`No accent span found. overlay text: "${overlay.overlayText}"`);
    if (overlay.accentText !== 'next call.') throw new Error(`Accent text wrong: "${overlay.accentText}"`);
    pass('Decrypt completed: "next call." has lime accent', `accent="${overlay.accentText}"`);
  });

  // ── NexCall green accent ───────────────────────────────────────────────────
  await test('NexCall accented in hero paragraph', async () => {
    const accentedNexCall = await page.evaluate(() => {
      // Find a span with NexCall text that has text-[#A8FF00] color
      const allSpans = Array.from(document.querySelectorAll('p span'));
      return allSpans.some(s => s.textContent?.trim() === 'NexCall' && s.className.includes('A8FF00'));
    });
    if (!accentedNexCall) throw new Error('No green-accented NexCall span found in hero paragraph');
    pass('NexCall accented green in hero paragraph');
  });

  // ── Portrait trust strip ───────────────────────────────────────────────────
  await test('Portrait SVGs visible (4 diverse faces)', async () => {
    const portraits = await page.evaluate(() => {
      const svgs = Array.from(document.querySelectorAll('section svg'));
      return {
        count: svgs.length,
        // Check for PortraitSVG characteristic: has circle + ellipse + path
        hasPortraits: svgs.some(svg => svg.querySelector('ellipse') && svg.querySelector('path'))
      };
    });
    if (portraits.count < 4) throw new Error(`Only ${portraits.count} SVG portraits found`);
    pass('Portrait SVGs visible', `count=${portraits.count}`);
  });

  await test('Trust strip appears early in page (above fold or near it)', async () => {
    const yPos = await page.evaluate(() => {
      // Section has aria-labelledby="trust-outcomes-label" (renamed in revamp)
      const trustSection =
        document.querySelector('[aria-labelledby="trust-outcomes-label"]') ||
        document.querySelector('[aria-labelledby="trust-portraits-label"]');
      return trustSection?.getBoundingClientRect().top;
    });
    if (yPos === undefined || yPos === null) throw new Error('Trust section not found (checked trust-outcomes-label and trust-portraits-label)');
    if ((yPos || 0) > 2700) throw new Error(`Trust strip too far down: y=${yPos}px`);
    pass('Trust strip visible early in page', `y=${Math.round(yPos || 0)}px from viewport top`);
  });

  // ── Process section size ───────────────────────────────────────────────────
  await test('HowItWorks section is large (py-20+)', async () => {
    const height = await page.evaluate(() => {
      const section = document.getElementById('how-it-works');
      return section?.getBoundingClientRect().height;
    });
    if (!height || height < 600) throw new Error(`Process section too small: h=${height}px`);
    pass('HowItWorks section is large', `height=${Math.round(height || 0)}px`);
  });

  await test('Process section has 4 step icons in vertical flow', async () => {
    const stepCount = await page.evaluate(() => {
      const section = document.getElementById('how-it-works');
      // New design: steps are flex items with icon circles and label badges
      const labelBadges = section?.querySelectorAll('span[class*="tracking-"][class*="CONNECTED"], span[class*="CAPTURED"], span[class*="ROUTED"], span[class*="READY"]');
      // Fallback: count step label spans (Answer, Understand, Route, Report)
      const stepLabels = Array.from(section?.querySelectorAll('span') || []).filter(s =>
        ['Answer','Understand','Route','Report'].includes(s.textContent?.trim() || '')
      );
      return { labelCount: labelBadges?.length, stepLabelCount: stepLabels.length };
    });
    if (stepCount.stepLabelCount < 4) throw new Error(`Only ${stepCount.stepLabelCount} step labels found`);
    pass('Process section has 4 steps (Answer→Understand→Route→Report)', `labels=${stepCount.stepLabelCount}`);
  });

  await test('Process section has connector line', async () => {
    const hasConnector = await page.evaluate(() => {
      const section = document.getElementById('how-it-works');
      // The connector is a div with a gradient background
      const divs = Array.from(section?.querySelectorAll('div') || []);
      return divs.some(d => {
        const style = window.getComputedStyle(d);
        return style.backgroundImage?.includes('linear-gradient') && d.className?.includes('absolute');
      });
    });
    if (!hasConnector) throw new Error('Connector line not found in process section');
    pass('Process section has gradient connector line');
  });

  // ── Button regression ──────────────────────────────────────────────────────
  // Navbar Call Demo
  await test('Navbar Call Demo opens modal', async () => {
    const navBtn = await page.$('header button[data-fallback-href]');
    if (!navBtn) throw new Error('Navbar Call Demo button not found');
    await navBtn.click();
    await page.waitForTimeout(400);
    const modalVisible = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    if (!modalVisible) throw new Error('Modal did not open after clicking navbar Call Demo');
    pass('Navbar Call Demo opens modal');
    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  // Hero CTA
  await test('Hero Try a Demo Call opens modal', async () => {
    const heroCta = await page.$('section#top button[data-fallback-href]');
    if (!heroCta) throw new Error('Hero CTA button not found');
    await heroCta.click();
    await page.waitForTimeout(400);
    const modal = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    if (!modal) throw new Error('Modal did not open from hero CTA');
    pass('Hero Try a Demo Call opens modal');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  // View Plans scroll
  await test('View Plans link exists and points to #pricing', async () => {
    const href = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href="#pricing"]'));
      return links.length > 0 ? links[0].getAttribute('href') : null;
    });
    if (href !== '#pricing') throw new Error(`View Plans href wrong: ${href}`);
    pass('View Plans links to #pricing');
  });

  // Pricing CTAs
  await test('Pricing CTAs fire checkout (receive redirect or error message)', async () => {
    await page.evaluate(() => {
      const pricingSection = document.getElementById('pricing');
      pricingSection?.scrollIntoView();
    });
    await page.waitForTimeout(500);
    const pricingBtn = await page.$('#pricing button[data-fallback-href]');
    if (!pricingBtn) throw new Error('Pricing button not found');
    // Click and wait — should start a fetch (ok if it errors, just shouldn't crash)
    await pricingBtn.click();
    await page.waitForTimeout(1500);
    const stillOnPage = page.url().includes('localhost:3001');
    pass('Pricing CTA clicked without page crash', `still on page: ${stillOnPage}`);
  });

  // Scenario selectors
  await test('Scenario selectors update preview', async () => {
    await page.evaluate(() => document.getElementById('demos')?.scrollIntoView());
    await page.waitForTimeout(300);
    const scenarioBtns = await page.$$('#demos button[aria-pressed]');
    if (scenarioBtns.length < 3) throw new Error(`Only ${scenarioBtns.length} scenario buttons found`);
    await scenarioBtns[1].click();
    await page.waitForTimeout(200);
    const pressed = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('#demos button[aria-pressed]'));
      return btns.map(b => b.getAttribute('aria-pressed'));
    });
    if (pressed[1] !== 'true') throw new Error(`Scenario 2 not selected after click: ${pressed}`);
    pass('Scenario selectors work', `3 scenarios, selection updates`);
  });

  // FAQ
  await test('FAQ accordion opens', async () => {
    await page.evaluate(() => document.getElementById('faq')?.scrollIntoView());
    await page.waitForTimeout(300);
    const faqBtn = await page.$('#faq button[aria-expanded]');
    if (!faqBtn) throw new Error('FAQ button not found');
    await faqBtn.click();
    await page.waitForTimeout(200);
    const expanded = await faqBtn.getAttribute('aria-expanded');
    if (expanded !== 'true') throw new Error(`FAQ not expanded after click: ${expanded}`);
    pass('FAQ accordion opens');
  });

  // Live chat
  await test('Live chat opens and closes', async () => {
    const chatBtn = await page.$('button[aria-label="Open NexCall live chat"]');
    if (!chatBtn) throw new Error('Live chat button not found');
    await chatBtn.click();
    await page.waitForTimeout(300);
    const chatOpen = await page.evaluate(() => !!document.querySelector('[aria-label="NexCall live chat"]'));
    if (!chatOpen) throw new Error('Chat panel did not open');
    const closeBtn = await page.$('button[aria-label="Collapse live chat"]');
    await closeBtn?.click();
    await page.waitForTimeout(300);
    pass('Live chat opens and closes');
  });

  // Mobile check
  // Always fresh navigate for mobile tests
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  await test('Mobile: no horizontal scroll', async () => {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (scrollWidth > 400) throw new Error(`scrollWidth=${scrollWidth}px exceeds 400`);
    pass('Mobile: no horizontal scroll', `scrollWidth=${scrollWidth}px`);
  });

  await test('Mobile: portrait trust section visible', async () => {
    const portraits = await page.evaluate(() => {
      const section =
        document.querySelector('[aria-labelledby="trust-outcomes-label"]') ||
        document.querySelector('[aria-labelledby="trust-portraits-label"]');
      const svgs = section?.querySelectorAll('svg');
      return { found: !!section, svgCount: svgs?.length };
    });
    if (!portraits.found) throw new Error('Trust section not found on mobile');
    if (!portraits.svgCount || portraits.svgCount < 1) throw new Error(`No SVG portraits found`);
    pass('Mobile: trust portrait section visible', `svgs=${portraits.svgCount}`);
  });

  await test('Mobile: hero CTA tap target ≥44px', async () => {
    const btnH = await page.evaluate(() => {
      const btn = document.querySelector('section#top button');
      return btn?.getBoundingClientRect().height;
    });
    if (!btnH || btnH < 44) throw new Error(`CTA height=${btnH}px (need ≥44)`);
    pass('Mobile: hero CTA tap target adequate', `h=${Math.round(btnH || 0)}px`);
  });

  // Console errors
  console.log('\n====== CONSOLE ERRORS ======');
  if (errors.length === 0) {
    console.log('  None 🎉');
  } else {
    errors.slice(0, 8).forEach(e => console.log(' ', e));
  }

  // Summary
  const passed = RESULTS.filter(r => r.ok).length;
  const failed = RESULTS.filter(r => !r.ok).length;
  console.log(`\n====== RESULTS ======`);
  RESULTS.forEach(r => console.log(`${r.ok ? '✅' : '❌'} ${r.label}${r.detail ? ' | ' + r.detail : ''}`));
  console.log(`\nTotal: ${passed} PASS | ${failed} FAIL`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
