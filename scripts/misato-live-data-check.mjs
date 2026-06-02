/**
 * MISATO Live Data Check
 *
 * Verifies the runtime-origin contract at MISATO_RUNTIME_ORIGIN and checks
 * that live data surfaces are returning real runtime state instead of stale
 * fallback content.
 *
 * This script is intentionally narrow: it only proves that the live data
 * paths are reachable and shaped correctly. It does not replace the browser
 * shell check or the broader smoke/regression suite.
 */

import { checkEntry, buildReport } from "./misato-check-schema.mjs";

const BASE = (process.env.MISATO_RUNTIME_ORIGIN || "http://127.0.0.1:3010").replace(/\/+$/, "");
const JSON_HEADERS = { accept: "application/json" };

const REQUIRED_STATUS_FIELDS = [
  "runtimeMode",
  "localSoloMode",
  "desktopTokenRequired",
  "productionLocked",
  "hermesConnected",
  "eventStreamAvailable",
  "persistenceMode",
  "capabilities"
];

const LIVE_ENDPOINTS = [
  { path: "/api/misato/status", label: "status", kind: "json", method: "GET", required: REQUIRED_STATUS_FIELDS },
  { path: "/api/misato/schedule", label: "schedule", kind: "json", method: "GET", required: ["ok"] },
  { path: "/api/misato/lanes", label: "lanes", kind: "json", method: "GET", required: ["ok", "items"] },
  { path: "/api/misato/approvals", label: "approvals", kind: "json", method: "GET", required: ["ok", "items"] },
  { path: "/api/misato/watchtower/status", label: "watchtower-status", kind: "json", method: "GET", required: ["ok"] },
  { path: "/api/misato/watchtower/check", label: "watchtower-check", kind: "json", method: "POST", required: ["ok"] },
  { path: "/api/misato/secrets/status", label: "secrets-status", kind: "json", method: "GET", required: ["ok"] },
  { path: "/api/misato/secrets/scan-summary", label: "secrets-scan-summary", kind: "json", method: "POST", required: ["ok"] },
  { path: "/api/misato/obsidian", label: "obsidian", kind: "json", method: "GET", required: ["ok"] },
  { path: "/api/misato/obsidian/sync", label: "obsidian-sync", kind: "json", method: "POST", required: ["ok"] },
  { path: "/api/misato/logs", label: "logs", kind: "json", method: "GET", required: ["ok", "items"] },
  { path: "/api/misato/events/stream", label: "events-stream", kind: "sse", required: [] }
];

function isHtmlResponse(contentType = "") {
  return contentType.includes("text/html");
}

async function fetchProbe(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { ...JSON_HEADERS, ...(options.headers || {}) },
    ...options
  });
  const contentType = res.headers.get("content-type") || "";
  const text = options.skipBody ? "" : await res.text();
  return { res, contentType, text, url };
}

