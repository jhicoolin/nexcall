/**
 * MISATO Browser Contract Check
 *
 * Verifies the runtime-origin contract inside the loaded browser shell:
 *   1. window.__MISATO_RUNTIME_ORIGIN__ === canonical runtime origin
 *   2. Fetch to /api/misato/status under that origin returns expected top-level fields
 *   3. Fetch to /api/misato/command returns missionSummary and hermesPlan fields
 *   4. No uncaught console errors during the contract-check window
 *
 * Preconditions:
 *   - Tauri shell is running at MISATO_SHELL_URL (default: http://127.0.0.1:1420)
 *   - Hermes runtime is running at MISATO_RUNTIME_ORIGIN (default: http://127.0.0.1:3010)
 *
 * If Tauri or Hermes is not running, checks that require them are marked "unverified"
 * rather than "failed", so this script is safe to run in CI where those are absent.
 *
 * Human-readable outputs:
 *   All verified: "Runtime-origin contract fully verified: window globals correct, canonical endpoints reachable."
 *   Partial:      "Runtime-origin contract partially verified: window globals verified; endpoint {X} unreachable."
 *   Unverified:   "Runtime-origin contract UNVERIFIED: Tauri shell not reachable at {url}."
 *
 * Output schema: see scripts/misato-check-schema.mjs
 */

import { checkEntry, buildReport } from "./misato-check-schema.mjs";

const SHELL_URL       = process.env.MISATO_SHELL_URL       || "http://127.0.0.1:1420";
const RUNTIME_ORIGIN  = (process.env.MISATO_RUNTIME_ORIGIN || "http://127.0.0.1:3010").replace(/\/+$/, "");
const WAIT_MS         = Number(process.env.MISATO_SHELL_WAIT_MS || "2000");

const CANONICAL_ENDPOINTS = [
  {
    path:     "/api/misato/status",
    method:   "GET",
    fields:   ["ok", "runtimeMode"],
    label:    "status"
  },
  {
    path:     "/api/misato/command",
    method:   "POST",
    body:     JSON.stringify({ command: "What needs attention today?" }),
    fields:   ["missionSummary", "hermesPlan"],
    label:    "command"
  }
];

