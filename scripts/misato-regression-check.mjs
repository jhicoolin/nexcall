/**
 * MISATO Regression Check
 *
 * Two independent phases:
 *
 *   Phase A — Source contracts (no Hermes required):
 *     Reads source files and asserts specific strings/patterns exist or are absent.
 *     Each assertion is a "verified" check (source text confirms the contract) or "failed".
 *     These represent: "the code SAYS it does X" — not "we observed X at runtime."
 *
 *   Phase B — Live endpoint contracts (requires Hermes at MISATO_RUNTIME_ORIGIN):
 *     Fetches runtime endpoints and asserts expected shapes.
 *     If Hermes is not reachable, these are marked "unverified" (not "failed").
 *
 * Human-readable outputs:
 *   Source all pass:  "Source contracts verified: {N} checks passed (no Hermes required)."
 *   Source failures:  "Source contract FAILED: {checks} — see structured output."
 *   Live all pass:    "Live endpoint contracts verified against {base}."
 *   Live unverified:  "Live endpoint contracts UNVERIFIED — Hermes not reachable. Run npm run dev."
 *
 * Output schema: see scripts/misato-check-schema.mjs
 */

import { readFile } from "node:fs/promises";
import { checkEntry, buildReport } from "./misato-check-schema.mjs";

const BASE_URL = (process.argv[2] || process.env.MISATO_RUNTIME_ORIGIN || "http://127.0.0.1:3010").replace(/\/+$/, "");

// ── Source contract assertions ────────────────────────────────────────────
// Each entry: [id, file, type, pattern|string, description, component]
// type: "includes" | "excludes"
const SOURCE_CONTRACTS = [
  {
    id:        "sse-no-context-loaded",
    file:      "app/events/stream/route.ts",
    type:      "excludes",
    pattern:   'type: "context_loaded"',
    component: "sse-stream",
    description:
      "SSE stream route must not inject synthetic context_loaded data events. " +
      "context_loaded would pollute the Live Feed UI with connection noise."
  },
  {
    id:        "sse-no-noise-comment",
    file:      "app/events/stream/route.ts",
    type:      "includes",
    pattern:   "No synthetic context_loaded event here",
    component: "sse-stream",
    description:
      "SSE route must contain the no-synthetic-events comment confirming the contract."
  },
  {
    id:        "schedule-live-truth",
    file:      "desktop-ui/app.js",
    type:      "includes",
    pattern:   "hasLiveSchedule = state.schedule !== null",
    component: "schedule-view",
    description:
      "Schedule view must be keyed off state.schedule (live data) not a static flag. " +
      "This is the v6.6 regression fix."
  },
  {
    id:        "lanes-live-fallback",
    file:      "desktop-ui/app.js",
    type:      "includes",
    pattern:   "return isHermesConnected() ? [] : null;",
    component: "lane-builder",
    description:
      "buildLiveLanes() must return [] (not null/manifest) while Hermes is connected " +
      "even if no lane data is available — prevents static manifest takeover."
  },
  {
    id:        "approval-requester-field-order",
    file:      "desktop-ui/app.js",
    type:      "includes",
    pattern:   "agentName:    a.requestedAgent || a.requestedByAgentName || a.agentName || a.agent || a.requestedByAgentId || '—'",
    component: "approval-normalization",
    description:
      "normalizeApproval() must prefer a.requestedAgent (seed-data field) before " +
      "a.requestedByAgentName (Hermes runtime field) to handle both shapes. " +
      "Field order matters for the fallback chain."
  },
  {
    id:        "no-stale-cors-tile",
    file:      "desktop-ui/app.js",
    type:      "excludes",
    pattern:   "{ name:'CORS Headers'",
    component: "watchtower",
    description:
      "Watchtower must not contain the stale hardcoded CORS warning tile. " +
      "All tiles must derive from live runtime state."
  }
];

async function readSource(relPath) {
  return readFile(new URL(`../${relPath}`, import.meta.url), "utf8");
}

async function runSourceContracts() {
  const checks = [];

  for (const c of SOURCE_CONTRACTS) {
    let source;
    try {
      source = await readSource(c.file);
    } catch (readErr) {
      checks.push(checkEntry(
        c.component, c.id, "failed",
        { file: c.file, error: String(readErr?.message || readErr) },
        `Could not read ${c.file}: ${readErr?.message}`
      ));
      continue;
    }

    const match     = source.includes(c.pattern);
    const passed    = c.type === "includes" ? match : !match;
    const result    = passed ? "verified" : "failed";

    // "verified" here means: source text confirms the contract.
    // It does NOT mean the behavior was observed at runtime.
    const notes = passed
      ? `Source contract confirmed: "${c.pattern.slice(0, 60)}${c.pattern.length > 60 ? "…" : ""}" ` +
        `${c.type === "includes" ? "present" : "absent"} in ${c.file}.`
      : `Source contract FAILED: "${c.pattern.slice(0, 60)}${c.pattern.length > 60 ? "…" : ""}" ` +
        `${c.type === "includes" ? "NOT found" : "still present"} in ${c.file}. ${c.description}`;

    checks.push(checkEntry(
      c.component, c.id, result,
      {
        file:           c.file,
        contractType:   c.type,
        pattern:        c.pattern.slice(0, 80),
        patternMatched: match
      },
      notes
    ));
  }

  return checks;
}

// ── Live endpoint contracts ───────────────────────────────────────────────