function parseMaybeJson(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function runJsonEndpoint(checks, endpoint) {
  try {
    const { res, contentType, text, url } = await fetchProbe(endpoint.path, {
      method: endpoint.method || "GET",
      ...(endpoint.method === "POST" ? { body: JSON.stringify({}) } : {})
    });
    if (isHtmlResponse(contentType)) {
      checks.push(checkEntry(
        "live-data", endpoint.label, "failed",
        { url, httpStatus: res.status, contentType, bodySnippet: text.slice(0, 160) },
        `${endpoint.path} returned HTML instead of JSON.`
      ));
      return;
    }

    const json = parseMaybeJson(text);
    if (json === null) {
      checks.push(checkEntry(
        "live-data", endpoint.label, "failed",
        { url, httpStatus: res.status, contentType, bodySnippet: text.slice(0, 160) },
        `${endpoint.path} did not return valid JSON.`
      ));
      return;
    }

    const missing = endpoint.required.filter((key) => !Object.prototype.hasOwnProperty.call(json || {}, key));
    const hasRealPayload =
      endpoint.label === "schedule"
        ? Boolean(json?.viewData?.agenda || json?.viewData?.day || json?.viewData?.week || Array.isArray(json?.items))
        : endpoint.label === "approvals"
          ? Array.isArray(json?.items) && json.items.length >= 0
          : endpoint.label === "lanes"
            ? Array.isArray(json?.items)
            : endpoint.label === "logs"
              ? Array.isArray(json?.items)
              : true;

    const result = res.ok && missing.length === 0 && hasRealPayload ? "verified" : "failed";
    checks.push(checkEntry(
      "live-data",
      endpoint.label,
      result,
      {
        url,
        httpStatus: res.status,
        contentType,
        topLevelKeys: Object.keys(json || {}).slice(0, 12),
        missingFields: missing,
        sample: endpoint.label === "approvals" ? (json?.items || []).slice(0, 2) : undefined
      },
      result === "verified"
        ? `${endpoint.path} returned live JSON with expected fields.`
        : `${endpoint.path} missing fields: ${missing.join(", ") || "none"}.`
    ));
  } catch (err) {
    const unreachable = String(err?.message || "").includes("ECONNREFUSED") || String(err?.message || "").includes("fetch failed");
    checks.push(checkEntry(
      "live-data",
      endpoint.label,
      unreachable ? "unverified" : "failed",
      { url: `${BASE}${endpoint.path}`, error: err?.message || String(err) },
      unreachable
        ? `Live data not reachable at ${BASE}; start Hermes on port 3010.`
        : `Live data check failed: ${err?.message || String(err)}`
    ));
  }
}

async function runStreamEndpoint(checks) {
  const url = `${BASE}/api/misato/events/stream`;
  try {
    const res = await fetch(url, { headers: { accept: "text/event-stream" } });

    const ct = res.headers.get("content-type") || "";
    const reader = res.body?.getReader();
    let chunkText = "";
    let timedOut = false;
    if (reader) {
      const readResult = await Promise.race([
        reader.read(),
        new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 5000))
      ]);
      if (readResult?.timeout) {
        timedOut = true;
      }
      const value = readResult?.value;
      if (value) {
        chunkText = new TextDecoder().decode(value);
      }
      await reader.cancel().catch(() => {});
    }

    const hasContextLoaded = chunkText.includes("context_loaded");
    const result =
      res.ok && ct.includes("text/event-stream") && !hasContextLoaded
        ? (chunkText ? "verified" : (timedOut ? "partially_verified" : "loaded"))
        : "failed";
    checks.push(checkEntry(
      "live-data",
      "events-stream",
      result,
      { url, httpStatus: res.status, contentType: ct, bodySnippet: chunkText.slice(0, 240), hasContextLoaded, timedOut },
      result === "verified"
        ? "events stream returned live SSE data without context_loaded noise."
        : result === "partially_verified"
          ? "events stream opened with the correct SSE content-type but no payload chunk arrived within the timeout window."
          : "events stream was not a clean live SSE feed."
    ));
  } catch (err) {
    checks.push(checkEntry(
      "live-data",
      "events-stream",
      "unverified",
      { url, error: err?.message || String(err) },
      `events stream could not be fully exercised in this pass: ${err?.message || String(err)}`
    ));
  }
}

async function main() {
  const checks = [];

  for (const endpoint of LIVE_ENDPOINTS) {
    if (endpoint.kind === "sse") {
      await runStreamEndpoint(checks);
    } else {
      await runJsonEndpoint(checks, endpoint);
    }
  }

  const failed = checks.filter((c) => c.result === "failed");
  const unverified = checks.filter((c) => c.result === "unverified");
  const verified = checks.filter((c) => c.result === "verified").length;

  const humanReadable = failed.length > 0
    ? `Live data check FAILED: ${failed.length} issue(s) against ${BASE}.`
    : unverified.length > 0
      ? `Live data check PARTIALLY VERIFIED: ${verified} endpoint(s) verified; ${unverified.length} unverified at ${BASE}.`
      : `Live data check PASS: ${verified} endpoint(s) verified against ${BASE}.`;

  const report = buildReport(checks, humanReadable, {
    runtimeOrigin: BASE,
    note: "Live data check only verifies runtime reachability and JSON/SSE shapes. Browser-shell certainty is handled by browser checks."
  });

  console.log(JSON.stringify(report, null, 2));
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  const report = buildReport(
    [checkEntry("live-data", "runner", "failed", { error: err?.stack || err?.message || String(err) }, "Unexpected error in live-data check.")],
    `Live data check aborted: ${err?.message || String(err)}`,
    { runtimeOrigin: BASE }
  );
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