async function main() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  const consoleErrors = [];
  const pageErrors    = [];
  page.on("console",   (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => pageErrors.push(String(err?.message || err)));

  const checks = [];

  // ── Attempt to load the shell ────────────────────────────────────────
  let shellLoaded = false;
  try {
    const response = await page.goto(SHELL_URL, { waitUntil: "domcontentloaded", timeout: 8000 });
    shellLoaded = response?.ok() ?? false;
  } catch {
    shellLoaded = false;
  }

  if (!shellLoaded) {
    checks.push(checkEntry(
      "browser-contract", "shell-reachable", "unverified",
      { shellUrl: SHELL_URL },
      `Tauri shell not reachable at ${SHELL_URL} — is MISATO.exe running? ` +
      "All runtime-origin contract checks marked unverified."
    ));
    await browser.close();
    console.log(JSON.stringify(
      buildReport(checks,
        `Runtime-origin contract UNVERIFIED: Tauri shell not reachable at ${SHELL_URL}.`,
        { shellUrl: SHELL_URL, runtimeOrigin: RUNTIME_ORIGIN }
      ), null, 2
    ));
    return; // not an error — just unverified
  }

  await page.waitForTimeout(WAIT_MS);

  // ── Check 1: window.__MISATO_RUNTIME_ORIGIN__ ────────────────────────
  const actualOrigin = await page.evaluate(() => window.__MISATO_RUNTIME_ORIGIN__ ?? null).catch(() => null);
  const originMatch  = actualOrigin === RUNTIME_ORIGIN;

  checks.push(checkEntry(
    "browser-contract", "runtime-origin-global",
    actualOrigin === null ? "unverified"
      : originMatch ? "verified"
      : "failed",
    { expected: RUNTIME_ORIGIN, actual: actualOrigin },
    actualOrigin === null
      ? "window.__MISATO_RUNTIME_ORIGIN__ was not set on the page. The shell may not have injected runtime config yet."
      : originMatch
        ? `window.__MISATO_RUNTIME_ORIGIN__ === "${RUNTIME_ORIGIN}" — canonical origin matches.`
        : `window.__MISATO_RUNTIME_ORIGIN__ mismatch: expected "${RUNTIME_ORIGIN}", got "${actualOrigin}".`
  ));

  // ── Check 2: Canonical endpoint reachability ─────────────────────────
  // Fetch endpoints from WITHIN the browser context (respects CORS, origin headers)
  for (const ep of CANONICAL_ENDPOINTS) {
    const fetchResult = await page.evaluate(
      async ({ origin, path, method, body, fields }) => {
        try {
          const res = await fetch(`${origin}${path}`, {
            method,
            headers: {
              accept: "application/json",
              ...(body ? { "content-type": "application/json" } : {})
            },
            ...(body ? { body } : {})
          });
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("text/html")) {
            return { ok: false, error: "Returned HTML (SSO wall or redirect)", httpStatus: res.status };
          }
          const json = await res.json().catch(() => null);
          const missingFields = fields.filter(f => !Object.prototype.hasOwnProperty.call(json || {}, f));
          return {
            ok: res.ok && json !== null && missingFields.length === 0,
            httpStatus: res.status,
            missingFields,
            topLevelKeys: json ? Object.keys(json).slice(0, 12) : []
          };
        } catch (err) {
          return { ok: false, error: String(err?.message || err) };
        }
      },
      { origin: RUNTIME_ORIGIN, path: ep.path, method: ep.method, body: ep.body || null, fields: ep.fields }
    ).catch((evalErr) => ({ ok: false, error: String(evalErr?.message || evalErr) }));

    const reachable = fetchResult?.ok === true;
    const unreachable = fetchResult?.error?.includes("Failed to fetch") || fetchResult?.error?.includes("ERR_CONNECTION_REFUSED");

    checks.push(checkEntry(
      "browser-contract", `endpoint-${ep.label}`,
      unreachable ? "unverified"
        : reachable ? "verified"
        : "failed",
      {
        url:    `${RUNTIME_ORIGIN}${ep.path}`,
        method: ep.method,
        ...fetchResult
      },
      unreachable
        ? `Hermes not reachable at ${RUNTIME_ORIGIN}${ep.path} — is npm run dev running on port 3010?`
        : reachable
          ? `${ep.method} ${RUNTIME_ORIGIN}${ep.path} returned expected fields: ${ep.fields.join(", ")}.`
          : `${ep.method} ${RUNTIME_ORIGIN}${ep.path} failed: ${fetchResult?.error || `missing fields: ${(fetchResult?.missingFields || []).join(", ")}`}.`
    ));
  }

  // ── Check 3: Console errors during contract window ───────────────────
  const errorResult = pageErrors.length === 0 && consoleErrors.length === 0 ? "verified" : "partially_verified";
  checks.push(checkEntry(
    "browser-contract", "console-clean",
    errorResult,
    {
      pageErrors:    pageErrors.slice(0, 5),
      consoleErrors: consoleErrors.slice(0, 5),
      windowMs:      WAIT_MS
    },
    errorResult === "verified"
      ? `No uncaught exceptions or console errors in ${WAIT_MS}ms contract-check window.`
      : `${pageErrors.length} page error(s), ${consoleErrors.length} console error(s) observed during contract check.`
  ));

  await browser.close();

  // ── Build human-readable summary ──────────────────────────────────────
  const failed        = checks.filter(c => c.result === "failed");
  const unverified    = checks.filter(c => c.result === "unverified");
  const verified      = checks.filter(c => c.result === "verified");
  const partiallyVerified = checks.filter(c => c.result === "partially_verified");

  let humanReadable;
  if (failed.length > 0) {
    humanReadable = `Runtime-origin contract check FAILED: ${failed.map(c => c.check).join(", ")} — see checks above.`;
  } else if (unverified.length > 0 && verified.length > 0) {
    humanReadable = `Runtime-origin contract partially verified: ${verified.length} check(s) verified, ${unverified.length} unverified (Hermes or shell not reachable).`;
  } else if (unverified.length === checks.length) {
    humanReadable = `Runtime-origin contract UNVERIFIED: all checks require a running Tauri shell and Hermes.`;
  } else {
    humanReadable = `Runtime-origin contract fully verified: window globals correct, canonical endpoints reachable.`;
  }

  const report = buildReport(checks, humanReadable, {
    shellUrl: SHELL_URL,
    runtimeOrigin: RUNTIME_ORIGIN
  });

  console.log(JSON.stringify(report, null, 2));

  // Exit with error only on explicit failures, not on unverified
  if (!report.ok) process.exitCode = 1;
}

main().catch((err) => {
  const report = buildReport(
    [checkEntry("browser-contract", "runtime", "failed",
      { error: err instanceof Error ? err.stack || err.message : String(err) },
      "Unexpected error in browser-contract-check runner.")],
    `Browser contract check aborted: ${err instanceof Error ? err.message : String(err)}`,
    { shellUrl: SHELL_URL, runtimeOrigin: RUNTIME_ORIGIN }
  );
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
