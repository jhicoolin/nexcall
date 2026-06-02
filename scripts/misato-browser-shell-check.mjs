/**
 * MISATO Browser Shell Check
 *
 * What this script checks:
 *   - The Tauri desktop shell (default: http://127.0.0.1:1420) loads without HTTP error
 *   - The page has a non-empty title and body text
 *   - No uncaught page exceptions or console errors in the first ~1s of load
 *
 * What this script does NOT check:
 *   - window.__MISATO_RUNTIME_ORIGIN__ (use misato-browser-contract-check.mjs)
 *   - Fetches to canonical runtime endpoints under the runtime origin
 *   - Any live Hermes API responses
 *   - Runtime state or MISATO_API_BASE_URL contract
 *
 * Human-readable outputs:
 *   Success: "Shell loaded successfully; runtime-origin contract UNVERIFIED — run misato:browser-contract-check to confirm."
 *   Failure: "Shell FAILED to load at {url}: {reason}"
 *
 * Output schema: see scripts/misato-check-schema.mjs
 */

import { checkEntry, buildReport } from "./misato-check-schema.mjs";

const SHELL_URL = process.env.MISATO_SHELL_URL || "http://127.0.0.1:1420";
const WAIT_MS   = Number(process.env.MISATO_SHELL_WAIT_MS || "1000");

async function main() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  const pageErrors    = [];
  const consoleErrors = [];

  page.on("pageerror", (err) => pageErrors.push(String(err?.message || err)));
  page.on("console",   (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  const checks = [];

  // ── Check 1: HTTP load ──────────────────────────────────────────────
  let response;
  try {
    response = await page.goto(SHELL_URL, { waitUntil: "domcontentloaded" });
  } catch (loadErr) {
    checks.push(checkEntry(
      "browser-shell", "http-load", "failed",
      { url: SHELL_URL, error: String(loadErr?.message || loadErr) },
      `Shell did not respond at ${SHELL_URL}. Is Tauri running?`
    ));
    await browser.close();
    console.log(JSON.stringify(buildReport(checks,
      `Shell FAILED to load at ${SHELL_URL} — is Tauri running?`,
      { url: SHELL_URL }
    ), null, 2));
    process.exitCode = 1;
    return;
  }

  const httpStatus = response?.status() ?? 0;
  const httpOk     = response?.ok() ?? false;

  checks.push(checkEntry(
    "browser-shell", "http-load",
    httpOk ? "loaded" : "failed",
    { url: SHELL_URL, httpStatus },
    httpOk
      ? "Shell responded with HTTP 2xx. DOM rendered."
      : `Shell returned HTTP ${httpStatus}. Shell not loaded correctly.`
  ));

  // ── Check 2: Title + body ───────────────────────────────────────────
  await page.waitForTimeout(WAIT_MS);
  const title    = await page.title().catch(() => "");
  const bodyText = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
  const hasContent = Boolean(title) && Boolean(bodyText.trim());

  checks.push(checkEntry(
    "browser-shell", "page-content",
    hasContent ? "verified" : "partially_verified",
    { title: title || "(empty)", bodyHasText: Boolean(bodyText.trim()) },
    hasContent
      ? `Page has title "${title}" and non-empty body.`
      : "Page title or body was empty — shell may not have fully rendered."
  ));

  // ── Check 3: Console and page errors ────────────────────────────────
  // Explicit: these errors were checked within WAIT_MS of load, not throughout session.
  const errorResult = pageErrors.length === 0 && consoleErrors.length === 0
    ? "verified" : "failed";

  checks.push(checkEntry(
    "browser-shell", "console-errors",
    errorResult,
    {
      pageErrorsObserved:   pageErrors.length,
      consoleErrorsObserved: consoleErrors.length,
      pageErrors:            pageErrors.slice(0, 5),
      consoleErrors:         consoleErrors.slice(0, 5),
      windowMs:              WAIT_MS
    },
    errorResult === "verified"
      ? `No uncaught exceptions or console errors observed within ${WAIT_MS}ms of load.`
      : `${pageErrors.length} page error(s), ${consoleErrors.length} console error(s) observed within ${WAIT_MS}ms.`
  ));

  // ── Check 4: Runtime-origin contract ────────────────────────────────
  // Explicitly NOT checked here — requires misato-browser-contract-check.mjs (Playwright eval).
  checks.push(checkEntry(
    "browser-shell", "runtime-origin-contract",
    "unverified",
    null,
    "window.__MISATO_RUNTIME_ORIGIN__ and canonical-endpoint reachability not checked in this pass. " +
    "Run: node scripts/misato-browser-contract-check.mjs"
  ));

  await browser.close();

  const allLoaded = checks.every(c => c.result !== "failed");
  const humanReadable = allLoaded
    ? `Shell loaded successfully at ${SHELL_URL}; runtime-origin contract UNVERIFIED — run misato:browser-contract-check to confirm.`
    : `Shell check FAILED at ${SHELL_URL} — see failed checks above.`;

  const report = buildReport(checks, humanReadable, { url: SHELL_URL });
  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) process.exitCode = 1;
}

main().catch((err) => {
  const report = buildReport(
    [checkEntry("browser-shell", "runtime", "failed",
      { error: err instanceof Error ? err.stack || err.message : String(err) },
      "Unexpected error in browser-shell-check runner.")],
    `Shell check aborted: ${err instanceof Error ? err.message : String(err)}`,
    { url: SHELL_URL }
  );
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
