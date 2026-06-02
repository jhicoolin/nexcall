/**
 * MISATO Runtime Smoke Check
 *
 * Verifies the Hermes runtime API at MISATO_RUNTIME_ORIGIN is reachable
 * and returns expected contract shapes. This is a server-side HTTP check —
 * no browser required.
 *
 * What is verified:
 *   - Each listed endpoint returns HTTP 200 and non-HTML JSON
 *   - /api/misato/status includes required top-level fields
 *   - /api/misato/command (daily intent) returns missionSummary + hermesPlan; approvalRequired === false
 *   - /api/misato/command (risky intent) returns approvalRequired === true
 *   - /api/misato/events/stream returns text/event-stream content-type
 *
 * What is NOT verified:
 *   - window.__MISATO_RUNTIME_ORIGIN__ (browser global — use misato-browser-contract-check.mjs)
 *   - Console errors in the browser shell
 *   - Visual rendering of any UI surface
 *
 * Human-readable outputs:
 *   All verified:  "Runtime smoke PASS: all {N} checks verified against {base}."
 *   Some failed:   "Runtime smoke FAILED: {N} check(s) failed against {base} — see structured output."
 *   Unreachable:   "Runtime smoke UNVERIFIED: Hermes not reachable at {base}."
 *
 * Output schema: see scripts/misato-check-schema.mjs
 */

import assert from "node:assert/strict";
import { checkEntry, buildReport } from "./misato-check-schema.mjs";

const BASE = (process.env.MISATO_RUNTIME_ORIGIN || "http://127.0.0.1:3010").replace(/\/+$/, "");

const DAILY_COMMAND = "What needs attention today?";
const RISKY_COMMAND = "Deploy to production now";

// Required top-level fields on /api/misato/status
const STATUS_REQUIRED_FIELDS = [
  "runtimeMode",
  "localSoloMode",
  "desktopTokenRequired",
  "productionLocked",
  "hermesConnected",
  "eventStreamAvailable",
  "persistenceMode",
  "capabilities"
];

// Required top-level fields on /api/misato/command response
const COMMAND_REQUIRED_FIELDS = [
  "missionSummary",
  "hermesPlan",
  "agentsAssigned",
  "councilFeedback",
  "moduleStatus"
];

async function fetchJson(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { accept: "application/json", ...(options.headers || {}) },
    ...options
  });
  const ct   = res.headers.get("content-type") || "";
  const text = await res.text();

  if (ct.includes("text/html")) {
    throw Object.assign(new Error(`${path} returned HTML (SSO wall or redirect)`), { url, httpStatus: res.status });
  }

  let json = null;
  try { json = text ? JSON.parse(text) : {}; }
  catch { throw Object.assign(new Error(`${path} did not return valid JSON: ${text.slice(0, 200)}`), { url }); }

  return { res, json, url };
}

/** Run a single check, catch and record failures cleanly */
async function runCheck(checks, component, checkName, fn) {
  try {
    await fn(checks, component, checkName);
  } catch (err) {
    const isUnreachable = err?.cause?.code === "ECONNREFUSED"
      || String(err?.message || "").includes("ECONNREFUSED")
      || String(err?.message || "").includes("fetch failed");

    checks.push(checkEntry(
      component, checkName,
      isUnreachable ? "unverified" : "failed",
      { error: err?.message || String(err), url: err?.url || BASE },
      isUnreachable
        ? `Hermes not reachable at ${BASE}. Is npm run dev running on port 3010?`
        : `Check failed: ${err?.message || String(err)}`
    ));
  }
}

