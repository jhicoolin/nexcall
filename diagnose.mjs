import { chromium } from 'playwright';

const BASE = 'https://nexcall.one';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const consoleLogs = [];
  const networkFails = [];

  page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', e => consoleLogs.push({ type: 'pageerror', text: e.message }));
  page.on('requestfailed', req => networkFails.push({ url: req.url(), reason: req.failure()?.errorText }));

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);

  // Deep check
  const state = await page.evaluate(() => {
    const btn = document.querySelector('button');
    const h1 = document.querySelector('h1');
    const heroCta = document.querySelector('section#top button');
    const modal = document.querySelector('[role="dialog"]');
    const heroSection = document.getElementById('top');

    return {
      reactOnBtn: btn ? Object.keys(btn).some(k => k.startsWith('__react')) : 'no button',
      h1Text: h1?.textContent?.trim().slice(0, 50),
      h1Height: h1?.getBoundingClientRect().height,
      heroHeight: heroSection?.getBoundingClientRect().height,
      heroSectionClass: heroSection?.className.slice(0, 100),
      heroCTAFound: !!heroCta,
      heroCTADims: heroCta ? `${Math.round(heroCta.getBoundingClientRect().width)}x${Math.round(heroCta.getBoundingClientRect().height)}` : 'missing',
      heroCTAVisible: heroCta ? window.getComputedStyle(heroCta).visibility : 'n/a',
      heroCTAPointerEvents: heroCta ? window.getComputedStyle(heroCta).pointerEvents : 'n/a',
      topElementAtCTA: (() => {
        if (!heroCta) return 'no CTA';
        const r = heroCta.getBoundingClientRect();
        const el = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
        return el ? `${el.tagName}.${el.className.slice(0,40)}` : 'null';
      })(),
      modalOpen: !!modal,
      bodyOverflow: window.getComputedStyle(document.body).overflow,
      htmlOverflow: window.getComputedStyle(document.documentElement).overflow,
    };
  });

  console.log('\n=== PAGE STATE ===');
  console.log(JSON.stringify(state, null, 2));

  console.log('\n=== CONSOLE ERRORS ===');
  const errors = consoleLogs.filter(l => l.type === 'error' || l.type === 'pageerror');
  if (errors.length === 0) console.log('None');
  errors.forEach(e => console.log(`[${e.type}] ${e.text.slice(0, 200)}`));

  console.log('\n=== NETWORK FAILURES ===');
  const jsFailures = networkFails.filter(r => r.url.includes('_next') || r.url.includes('.js'));
  if (jsFailures.length === 0) console.log('None');
  jsFailures.forEach(r => console.log(`FAIL: ${r.url.slice(0, 100)} — ${r.reason}`));

  console.log('\n=== ALL CONSOLE LOGS (errors + warnings) ===');
  consoleLogs.filter(l => ['error','warning','pageerror'].includes(l.type))
    .forEach(l => console.log(`[${l.type}] ${l.text.slice(0, 160)}`));

  // Click the CTA and see what happens
  console.log('\n=== CLICKING HERO CTA ===');
  try {
    const cta = await page.$('section#top button');
    if (cta) {
      await cta.click();
      await page.waitForTimeout(1000);
      const afterClick = await page.evaluate(() => ({
        modalOpen: !!document.querySelector('[role="dialog"]'),
        url: window.location.href
      }));
      console.log('After click:', afterClick);
    } else {
      console.log('No hero CTA found');
    }
  } catch(e) {
    console.log('Click error:', e.message);
  }

  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
