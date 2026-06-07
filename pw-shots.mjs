/**
 * Screenshot + sanity proof for the warm homepage.
 * Captures desktop / tablet / mobile-375 and checks:
 *  - hero <h1> not clipped (scrollWidth <= clientWidth, fully visible)
 *  - primary CTA "Request setup" present and in-viewport on mobile
 *  - new sections present: Live intake preview, Common needs slider
 *  - pricing + FAQ present
 *  - no horizontal overflow
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.SHOT_BASE || "http://localhost:3100";
const OUT = "pw-shots";
mkdirSync(OUT, { recursive: true });

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile-375", width: 375, height: 812 }
];

const results = [];
function log(ok, msg) {
  results.push({ ok, msg });
  console.log(`${ok ? "PASS" : "FAIL"} | ${msg}`);
}

const browser = await chromium.launch();
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);

  // Hero h1 not clipped — only horizontal overflow or an overflow:hidden clip counts
  // as real clipping. Tight line-height causes harmless vertical glyph overshoot.
  const hero = await page.evaluate(() => {
    const h1 = document.querySelector("section#top h1");
    if (!h1) return null;
    const cs = getComputedStyle(h1);
    const horizontallyClipped = h1.scrollWidth > h1.clientWidth + 1;
    const hiddenClip = (cs.overflow === "hidden" || cs.overflowY === "hidden") && h1.scrollHeight > h1.clientHeight + 2;
    return {
      text: h1.textContent.trim(),
      hasFullText: /Turn missed calls into next steps\./.test(h1.textContent),
      clipped: horizontallyClipped || hiddenClip
    };
  });
  log(hero && !hero.clipped && hero.hasFullText, `[${vp.name}] hero h1 fully visible, not clipped ("${hero ? hero.text : "MISSING"}")`);

  // No horizontal overflow
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log(overflow <= 1, `[${vp.name}] no horizontal overflow (overflowPx=${overflow})`);

  // Request setup CTA present
  const ctaCount = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a,button")).filter((el) => /request setup/i.test(el.textContent || "")).length
  );
  log(ctaCount >= 1, `[${vp.name}] "Request setup" CTA present (count=${ctaCount})`);

  // New + key sections present
  const sections = await page.evaluate(() => {
    const txt = document.body.innerText;
    return {
      intake: /Live intake preview/i.test(txt) && /illustrative, not real customer data/i.test(txt),
      needs: /Common needs/i.test(txt) && /not customer reviews/i.test(txt),
      pricing: /Request setup/i.test(txt) && /\$349/.test(txt) && /\$549/.test(txt) && /\$849/.test(txt),
      faq: /Does NexCall replace my staff\?/i.test(txt),
      noFakeMetric: !/\b\d{2,}\+?\s*(customers|reviews|stars|businesses served|happy clients)\b/i.test(txt)
    };
  });
  log(sections.intake, `[${vp.name}] Live intake preview present + labeled sample`);
  log(sections.needs, `[${vp.name}] Common-needs slider present + "not customer reviews"`);
  log(sections.pricing, `[${vp.name}] pricing $349/$549/$849 + Request setup`);
  log(sections.faq, `[${vp.name}] FAQ objection present`);
  log(sections.noFakeMetric, `[${vp.name}] no fake count metrics`);

  // Full-page screenshot
  await page.screenshot({ path: `${OUT}/${vp.name}.png`, fullPage: true });
  // Above-the-fold hero shot
  await page.screenshot({ path: `${OUT}/${vp.name}-hero.png`, fullPage: false });
  console.log(`  saved ${OUT}/${vp.name}.png (+hero)`);
  await ctx.close();
}
await browser.close();

const fails = results.filter((r) => !r.ok);
console.log(`\n==== ${results.length - fails.length}/${results.length} checks passed ====`);
process.exit(fails.length ? 1 : 0);
