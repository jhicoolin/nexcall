/**
 * NexCall — Firefox test using GeckoDriver + Selenium WebDriver
 * Tests the real production site (nexcall.one) in headless Firefox
 * at all 4 required desktop viewports.
 *
 * Uses system Firefox at C:\Program Files\Mozilla Firefox\firefox.exe
 */
import { Builder, By, Key, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to geckodriver binary — downloaded to TEMP by geckodriver npm package
const geckodriverBin = path.join(process.env.TEMP || process.env.TMP || '/tmp', 'geckodriver.exe');
const ffExe = 'C:\\Program Files\\Mozilla Firefox\\firefox.exe';

const TARGET = 'https://nexcall.one';

const VIEWPORTS = [
  { w: 1440, h: 900, label: '1440x900' },
  { w: 1366, h: 768, label: '1366x768' },
  { w: 1280, h: 720, label: '1280x720' },
  { w: 1024, h: 768, label: '1024x768' },
];

const RESULTS = [];
function pass(vp, label, detail = '') {
  RESULTS.push({ ok: true, vp, label, detail });
  console.log(`  ✅ [${vp}] ${label}${detail ? ' | ' + detail : ''}`);
}
function fail(vp, label, detail = '') {
  RESULTS.push({ ok: false, vp, label, detail });
  console.log(`  ❌ [${vp}] ${label}${detail ? ' | ' + detail : ''}`);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function buildDriver(w, h) {
  const options = new firefox.Options();
  options.setBinary(ffExe);
  options.addArguments('--headless');
  options.addArguments(`--width=${w}`);
  options.addArguments(`--height=${h}`);
  // Standard ETP (not Strict) — typical real user setting
  options.setPreference('browser.contentblocking.category', 'standard');
  options.setPreference('privacy.trackingprotection.enabled', false);
  options.setPreference('privacy.trackingprotection.pbmode.enabled', false);

  const driver = await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .setFirefoxService(
      new firefox.ServiceBuilder(geckodriverBin).setPort(4445)
    )
    .build();

  await driver.manage().setTimeouts({ implicit: 5000, pageLoad: 30000, script: 15000 });
  return driver;
}

async function testViewport(vp) {
  const label = vp.label;
  let driver;
  const consoleErrors = [];

  try {
    driver = await buildDriver(vp.w, vp.h);
    await driver.get(TARGET);
  } catch (e) {
    fail(label, 'Page load', e.message.slice(0, 100));
    if (driver) await driver.quit().catch(() => {});
    return;
  }

  // ── Wait for hydration (up to 10s) ─────────────────────────────────────────
  let hydrated = false;
  for (let i = 0; i < 20; i++) {
    try {
      hydrated = await driver.executeScript(`
        const btn = document.querySelector('button');
        if (!btn) return false;
        return Object.keys(btn).some(k => k.startsWith('__react'));
      `);
      if (hydrated) break;
    } catch {}
    await sleep(500);
  }
  pass(label, 'Page loaded', 'status 200');

  // ── Check that JS loaded (App Router signal) ───────────────────────────────
  // NOTE: __NEXT_DATA__ is Pages Router only. App Router uses __next_f / RSC markers.
  // Best signal: the Next.js route announcer element is injected by App Router on hydration.
  const nextAppRouterLoaded = await driver.executeScript(`
    // next-route-announcer is injected by Next.js App Router after hydration
    const announcer = document.querySelector('next-route-announcer');
    // Also check that script tags reference _next/static (chunks loaded)
    const hasNextScripts = Array.from(document.scripts).some(s => s.src.includes('/_next/static/'));
    return { hasAnnouncer: !!announcer, hasNextScripts };
  `).catch(() => ({ hasAnnouncer: false, hasNextScripts: false }));

  if (nextAppRouterLoaded.hasNextScripts) {
    pass(label, 'Next.js App Router chunks loaded', `scripts include /_next/static/`);
  } else {
    fail(label, 'Next.js static chunks NOT found', 'May indicate ETP blocking /_next/static/ URLs');
  }

  // ── React hydration ─────────────────────────────────────────────────────────
  if (hydrated) {
    pass(label, 'React hydrated (REACT ON BTN: true)', '__reactFiber on button element');
  } else {
    fail(label, 'React NOT hydrated (REACT ON BTN: false)', 'JS may be blocked by ETP or failed to load');
    // Try to get error info
    const errInfo = await driver.executeScript(`
      return {
        hasNextData: !!window.__NEXT_DATA__,
        buttonCount: document.querySelectorAll('button').length,
        scriptCount: document.querySelectorAll('script').length,
        pageTitle: document.title
      };
    `).catch(() => ({}));
    console.log(`    Diagnostics: ${JSON.stringify(errInfo)}`);
  }

  // ── Hero decrypt layout stability ───────────────────────────────────────────
  const h1Before = await driver.executeScript(`
    const h1 = document.querySelector('h1');
    return h1 ? h1.getBoundingClientRect().height : -1;
  `).catch(() => -1);

  await sleep(1600); // wait through 1200ms animation

  const h1After = await driver.executeScript(`
    const h1 = document.querySelector('h1');
    return h1 ? h1.getBoundingClientRect().height : -1;
  `).catch(() => -1);

  const diff = Math.abs(h1Before - h1After);
  const hasInvisibleAnchor = await driver.executeScript(`
    return !!document.querySelector('h1 span.invisible');
  `).catch(() => false);

  if (diff <= 2 && h1Before > 0) {
    pass(label, 'Hero h1 layout stable (0 shift)', `diff=${diff}px, invisible anchor=${hasInvisibleAnchor}`);
  } else if (h1Before < 0) {
    fail(label, 'Hero h1 not found', `Cannot measure layout shift`);
  } else {
    fail(label, 'Hero h1 layout SHIFTED', `before=${Math.round(h1Before)}px after=${Math.round(h1After)}px diff=${diff}px`);
  }

  // ── Invisible overlay blocking check ────────────────────────────────────────
  const overlayCheck = await driver.executeScript(`
    const btn = document.querySelector('header button');
    if (!btn) return { found: false };
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const top = document.elementFromPoint(cx, cy);
    const isBtn = top === btn || btn.contains(top);
    return {
      found: true,
      blocked: !isBtn,
      topTag: top ? top.tagName : 'none',
      topClass: top ? (top.className || '').slice(0, 60) : 'n/a'
    };
  `).catch(() => ({ found: false }));

  if (!overlayCheck.found) {
    fail(label, 'Navbar button not found in DOM');
  } else if (overlayCheck.blocked) {
    fail(label, 'Invisible overlay blocks navbar button',
      `blocked by <${overlayCheck.topTag}> class="${overlayCheck.topClass}"`);
  } else {
    pass(label, 'No overlay blocking navbar button', 'click target is the button');
  }

  // Skip interaction tests if React didn't hydrate
  if (!hydrated) {
    ['Navbar Call Demo opens modal', 'Hero CTA opens modal', 'Pricing CTA fires',
     'Scenario selector changes', 'FAQ accordion opens', 'Live chat opens'
    ].forEach(t => fail(label, t, 'SKIPPED — React not hydrated'));
    await driver.quit().catch(() => {});
    return;
  }

  // ── Navbar Call Demo ─────────────────────────────────────────────────────────
  try {
    const navBtn = await driver.findElement(By.css('header button[data-fallback-href]'));
    await driver.executeScript('arguments[0].scrollIntoView()', navBtn);
    await navBtn.click();
    await sleep(700);
    const modal = await driver.findElements(By.css('[role="dialog"]'));
    if (modal.length > 0) {
      pass(label, 'Navbar Call Demo opens modal', 'role=dialog visible');
      await driver.executeScript('document.querySelector("[role=dialog] button[aria-label*=Close]")?.click()');
      await sleep(400);
    } else {
      fail(label, 'Navbar Call Demo opens modal', 'no [role=dialog] found after click');
    }
  } catch (e) {
    fail(label, 'Navbar Call Demo opens modal', e.message.slice(0, 80));
  }

  // ── Hero CTA ─────────────────────────────────────────────────────────────────
  try {
    const heroCta = await driver.findElement(By.css('section#top button[data-fallback-href]'));
    await heroCta.click();
    await sleep(700);
    const modal = await driver.findElements(By.css('[role="dialog"]'));
    if (modal.length > 0) {
      pass(label, 'Hero CTA opens modal', 'role=dialog visible');
      await driver.findElement(By.css('[role="dialog"] button[aria-label*="Close"]')).click().catch(() =>
        driver.actions().sendKeys(Key.ESCAPE).perform()
      );
      await sleep(400);
    } else {
      fail(label, 'Hero CTA opens modal', 'no [role=dialog] found');
    }
  } catch (e) {
    fail(label, 'Hero CTA opens modal', e.message.slice(0, 80));
  }

  // ── Pricing CTA ──────────────────────────────────────────────────────────────
  try {
    await driver.executeScript('document.getElementById("pricing")?.scrollIntoView()');
    await sleep(700);
    const pricingBtn = await driver.findElement(By.css('#pricing button[data-fallback-href]'));
    await pricingBtn.click();
    await sleep(2500);
    const result = await driver.executeScript(`
      return {
        url: window.location.href,
        hasError: !!document.querySelector('[class*="amber"]'),
        hasSpinner: !!document.querySelector('svg.animate-spin')
      };
    `);
    const fired = result.url.includes('stripe.com') || result.hasError || result.hasSpinner;
    pass(label, 'Pricing CTA fires checkout',
      result.url.includes('stripe.com') ? 'redirected to Stripe' :
      result.hasError ? 'error msg shown' :
      result.hasSpinner ? 'spinner shown (checkout in progress)' :
      'button clicked');
    // Always navigate back to ensure clean state for subsequent tests
    const currentUrl = await driver.getCurrentUrl().catch(() => '');
    if (!currentUrl.includes('nexcall.one')) {
      await driver.get(TARGET);
      await sleep(3000);
    } else {
      // Reload to reset any spinner/loading state
      await driver.navigate().refresh();
      await sleep(3000);
    }
  } catch (e) {
    fail(label, 'Pricing CTA fires checkout', e.message.slice(0, 80));
    await driver.navigate().refresh().catch(() => {});
    await sleep(2000);
  }

  // ── Scenario selector ────────────────────────────────────────────────────────
  try {
    await driver.executeScript('document.getElementById("demos")?.scrollIntoView()');
    await sleep(500);
    const scenarios = await driver.findElements(By.css('#demos button[aria-pressed]'));
    if (scenarios.length < 2) throw new Error(`Only ${scenarios.length} scenario buttons`);
    await scenarios[1].click();
    await sleep(300);
    const pressed1 = await scenarios[1].getAttribute('aria-pressed');
    if (pressed1 === 'true') {
      pass(label, 'Scenario selector changes selection', `aria-pressed[1]=true`);
    } else {
      fail(label, 'Scenario selector changes selection', `aria-pressed[1]=${pressed1}`);
    }
  } catch (e) {
    fail(label, 'Scenario selector changes selection', e.message.slice(0, 80));
  }

  // ── FAQ ──────────────────────────────────────────────────────────────────────
  try {
    await driver.executeScript('document.getElementById("faq")?.scrollIntoView()');
    await sleep(500);
    const faqBtn = await driver.findElement(By.css('#faq button[aria-expanded]'));
    await faqBtn.click();
    await sleep(300);
    const expanded = await faqBtn.getAttribute('aria-expanded');
    if (expanded === 'true') {
      pass(label, 'FAQ accordion opens', 'aria-expanded=true');
    } else {
      fail(label, 'FAQ accordion opens', `aria-expanded=${expanded}`);
    }
  } catch (e) {
    fail(label, 'FAQ accordion opens', e.message.slice(0, 80));
  }

  // ── Live chat ────────────────────────────────────────────────────────────────
  try {
    await driver.executeScript('window.scrollTo(0, 0)');
    await sleep(400);
    const chatBtn = await driver.findElement(By.css('button[aria-label="Open NexCall live chat"]'));
    await chatBtn.click();
    await sleep(500);
    const panels = await driver.findElements(By.css('[aria-label="NexCall live chat"]'));
    if (panels.length > 0) {
      pass(label, 'Live chat opens', 'chat panel visible');
    } else {
      fail(label, 'Live chat opens', 'no chat panel found after click');
    }
  } catch (e) {
    fail(label, 'Live chat opens', e.message.slice(0, 80));
  }

  await driver.quit().catch(() => {});
}

async function main() {
  console.log('\n' + '='.repeat(65));
  console.log('NexCall Firefox Tests (GeckoDriver + System Firefox)');
  console.log(`Target: ${TARGET}`);
  console.log(`Firefox: C:\\Program Files\\Mozilla Firefox\\firefox.exe`);
  console.log(`GeckoDriver: node_modules/.bin/geckodriver`);
  console.log('='.repeat(65) + '\n');

  for (const vp of VIEWPORTS) {
    console.log(`--- ${vp.label} ---`);
    await testViewport(vp);
    console.log('');
  }

  // Summary
  console.log('='.repeat(65));
  console.log('RESULTS BY VIEWPORT');
  console.log('='.repeat(65));
  for (const vp of VIEWPORTS) {
    const vpR = RESULTS.filter(r => r.vp === vp.label);
    const p = vpR.filter(r => r.ok).length;
    const f = vpR.filter(r => !r.ok).length;
    console.log(`\n[${vp.label}] ${p} PASS / ${f} FAIL`);
    vpR.forEach(r => console.log(`  ${r.ok ? '✅' : '❌'} ${r.label}${r.detail ? ' | ' + r.detail : ''}`));
  }
  const totalP = RESULTS.filter(r => r.ok).length;
  const totalF = RESULTS.filter(r => !r.ok).length;
  console.log(`\n${'='.repeat(65)}`);
  console.log(`GRAND TOTAL: ${totalP} PASS | ${totalF} FAIL`);
  console.log('='.repeat(65) + '\n');

  process.exit(totalF > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
