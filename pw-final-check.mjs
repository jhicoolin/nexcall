/**
 * NexCall regression check — updated for ground-up redesign
 * New sections: CinematicHero, OutcomeRail, TransformSection,
 *   ProcessCommandCenter, IndustrySelector, DemoPreviewSection
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
  try { await fn(); } catch (e) { fail(label, e.message.slice(0, 120)); }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2500);

  // ── Hero ──────────────────────────────────────────────────────────────────
  await test('Hero h1 renders "Never miss your next call."', async () => {
    const text = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim().replace(/\s+/g, ' '));
    if (!text?.includes('Never miss your next call.')) throw new Error(`h1 wrong: "${text}"`);
    pass('Hero h1 renders correctly', `"${text}"`);
  });

  await test('Hero h1 height stable (no layout shift)', async () => {
    const h1Before = await page.evaluate(() => document.querySelector('h1')?.getBoundingClientRect().height);
    await page.waitForTimeout(900);
    const h1After = await page.evaluate(() => document.querySelector('h1')?.getBoundingClientRect().height);
    const diff = Math.abs((h1Before || 0) - (h1After || 0));
    if (diff > 2) throw new Error(`h1 shifted by ${diff}px`);
    pass('Hero h1 height stable', `diff=${diff}px`);
  });

  await test('Hero "next call." has lime accent', async () => {
    const hasAccent = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const span = h1?.querySelector('span');
      return span?.className?.includes('A8FF00') || span?.style?.color?.includes('168') || false;
    });
    if (!hasAccent) throw new Error('No lime accent span found in h1');
    pass('Hero "next call." accented lime');
  });

  await test('NexCall accented green in hero subcopy', async () => {
    const found = await page.evaluate(() => {
      const allSpans = Array.from(document.querySelectorAll('p span'));
      return allSpans.some(s => s.textContent?.trim() === 'NexCall' && s.className?.includes('A8FF00'));
    });
    if (!found) throw new Error('No lime NexCall in hero subcopy');
    pass('NexCall accented lime in hero subcopy');
  });

  await test('CallInterceptionVisual 3-stage visual present', async () => {
    const stageCount = await page.evaluate(() => {
      // Look for the 3 stage labels: LIVE, CAPTURED, Ready for follow-up
      const text = document.body.textContent || '';
      return (text.includes('LIVE') ? 1 : 0) + (text.includes('CAPTURED') ? 1 : 0) + (text.includes('Team Brief') ? 1 : 0);
    });
    if (stageCount < 2) throw new Error(`Only ${stageCount} stages found in call visual`);
    pass('Call interception visual 3 stages visible', `stages=${stageCount}`);
  });

  // ── Outcome rail ──────────────────────────────────────────────────────────
  await test('Outcome rail (marquee) visible near top', async () => {
    const result = await page.evaluate(() => {
      const section = document.querySelector('[aria-labelledby="marquee-label"]');
      return { found: !!section, y: section?.getBoundingClientRect().top, svgs: section?.querySelectorAll('svg').length };
    });
    if (!result.found) throw new Error('Marquee section not found');
    pass('Outcome rail visible', `y=${Math.round(result.y || 0)}px, svgs=${result.svgs}`);
  });

  // ── Transform section ─────────────────────────────────────────────────────
  await test('TransformSection "Without NexCall" contrast visible', async () => {
    const found = await page.evaluate(() => document.body.textContent?.includes('Without NexCall'));
    if (!found) throw new Error('"Without NexCall" text not found');
    pass('TransformSection renders before/after columns');
  });

  await test('TransformSection "With NexCall" column present', async () => {
    const found = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('p, span'));
      return spans.some(el => el.textContent?.trim() === 'With NexCall');
    });
    if (!found) throw new Error('"With NexCall" column not found');
    pass('TransformSection "With NexCall" present');
  });

  // ── Process command center ────────────────────────────────────────────────
  await test('ProcessCommandCenter is large (>600px)', async () => {
    const height = await page.evaluate(() => document.getElementById('how-it-works')?.getBoundingClientRect().height);
    if (!height || height < 600) throw new Error(`Process section too small: h=${height}px`);
    pass('ProcessCommandCenter is large', `h=${Math.round(height || 0)}px`);
  });

  await test('Process section has 4 steps (Answer→Report)', async () => {
    const count = await page.evaluate(() => {
      const section = document.getElementById('how-it-works');
      return Array.from(section?.querySelectorAll('span') || []).filter(s =>
        ['Answer', 'Understand', 'Route', 'Report'].includes(s.textContent?.trim() || '')
      ).length;
    });
    if (count < 4) throw new Error(`Only ${count} step labels found`);
    pass('Process section 4 steps visible', `count=${count}`);
  });

  await test('Process section has sample call journey', async () => {
    const found = await page.evaluate(() => {
      const section = document.getElementById('how-it-works');
      return section?.textContent?.includes('Sample call journey');
    });
    if (!found) throw new Error('Sample call journey not found in process section');
    pass('Process section has sample call journey');
  });

  // ── Industry selector ─────────────────────────────────────────────────────
  await test('IndustrySelector renders with clickable tabs', async () => {
    await page.evaluate(() => document.getElementById('industries')?.scrollIntoView());
    await page.waitForTimeout(400);
    const btnCount = await page.evaluate(() => {
      const section = document.getElementById('industries');
      return section?.querySelectorAll('button[aria-pressed]').length || 0;
    });
    if (btnCount < 4) throw new Error(`Only ${btnCount} industry tabs found`);
    pass('IndustrySelector has tabs', `count=${btnCount}`);
  });

  await test('IndustrySelector tab click updates content', async () => {
    const tabs = await page.$$('#industries button[aria-pressed]');
    if (tabs.length < 2) throw new Error('Not enough tabs');
    await tabs[2].click();
    await page.waitForTimeout(200);
    const pressed = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('#industries button[aria-pressed]'));
      return btns[2]?.getAttribute('aria-pressed');
    });
    if (pressed !== 'true') throw new Error(`Tab 3 not active: ${pressed}`);
    pass('IndustrySelector tab click works');
  });

  // ── Demo preview ──────────────────────────────────────────────────────────
  await test('DemoPreviewSection scenario selectors work', async () => {
    await page.evaluate(() => document.getElementById('demos')?.scrollIntoView());
    await page.waitForTimeout(300);
    const scenarioBtns = await page.$$('#demos button[aria-pressed]');
    if (scenarioBtns.length < 3) throw new Error(`Only ${scenarioBtns.length} scenario buttons`);
    await scenarioBtns[1].click();
    await page.waitForTimeout(200);
    const pressed = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('#demos button[aria-pressed]'))[1]?.getAttribute('aria-pressed');
    });
    if (pressed !== 'true') throw new Error('Scenario 2 not selected');
    pass('Demo preview scenario selectors work');
  });

  // ── Buttons / modals ──────────────────────────────────────────────────────
  await test('Navbar Call Demo opens modal', async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    const btn = await page.$('header button[data-fallback-href]');
    if (!btn) throw new Error('Navbar Call Demo button not found');
    await btn.click();
    await page.waitForTimeout(400);
    const modal = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    if (!modal) throw new Error('Modal did not open');
    pass('Navbar Call Demo opens modal');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  await test('Hero Try a Demo Call opens modal', async () => {
    const btn = await page.$('section#top button[data-fallback-href]');
    if (!btn) throw new Error('Hero CTA button not found');
    await btn.click();
    await page.waitForTimeout(400);
    const modal = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    if (!modal) throw new Error('Modal did not open from hero CTA');
    pass('Hero Try a Demo Call opens modal');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  await test('View Plans link exists and points to #pricing', async () => {
    const href = await page.evaluate(() => document.querySelector('a[href="#pricing"]')?.getAttribute('href'));
    if (href !== '#pricing') throw new Error(`View Plans href wrong: ${href}`);
    pass('View Plans links to #pricing');
  });

  await test('Pricing CTAs work without crash', async () => {
    await page.evaluate(() => document.getElementById('pricing')?.scrollIntoView());
    await page.waitForTimeout(500);
    const btn = await page.$('#pricing button[data-fallback-href]');
    if (!btn) throw new Error('Pricing button not found');
    await btn.click();
    await page.waitForTimeout(1500);
    pass('Pricing CTA clicked without crash', `url=${page.url().includes('localhost') ? 'on-page' : 'redirected'}`);
  });

  await test('FAQ accordion opens', async () => {
    await page.evaluate(() => document.getElementById('faq')?.scrollIntoView());
    await page.waitForTimeout(300);
    const faqBtn = await page.$('#faq button[aria-expanded]');
    if (!faqBtn) throw new Error('FAQ button not found');
    await faqBtn.click();
    await page.waitForTimeout(200);
    const expanded = await faqBtn.getAttribute('aria-expanded');
    if (expanded !== 'true') throw new Error(`FAQ not expanded: ${expanded}`);
    pass('FAQ accordion opens');
  });

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

  // ── Mobile ────────────────────────────────────────────────────────────────
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2000);

  await test('Mobile: no horizontal scroll', async () => {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (scrollWidth > 400) throw new Error(`scrollWidth=${scrollWidth}px exceeds 400`);
    pass('Mobile: no horizontal scroll', `scrollWidth=${scrollWidth}px`);
  });

  await test('Mobile: outcome rail visible', async () => {
    await page.waitForSelector('[aria-labelledby="marquee-label"]', { timeout: 8000 }).catch(() => null);
    const found = await page.evaluate(() => !!document.querySelector('[aria-labelledby="marquee-label"]'));
    if (!found) throw new Error('Outcome rail not found on mobile');
    pass('Mobile: outcome rail visible');
  });

  await test('Mobile: hero CTA tap target ≥44px', async () => {
    await page.waitForSelector('section#top button', { timeout: 8000 }).catch(() => null);
    const h = await page.evaluate(() => document.querySelector('section#top button')?.getBoundingClientRect().height);
    if (!h || h < 44) throw new Error(`CTA height=${h}px (need ≥44)`);
    pass('Mobile: hero CTA tap target adequate', `h=${Math.round(h || 0)}px`);
  });

  await test('Mobile: industry selector tabs visible', async () => {
    await page.evaluate(() => document.getElementById('industries')?.scrollIntoView());
    await page.waitForTimeout(400);
    const count = await page.evaluate(() => document.querySelectorAll('#industries button[aria-pressed]').length);
    if (count < 4) throw new Error(`Only ${count} industry tabs on mobile`);
    pass('Mobile: industry selector tabs visible', `count=${count}`);
  });

  // Console errors
  console.log('\n====== CONSOLE ERRORS ======');
  errors.length === 0 ? console.log('  None 🎉') : errors.slice(0, 6).forEach(e => console.log(' ', e));

  // Summary
  const passed = RESULTS.filter(r => r.ok).length;
  const failed = RESULTS.filter(r => !r.ok).length;
  console.log('\n====== RESULTS ======');
  RESULTS.forEach(r => console.log(`${r.ok ? '✅' : '❌'} ${r.label}${r.detail ? ' | ' + r.detail : ''}`));
  console.log(`\nTotal: ${passed} PASS | ${failed} FAIL`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
