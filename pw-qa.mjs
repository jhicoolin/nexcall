/**
 * NexCall launch visual QA. Captures screenshots + asserts failure modes.
 * Viewports: desktop 1440, tablet 768, mobile 375 + 390.
 * Robust against local cold-start (reloads if CSS hasn't applied yet).
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.QA_BASE || "http://localhost:3102";
const OUT = "pw-qa";
mkdirSync(OUT, { recursive: true });

const results = [];
const note = (ok, sev, msg) => {
  results.push({ ok, sev, msg });
  console.log(`${ok ? "PASS" : `FAIL[${sev}]`} | ${msg}`);
};

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile375", width: 375, height: 812 },
  { name: "mobile390", width: 390, height: 844 }
];

// Force a fresh, retried fetch of static CSS so a one-time local cold-start
// 400 (which the browser would otherwise cache) cannot leave the page unstyled.
async function ensureFreshCss(page) {
  await page.route("**/_next/static/css/**", async (route) => {
    for (let i = 0; i < 8; i++) {
      try {
        const resp = await route.fetch();
        if (resp.status() === 200) {
          await route.fulfill({ response: resp });
          return;
        }
      } catch {
        // retry
      }
      await new Promise((r) => setTimeout(r, 350));
    }
    await route.continue();
  });
}

// Ensure the page is actually styled (guards against cold-start CSS race).
async function loadStyled(page, url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(900);
    const styled = await page.evaluate(() => {
      const cta = document.querySelector('section#top a[href="#lead"]');
      if (!cta) return false;
      const bg = getComputedStyle(cta).backgroundColor;
      return bg === "rgb(111, 143, 52)"; // warm green = stylesheet applied
    });
    if (styled) return true;
    await page.waitForTimeout(700);
  }
  return false;
}

const browser = await chromium.launch();

// Prime the server once so static handlers are warm before measurements.
{
  const warm = await browser.newContext();
  const wp = await warm.newPage();
  await ensureFreshCss(wp);
  await loadStyled(wp, BASE);
  await warm.close();
}

for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await ensureFreshCss(page);
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push(String(e)));

  const styled = await loadStyled(page, BASE);
  note(styled, "HIGH", `[${vp.name}] stylesheet applied (page is styled)`);

  // Page-level horizontal overflow
  const docOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  note(docOverflow <= 1, "HIGH", `[${vp.name}] page horizontal overflow = ${docOverflow}px`);

  // Per-element overflow
  const offenders = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > vw + 2 || r.left < -2)) {
        const cls = el.className && el.className.toString ? el.className.toString().slice(0, 36) : "";
        out.push(`${el.tagName.toLowerCase()}.${cls}`);
      }
    }
    return out.slice(0, 6);
  });
  note(offenders.length === 0, "HIGH", `[${vp.name}] elements overflowing viewport = ${offenders.length}${offenders.length ? " :: " + offenders.join(" | ") : ""}`);

  // Clipped headings
  const clipped = await page.evaluate(() => {
    const bad = [];
    for (const h of document.querySelectorAll("h1,h2,h3")) {
      const cs = getComputedStyle(h);
      const hiddenClip = (cs.overflow === "hidden" || cs.overflowX === "hidden") && h.scrollWidth > h.clientWidth + 2;
      if (hiddenClip || (cs.textOverflow === "ellipsis" && h.scrollWidth > h.clientWidth + 2)) bad.push((h.textContent || "").trim().slice(0, 36));
    }
    return bad;
  });
  note(clipped.length === 0, "HIGH", `[${vp.name}] clipped headings = ${clipped.length}${clipped.length ? " :: " + clipped.join(" | ") : ""}`);

  // Hero full text
  const hero = await page.evaluate(() => {
    const h1 = document.querySelector("section#top h1");
    return h1 ? { ok: /Turn missed calls into next steps\./.test(h1.textContent), text: h1.textContent.trim() } : { ok: false, text: "MISSING" };
  });
  note(hero.ok, "HIGH", `[${vp.name}] hero h1 full ("${hero.text}")`);

  // Request-demo posture
  const posture = await page.evaluate(() => {
    const txt = document.body.innerText;
    return {
      requestSetup: (txt.match(/request setup/gi) || []).length,
      checkoutHonest: /checkout isn'?t open yet/i.test(txt),
      badVerbs: (txt.match(/\b(buy now|add to cart|subscribe now|start free trial|checkout now|purchase now)\b/gi) || []),
      fakeMetrics: (txt.match(/\b\d{2,}\+?\s*(customers|reviews|five[- ]star|businesses served|happy clients|users)\b/gi) || [])
    };
  });
  note(posture.requestSetup >= 1, "HIGH", `[${vp.name}] "Request setup" CTA present (count=${posture.requestSetup})`);
  note(posture.checkoutHonest, "MED", `[${vp.name}] honest "checkout isn't open yet" note present`);
  note(posture.badVerbs.length === 0, "HIGH", `[${vp.name}] no self-serve checkout verbs${posture.badVerbs.length ? " :: " + posture.badVerbs.join(",") : ""}`);
  note(posture.fakeMetrics.length === 0, "HIGH", `[${vp.name}] no fake metrics${posture.fakeMetrics.length ? " :: " + posture.fakeMetrics.join(",") : ""}`);

  // Screenshots
  await page.screenshot({ path: `${OUT}/${vp.name}-full.png`, fullPage: true });
  await page.screenshot({ path: `${OUT}/${vp.name}-fold.png`, fullPage: false });

  // Mobile: chat dock must not cover hero CTA
  if (vp.width <= 430) {
    const overlap = await page.evaluate(() => {
      const dock = document.querySelector('[aria-label="Open NexCall live chat"]');
      const cta = document.querySelector('section#top a[href="#lead"]');
      if (!dock || !cta) return { checked: false };
      const d = dock.getBoundingClientRect(), c = cta.getBoundingClientRect();
      return { checked: true, overlaps: !(d.right < c.left || d.left > c.right || d.bottom < c.top || d.top > c.bottom) };
    });
    note(!overlap.checked || !overlap.overlaps, "MED", `[${vp.name}] chat dock does not cover hero CTA`);
  }

  // Primary CTA focus affordance
  const focusRing = await page.evaluate(() => {
    const cta = document.querySelector('section#top a[href="#lead"]');
    if (!cta) return false;
    cta.focus();
    const cs = getComputedStyle(cta);
    return cs.outlineStyle !== "none" || /focus:ring/.test(cta.className) || cs.boxShadow !== "none";
  });
  note(focusRing, "MED", `[${vp.name}] primary CTA has visible focus affordance`);

  note(consoleErrors.length === 0, "MED", `[${vp.name}] no console errors${consoleErrors.length ? " :: " + consoleErrors.slice(0, 2).join(" | ") : ""}`);

  await ctx.close();
}

// Call Demo modal via ?demo=1 (reliable, no click interception)
for (const vp of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile375", width: 375, height: 812 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await ensureFreshCss(page);
  try {
    await loadStyled(page, `${BASE}/?demo=1`);
    await page.waitForTimeout(700);
    const modal = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"][aria-labelledby="outbound-call-title"]');
      if (!dlg) return { open: false };
      const title = document.getElementById("outbound-call-title");
      const m = title ? getComputedStyle(title).color.match(/\d+/g) : null;
      const lum = m ? 0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2] : 255;
      return { open: true, titleText: title ? title.textContent.trim() : "", darkText: lum < 130 };
    });
    note(modal.open, "HIGH", `[${vp.name}] Call Demo modal opens (?demo=1)`);
    note(modal.open && modal.darkText, "HIGH", `[${vp.name}] modal title dark/readable on light panel ("${modal.titleText || ""}")`);
    if (modal.open) await page.screenshot({ path: `${OUT}/${vp.name}-modal.png`, fullPage: false });
  } catch (e) {
    note(false, "HIGH", `[${vp.name}] modal check errored :: ${String(e).slice(0, 80)}`);
  }
  await ctx.close();
}

await browser.close();

const fails = results.filter((r) => !r.ok);
const high = fails.filter((r) => r.sev === "HIGH");
console.log(`\n==== ${results.length - fails.length}/${results.length} checks passed | ${high.length} HIGH failures | ${fails.length - high.length} MED ====`);
if (fails.length) { console.log("FAILURES:"); fails.forEach((f) => console.log(`  [${f.sev}] ${f.msg}`)); }
process.exit(high.length ? 1 : 0);
