/**
 * NexCall — Real Firefox desktop test against nexcall.one (production)
 * Tests all 4 required viewports:  1440x900, 1366x768, 1280x720, 1024x768
 *
 * Checks per viewport:
 *  - page hydrates (React attaches to buttons)
 *  - no JS chunk load failures in console
 *  - hero decrypt does not shift layout
 *  - Navbar Call Demo opens modal
 *  - Hero CTA opens modal
 *  - Pricing CTA fires (checkout or error msg)
 *  - Scenario selector changes selection
 *  - FAQ accordion opens
 *  - Live chat opens
 *  - No invisible overlay blocking clicks
 *
 * If ETP blocks chunks, the test captures:
 *  - exact "Loading failed" or "Refused to execute" messages
 *  - whether REACT ON BTN = false
 *  - network request failures
 */
import { firefox } from 'playwright';

const TARGET = 'https://nexcall.one';
const VIEWPORTS = [
  { width: 1440, height: 900, label: '1440x900' },
  { width: 1366, height: 768, label: '1366x768' },
  { width: 1280, height: 720, label: '1280x720' },
  { width: 1024, height: 768, label: '1024x768' },
];

const GRAND_RESULTS = [];

function log(ok, vp, label, detail = '') {
  const sym = ok ? '✅' : '❌';
  const entry = { ok, vp, label, detail };
  GRAND_RESULTS.push(entry);
  console.log(`  ${sym} [${vp}] ${label}${detail ? ' | ' + detail : ''}`);
}