async function fetchJson(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { accept: "application/json", ...(options.headers || {}) },
    ...options
  });
  const ct   = res.headers.get("content-type") || "";
  if (ct.includes("text/html")) {
    throw Object.assign(new Error(`${path} returned HTML (SSO wall)`), { url, httpStatus: res.status });
  }
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  return { res, json, url };
}

async function runLiveContracts() {
  const checks = [];

  const liveEndpoints = [
    { path: "/api/misato/status",    label: "status",    requiredFields: ["ok", "runtimeMode", "capabilities"] },
    { path: "/api/misato/schedule",  label: "schedule",  requiredFields: ["ok", "viewData"] },
    { path: "/api/misato/lanes",     label: "lanes",     requiredFields: ["ok", "items"] },
    { path: "/api/misato/approvals", label: "approvals", requiredFields: ["ok", "items"] }
  ];

  for (const ep of liveEndpoints) {
    try {
      const { res, json, url } = await fetchJson(ep.path);
      const missingFields      = ep.requiredFields.filter(k => !Object.prototype.hasOwnProperty.call(json || {}, k));
      const ok                 = res.ok && missingFields.length === 0;

      checks.push(checkEntry(
        "live-endpoints", `live-${ep.label}`,
        ok ? "verified" : "failed",
        { url, httpStatus: res.status, missingFields, topLevelKeys: Object.keys(json || {}).slice(0, 8) },
        ok
          ? `${ep.path} — HTTP ${res.status}, required fields present: ${ep.requiredFields.join(", ")}.`
          : `${ep.path} — HTTP ${res.status}, missing fields: ${missingFields.join(", ")}.`
      ));

      // Extra: for approvals, check each record has requester field
      if (ep.label === "approvals" && Array.isArray(json?.items)) {
        const missingRequester = json.items.filter(a =>
          !("requestedAgent"       in (a || {})) &&
          !("requestedByAgentId"   in (a || {})) &&
          !("requestedByAgentName" in (a || {}))
        );
        checks.push(checkEntry(
          "live-endpoints", "approvals-requester-field",
          missingRequester.length === 0 ? "verified" : "failed",
          {
            totalApprovals:       json.items.length,
            missingRequesterCount: missingRequester.length,
            missingIds:            missingRequester.map(a => a?.id).slice(0, 5)
          },
          missingRequester.length === 0
            ? `All ${json.items.length} approval(s) have requestedAgent or requestedByAgentId field.`
            : `${missingRequester.length} approval(s) missing requestedAgent/requestedByAgentId/requestedByAgentName.`
        ));
      }
    } catch (err) {
      const isUnreachable = String(err?.message || "").includes("ECONNREFUSED") ||
                            String(err?.message || "").includes("fetch failed");
      checks.push(checkEntry(
        "live-endpoints", `live-${ep.label}`,
        isUnreachable ? "unverified" : "failed",
        { url: `${BASE_URL}${ep.path}`, error: err?.message || String(err) },
        isUnreachable
          ? `Hermes not reachable at ${BASE_URL} — is npm run dev running?`
          : `Live check failed: ${err?.message}`
      ));
    }
  }

  return checks;
}

async function main() {
  // Phase A: source contracts (no network required)
  const sourceChecks = await runSourceContracts();

  // Phase B: live endpoint contracts
  const liveChecks = await runLiveContracts();

  const allChecks     = [...sourceChecks, ...liveChecks];
  const sourceFailed  = sourceChecks.filter(c => c.result === "failed");
  const liveVerified  = liveChecks.filter(c => c.result === "verified").length;
  const liveUnverified = liveChecks.filter(c => c.result === "unverified").length;
  const liveFailed    = liveChecks.filter(c => c.result === "failed").length;

  let humanReadable;
  if (sourceFailed.length > 0) {
    humanReadable =
      `Source contracts FAILED: ${sourceFailed.map(c => c.id).join(", ")}. ` +
      `Run 'git log --oneline -5' and check the regression commits.`;
  } else if (liveUnverified === liveChecks.length) {
    humanReadable =
      `Source contracts verified: ${sourceChecks.length} checks passed (no Hermes required). ` +
      `Live endpoint contracts UNVERIFIED — Hermes not reachable at ${BASE_URL}. Run npm run dev.`;
  } else if (liveFailed > 0) {
    humanReadable =
      `Source contracts verified. Live endpoint contracts FAILED: ${liveFailed} check(s) at ${BASE_URL}.`;
  } else {
    humanReadable =
      `Regression checks PASS: ${sourceChecks.length} source contracts verified; ` +
      `${liveVerified} live endpoint contract(s) verified against ${BASE_URL}.`;
  }

  const report = buildReport(allChecks, humanReadable, {
    runtimeOrigin: BASE_URL,
    note: [
      "Phase A (source contracts): verified = source text confirms the code pattern. NOT a runtime observation.",
      "Phase B (live endpoints): verified = HTTP 200 + expected JSON shape received from Hermes.",
      "Browser-layer checks (window globals, console errors) require misato-browser-contract-check.mjs."
    ]
  });

  console.log(JSON.stringify(report, null, 2));

  // Non-zero exit only for explicit source or live failures, not for unverified
  if (sourceFailed.length > 0 || liveFailed > 0) process.exitCode = 1;
}

main().catch((err) => {
  const report = buildReport(
    [checkEntry("regression", "runner", "failed",
      { error: err instanceof Error ? err.stack || err.message : String(err) },
      "Unexpected error in regression-check runner.")],
    `Regression check aborted: ${err instanceof Error ? err.message : String(err)}`,
    { runtimeOrigin: BASE_URL }
  );
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
