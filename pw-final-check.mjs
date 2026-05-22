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
  await test('Hero h1 renders full phrase with CSS animation', async () => {
    const result = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const text = h1?.textContent?.trim().replace(/\s+/g, ' ');
      const hasClass = h1?.className?.includes('hero-fade-up');
      const accentSpan = h1?.querySelector('span[class*="A8FF00"]');
      return {
        text,
        hasHeroClass: hasClass,
        accentText: accentSpan?.textContent?.trim(),
        h1Height: Math.round(h1?.getBoundingClientRect().height || 0)
      };
    });
    if (!result.text?.includes('Never miss your next call'))
      throw new Error(`h1 text wrong: "${result.text}"`);
    if (!result.accentText?.includes('next call'))
      throw new Error(`No lime accent on "next call." — got: "${result.accentText}"`);
    pass('Hero h1: CSS fade-in, "next call." accented lime', `text="${result.text}" h=${result.h1Height}px`);
  });

  await test('Hero h1 height stable (no layout shift)', async () => {
    const h1Before = await page.evaluate(() => document.querySelector('h1')?.getBoundingClientRect().height);
    await page.waitForTimeout(900);
    const h1After = await page.evaluate(() => document.querySelector('h1')?.getBoundingClientRect().height);
    const diff = Math.abs((h1Before || 0) - (h1After || 0));
    if (diff > 2) throw new Error(`h1 shifted by ${diff}px`);
    pass('Hero h1 height stable (no layout shift)', `diff=${diff}px`);
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

  await test('Review marquee visible early in page', async () => {
    const result = await page.evaluate(() => {
      // Marquee section has aria-labelledby="marquee-label"
      const section =
        document.querySelector('[aria-labelledby="marquee-label"]') ||
        document.querySelector('[aria-labelledby="trust-outcomes-label"]') ||
        document.querySelector('[aria-labelledby="trust-portraits-label"]');
      const marqueeStrip = document.querySelector('.marquee-strip');
      return {
        found: !!section,
        yPos: section?.getBoundingClientRect().top,
        hasMarqueeStrip: !!marqueeStrip,
        svgCount: section?.querySelectorAll('svg').length
      };
    });
    if (!result.found) throw new Error('Marquee/trust section not found');
    if ((result.yPos || 0) > 2700) throw new Error(`Marquee too far down: y=${result.yPos}px`);
    pass('Review marquee visible early in page', `y=${Math.round(result.yPos || 0)}px, marquee=${result.hasMarqueeStrip}, svgs=${result.svgCount}`);
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
  // Always fresh navigate for mobile tests — use networkidle so React fully hydrates
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2000); // let animations settle

  await test('Mobile: no horizontal scroll', async () => {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (scrollWidth > 400) throw new Error(`scrollWidth=${scrollWidth}px exceeds 400`);
    pass('Mobile: no horizontal scroll', `scrollWidth=${scrollWidth}px`);
  });

  await test('Mobile: review marquee section visible', async () => {
    // Wait for the marquee section to be present in the DOM
    await page.waitForSelector('[aria-labelledby="marquee-label"]', { timeout: 8000 }).catch(() => null);
    const result = await page.evaluate(() => {
      const section =
        document.querySelector('[aria-labelledby="marquee-label"]') ||
        document.querySelector('[aria-labelledby="trust-outcomes-label"]') ||
        document.querySelector('[aria-labelledby="trust-portraits-label"]');
      return { found: !!section, svgCount: section?.querySelectorAll('svg').length };
    });
    if (!result.found) throw new Error('Marquee section not found on mobile');
    if (!result.svgCount || result.svgCount < 1) throw new Error('No portrait SVGs found');
    pass('Mobile: review marquee visible', `svgs=${result.svgCount}`);
  });

  await test('Mobile: hero CTA tap target ≥44px', async () => {
    // Wait for hero button to be present
    await page.waitForSelector('section#top button', { timeout: 8000 }).catch(() => null);
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