async function testViewport(browser, vp) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    // Use default Firefox prefs — standard ETP "Standard" mode, not "Strict"
    // This mirrors what a typical Firefox user has
  });

  const consoleErrors = [];
  const networkFailed = [];

  const page = await ctx.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      const text = msg.text();
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push('PAGEERROR: ' + err.message);
  });

  page.on('requestfailed', req => {
    const url = req.url();
    const failure = req.failure()?.errorText || 'unknown';
    // Only capture JS/CSS chunk failures
    if (url.includes('/_next/static/') || url.includes('.js') || url.includes('.css')) {
      networkFailed.push(`${failure}: ${url}`);
    }
  });

  // ── Load page ────────────────────────────────────────────────────────────────
  try {
    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (e) {
    log(false, vp.label, 'Page load', `FAILED: ${e.message.slice(0, 100)}`);
    await ctx.close();
    return;
  }

  // Wait for hydration (up to 8s)
  let hydrated = false;
  for (let i = 0; i < 16; i++) {
    hydrated = await page.evaluate(() => {
      const btn = document.querySelector('button');
      if (!btn) return false;
      return Object.keys(btn).some(k => k.startsWith('__react'));
    });
    if (hydrated) break;
    await page.waitForTimeout(500);
  }

  // ── Hydration check ──────────────────────────────────────────────────────────
  log(hydrated, vp.label, 'React hydrated (REACT ON BTN)', hydrated ? 'true' : 'false — React never attached');

  // ── Chunk load failures ──────────────────────────────────────────────────────
  // Let extra time pass for lazy chunks
  await page.waitForTimeout(2000);

  const jsChunkErrors = consoleErrors.filter(e =>
    e.includes('Loading failed') ||
    e.includes('Refused to execute') ||
    e.includes('Refused to apply style') ||
    e.includes('net::ERR') ||
    e.includes('NS_ERROR')
  );

  const etpBlocked = consoleErrors.some(e =>
    e.toLowerCase().includes('fingerprint') ||
    e.toLowerCase().includes('tracking')
  );

  if (jsChunkErrors.length === 0 && networkFailed.length === 0) {
    log(true, vp.label, 'No JS/CSS chunk load failures', 'all chunks loaded');
  } else {
    log(false, vp.label, 'Chunk load failures detected', `${jsChunkErrors.length} console + ${networkFailed.length} network`);
    jsChunkErrors.slice(0, 5).forEach(e => console.log(`    CONSOLE: ${e.slice(0, 140)}`));
    networkFailed.slice(0, 5).forEach(e => console.log(`    NETWORK: ${e.slice(0, 140)}`));
  }

  if (etpBlocked) {
    log(false, vp.label, 'Firefox ETP/Fingerprinting Protection active', 'browser fingerprinting protection altering values');
  } else {
    log(true, vp.label, 'No ETP fingerprinting messages', 'Standard mode or protection not triggered');
  }

  // ── Hero layout shift ────────────────────────────────────────────────────────
  const h1Before = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.getBoundingClientRect().height : -1;
  });

  await page.waitForTimeout(1600); // through 1200ms animation

  const h1After = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.getBoundingClientRect().height : -1;
  });

  const heightDiff = Math.abs(h1Before - h1After);
  log(heightDiff <= 2, vp.label, 'Hero h1 height stable (no layout shift)',
    `before=${Math.round(h1Before)}px after=${Math.round(h1After)}px diff=${heightDiff}px`);

  // Skip interaction tests if React didn't hydrate — they'll fail trivially
  if (!hydrated) {
    console.log(`  ⚠  [${vp.label}] Skipping interaction tests — React not hydrated`);
    // Report all remaining as fail
    const skipped = [
      'Navbar Call Demo opens modal',
      'Hero CTA opens modal',
      'Pricing CTA fires',
      'Scenario selector works',
      'FAQ accordion opens',
      'Live chat opens',
      'No invisible overlay blocking clicks',
    ];
    skipped.forEach(label => log(false, vp.label, label, 'SKIPPED — React not hydrated'));

    // Capture all console errors for diagnosis
    console.log(`\n  === All console messages [${vp.label}] ===`);
    consoleErrors.slice(0, 15).forEach(e => console.log(`    ${e.slice(0, 160)}`));
    await ctx.close();
    return;
  }

  // ── Invisible overlay check ──────────────────────────────────────────────────
  const overlayBlocking = await page.evaluate(() => {
    // Check if any full-page fixed div with pointer-events is covering the Call Demo btn
    const btn = document.querySelector('header button');
    if (!btn) return { blocked: false, reason: 'no button found' };
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const topEl = document.elementFromPoint(cx, cy);
    const isBtn = topEl === btn || btn.contains(topEl);
    return {
      blocked: !isBtn,
      topElementTag: topEl?.tagName,
      topElementClass: topEl?.className?.slice(0, 60)
    };
  });

  log(!overlayBlocking.blocked, vp.label, 'No invisible overlay blocking navbar button',
    overlayBlocking.blocked
      ? `BLOCKED by <${overlayBlocking.topElementTag}> class="${overlayBlocking.topElementClass}"`
      : `top element is button`);

  // ── Navbar Call Demo ─────────────────────────────────────────────────────────
  try {
    const navBtn = await page.$('header button[data-fallback-href]');
    if (!navBtn) throw new Error('Navbar Call Demo button not found in DOM');
    await navBtn.click({ timeout: 5000 });
    await page.waitForTimeout(600);
    const modalOpen = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    log(modalOpen, vp.label, 'Navbar Call Demo opens modal', modalOpen ? 'modal visible' : 'no [role=dialog] found');
    if (modalOpen) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }
  } catch (e) {
    log(false, vp.label, 'Navbar Call Demo opens modal', e.message.slice(0, 80));
  }

  // ── Hero CTA ─────────────────────────────────────────────────────────────────
  try {
    const heroCta = await page.$('section#top button[data-fallback-href]');
    if (!heroCta) throw new Error('Hero CTA button not found');
    await heroCta.click({ timeout: 5000 });
    await page.waitForTimeout(600);
    const modalOpen = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    log(modalOpen, vp.label, 'Hero CTA opens modal', modalOpen ? 'modal visible' : 'no [role=dialog]');
    if (modalOpen) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }
  } catch (e) {
    log(false, vp.label, 'Hero CTA opens modal', e.message.slice(0, 80));
  }

  // ── Pricing ──────────────────────────────────────────────────────────────────
  try {
    await page.evaluate(() => document.getElementById('pricing')?.scrollIntoView());
    await page.waitForTimeout(500);
    const pricingBtn = await page.$('#pricing button[data-fallback-href]');
    if (!pricingBtn) throw new Error('No pricing button found');
    await pricingBtn.click({ timeout: 5000 });
    await page.waitForTimeout(2000);
    // Check: either redirected to Stripe OR an error message appeared OR spinner shown
    const result = await page.evaluate(() => {
      const isStripe = window.location.href.includes('stripe.com') || window.location.href.includes('checkout');
      const hasError = !!document.querySelector('[class*="amber"]');
      const hasSpinner = !!document.querySelector('svg.animate-spin');
      return { isStripe, hasError, hasSpinner, url: window.location.href };
    });
    const fired = result.isStripe || result.hasError || result.hasSpinner;
    log(fired, vp.label, 'Pricing CTA fires checkout',
      result.isStripe ? 'redirected to Stripe' :
      result.hasError ? 'error message shown (no Stripe keys in env — expected)' :
      result.hasSpinner ? 'spinner active' :
      `no reaction — url=${result.url.slice(0, 80)}`);
  } catch (e) {
    log(false, vp.label, 'Pricing CTA fires checkout', e.message.slice(0, 80));
  }

  // Navigate back if we left the page
  if (!page.url().includes('nexcall.one')) {
    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
  }

  // ── Scenario selector ────────────────────────────────────────────────────────
  try {
    await page.evaluate(() => document.getElementById('demos')?.scrollIntoView());
    await page.waitForTimeout(400);
    const scenarioBtns = await page.$$('#demos button[aria-pressed]');
    if (scenarioBtns.length < 2) throw new Error(`Only ${scenarioBtns.length} scenario buttons`);
    await scenarioBtns[1].click({ timeout: 5000 });
    await page.waitForTimeout(300);
    const pressed = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('#demos button[aria-pressed]'));
      return btns.map(b => b.getAttribute('aria-pressed'));
    });
    log(pressed[1] === 'true', vp.label, 'Scenario selector changes selection', `aria-pressed[1]=${pressed[1]}`);
  } catch (e) {
    log(false, vp.label, 'Scenario selector changes selection', e.message.slice(0, 80));
  }

  // ── FAQ ──────────────────────────────────────────────────────────────────────
  try {
    await page.evaluate(() => document.getElementById('faq')?.scrollIntoView());
    await page.waitForTimeout(400);
    const faqBtn = await page.$('#faq button[aria-expanded]');
    if (!faqBtn) throw new Error('No FAQ button found');
    await faqBtn.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    const expanded = await faqBtn.getAttribute('aria-expanded');
    log(expanded === 'true', vp.label, 'FAQ accordion opens', `aria-expanded=${expanded}`);
  } catch (e) {
    log(false, vp.label, 'FAQ accordion opens', e.message.slice(0, 80));
  }

  // ── Live chat ────────────────────────────────────────────────────────────────
  try {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    const chatBtn = await page.$('button[aria-label="Open NexCall live chat"]');
    if (!chatBtn) throw new Error('Live chat button not found');
    await chatBtn.click({ timeout: 5000 });
    await page.waitForTimeout(400);
    const chatOpen = await page.evaluate(() => !!document.querySelector('[aria-label="NexCall live chat"]'));
    log(chatOpen, vp.label, 'Live chat opens', chatOpen ? 'panel visible' : 'panel not found');
  } catch (e) {
    log(false, vp.label, 'Live chat opens', e.message.slice(0, 80));
  }

  // ── Console summary ──────────────────────────────────────────────────────────
  const significant = consoleErrors.filter(e =>
    e.includes('Loading failed') ||
    e.includes('Refused to execute') ||
    e.includes('PAGEERROR') ||
    e.includes('fingerprint') ||
    e.includes('NS_ERROR')
  );
  if (significant.length > 0) {
    console.log(`\n  === Key console errors [${vp.label}] ===`);
    significant.slice(0, 10).forEach(e => console.log(`    ${e.slice(0, 160)}`));
  }

  await ctx.close();
}

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`NexCall Firefox Desktop Test — ${TARGET}`);
  console.log(`Firefox version: Playwright Firefox v1522 (FF 150.0.2)`);
  console.log(`${'='.repeat(60)}\n`);

  const browser = await firefox.launch({
    headless: true,
    firefoxUserPrefs: {
      // Use Standard ETP (not Strict) — matches most real Firefox users
      'browser.contentblocking.category': 'standard',
      // Disable forced HTTPS upgrading for localhost
      'dom.security.https_only_mode': false,
    }
  });

  for (const vp of VIEWPORTS) {
    console.log(`\n--- ${vp.label} ---`);
    await testViewport(browser, vp);
  }

  await browser.close();

  // ── Grand summary ─────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(60)}`);
  console.log('GRAND SUMMARY');
  console.log(`${'='.repeat(60)}`);

  for (const vp of VIEWPORTS) {
    const vpResults = GRAND_RESULTS.filter(r => r.vp === vp.label);
    const p = vpResults.filter(r => r.ok).length;
    const f = vpResults.filter(r => !r.ok).length;
    console.log(`\n[${vp.label}] ${p} PASS / ${f} FAIL`);
    vpResults.forEach(r => console.log(`  ${r.ok ? '✅' : '❌'} ${r.label}${r.detail ? ' | ' + r.detail : ''}`));
  }

  const totalPass = GRAND_RESULTS.filter(r => r.ok).length;
  const totalFail = GRAND_RESULTS.filter(r => !r.ok).length;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TOTAL: ${totalPass} PASS | ${totalFail} FAIL`);
  console.log(`${'='.repeat(60)}\n`);

  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