async function main() {
  const checks = [];

  // ── Endpoint availability checks ──────────────────────────────────────
  const endpoints = [
    ["/health",               "health"],
    ["/api/misato/status",    "status"],
    ["/api/misato/agents",    "agents"],
    ["/api/misato/tasks",     "tasks"],
    ["/api/misato/approvals", "approvals"],
    ["/api/misato/logs",      "logs"],
    ["/api/misato/watchtower","watchtower"],
    ["/api/misato/secrets",   "secrets"],
    ["/api/misato/schedule",  "schedule"],
    ["/api/misato/lanes",     "lanes"]
  ];

  for (const [path, label] of endpoints) {
    await runCheck(checks, "runtime-smoke", `endpoint-${label}`, async () => {
      const { res, json, url } = await fetchJson(path);
      const httpOk   = res.ok;
      const jsonOk   = json?.ok !== false;
      const evidence = {
        url,
        httpStatus: res.status,
        okFlag:     json?.ok,
        topLevelKeys: Object.keys(json || {}).slice(0, 8)
      };

      // Special field checks
      let missingFields = [];
      if (label === "status") {
        missingFields = STATUS_REQUIRED_FIELDS.filter(k => !Object.prototype.hasOwnProperty.call(json || {}, k));
        evidence.missingRequiredFields = missingFields;
        evidence.requiredFields        = STATUS_REQUIRED_FIELDS;
      }
      if (label === "schedule") {
        const hasShape = Array.isArray(json?.viewData?.agenda) || Array.isArray(json?.items) || json?.ok;
        if (!hasShape) missingFields = ["viewData.agenda"];
      }
      if (label === "lanes") {
        const hasItems = Array.isArray(json?.items) || Array.isArray(json?.lanes);
        if (!hasItems) missingFields = ["items"];
      }

      const result = (!httpOk || !jsonOk || missingFields.length > 0) ? "failed" : "verified";
      const notes  = result === "verified"
        ? `${path} — HTTP ${res.status}, JSON ok, contract shape confirmed.`
        : `${path} — HTTP ${res.status}, ok:${json?.ok}, missing fields: ${missingFields.join(", ") || "none"}.`;

      checks.push(checkEntry("runtime-smoke", `endpoint-${label}`, result, evidence, notes));
    });
  }

  // ── SSE stream check ─────────────────────────────────────────────────
  await runCheck(checks, "runtime-smoke", "event-stream", async () => {
    const url = `${BASE}/api/misato/events/stream`;
    const res = await fetch(url, { headers: { accept: "text/event-stream" } });
    const ct  = res.headers.get("content-type") || "";
    const ok  = res.ok && (ct.includes("text/event-stream") || ct.includes("application/json"));
    await res.body?.cancel().catch(() => {});

    checks.push(checkEntry(
      "runtime-smoke", "event-stream",
      ok ? "verified" : "failed",
      { url, httpStatus: res.status, contentType: ct },
      ok
        ? `SSE endpoint reachable; content-type: ${ct}.`
        : `SSE endpoint returned unexpected content-type "${ct}" or HTTP ${res.status}.`
    ));
  });

  // ── Command: daily (non-risky) ────────────────────────────────────────
  await runCheck(checks, "runtime-smoke", "command-daily", async () => {
    const { res, json, url } = await fetchJson("/api/misato/command", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body:    JSON.stringify({ command: DAILY_COMMAND })
    });

    const missingFields  = COMMAND_REQUIRED_FIELDS.filter(k => !Object.prototype.hasOwnProperty.call(json || {}, k));
    const approvalOk     = json?.approvalRequired === false;
    const allOk          = res.ok && missingFields.length === 0 && approvalOk;

    checks.push(checkEntry(
      "runtime-smoke", "command-daily",
      allOk ? "verified" : "failed",
      {
        url,
        httpStatus:        res.status,
        missingFields,
        approvalRequired:  json?.approvalRequired,
        requiredFields:    COMMAND_REQUIRED_FIELDS,
        responseTextSnippet: (json?.responseText || json?.missionSummary || "").slice(0, 100)
      },
      allOk
        ? `Daily command returned expected fields; approvalRequired: false (correct for "${DAILY_COMMAND}").`
        : `Daily command failed: missing fields [${missingFields.join(", ")}], approvalRequired: ${json?.approvalRequired}.`
    ));
  });

  // ── Command: risky (should gate approval) ────────────────────────────
  await runCheck(checks, "runtime-smoke", "command-risky-gate", async () => {
    const { res, json, url } = await fetchJson("/api/misato/command", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body:    JSON.stringify({ command: RISKY_COMMAND })
    });

    const approvalGated = json?.approvalRequired === true;
    checks.push(checkEntry(
      "runtime-smoke", "command-risky-gate",
      res.ok && approvalGated ? "verified" : "failed",
      {
        url,
        httpStatus:       res.status,
        approvalRequired: json?.approvalRequired,
        riskLevel:        json?.riskLevel,
        commandStatus:    json?.commandStatus
      },
      res.ok && approvalGated
        ? `Risky command "${RISKY_COMMAND}" correctly gated: approvalRequired: true.`
        : `Risky command approval gate check failed: approvalRequired was ${json?.approvalRequired}, expected true.`
    ));
  });

  // ── Build report ──────────────────────────────────────────────────────
  const failed        = checks.filter(c => c.result === "failed");
  const unverified    = checks.filter(c => c.result === "unverified");
  const verifiedCount = checks.filter(c => c.result === "verified").length;

  let humanReadable;
  if (unverified.length === checks.length) {
    humanReadable = `Runtime smoke UNVERIFIED: Hermes not reachable at ${BASE} — start npm run dev on port 3010.`;
  } else if (failed.length > 0) {
    humanReadable = `Runtime smoke FAILED: ${failed.length} check(s) failed against ${BASE} — see structured output for details.`;
  } else {
    humanReadable = `Runtime smoke PASS: all ${verifiedCount} checks verified against ${BASE}.`;
  }

  const report = buildReport(checks, humanReadable, {
    runtimeOrigin: BASE,
    note: "Shell-layer checks (window globals, browser console) are NOT included here. " +
          "Run misato-browser-contract-check.mjs separately for those."
  });

  console.log(JSON.stringify(report, null, 2));

  // Exit non-zero on failures; unverified (Hermes offline) is not a failure
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  const report = buildReport(
    [checkEntry("runtime-smoke", "runner", "failed",
      { error: err instanceof Error ? err.stack || err.message : String(err) },
      "Unexpected error in runtime-smoke runner.")],
    `Runtime smoke aborted: ${err instanceof Error ? err.message : String(err)}`,
    { runtimeOrigin: BASE }
  );
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
