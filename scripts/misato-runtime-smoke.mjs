import assert from "node:assert/strict";

const base = (process.env.MISATO_RUNTIME_ORIGIN || "http://127.0.0.1:3010").replace(/\/+$/, "");
const dailyCommand = "What needs attention today?";
const riskyCommand = "Deploy to production now";

async function fetchJson(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: {
      accept: "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const ct = res.headers.get("content-type") || "";
  assert.ok(!ct.includes("text/html"), `${path} returned HTML`);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(`${path} did not return valid JSON: ${text.slice(0, 200)}`);
  }
  return { res, json, ct };
}

function requireField(obj, key, path) {
  assert.ok(Object.prototype.hasOwnProperty.call(obj, key), `${path} missing ${key}`);
}

async function main() {
  const checks = [
    ["/health", "health"],
    ["/api/misato/status", "status"],
    ["/api/misato/agents", "agents"],
    ["/api/misato/tasks", "tasks"],
    ["/api/misato/approvals", "approvals"],
    ["/api/misato/logs", "logs"],
    ["/api/misato/watchtower", "watchtower"],
    ["/api/misato/secrets", "secrets"],
    ["/api/misato/schedule", "schedule"],
    ["/api/misato/lanes", "lanes"]
  ];

  for (const [path, label] of checks) {
    const { res, json } = await fetchJson(path);
    assert.ok(res.ok, `${path} returned HTTP ${res.status}`);
    assert.equal(json.ok !== false, true, `${path} returned ok:false`);
    if (label === "status") {
      for (const key of [
        "runtimeMode",
        "localSoloMode",
        "desktopTokenRequired",
        "productionLocked",
        "hermesConnected",
        "eventStreamAvailable",
        "persistenceMode",
        "capabilities"
      ]) requireField(json, key, path);
    }
    if (label === "schedule") {
      assert.ok(Array.isArray(json.viewData?.agenda) || Array.isArray(json.items) || json.ok, `${path} missing schedule shape`);
    }
    if (label === "lanes") {
      assert.ok(Array.isArray(json.items) || Array.isArray(json.lanes) || json.ok, `${path} missing lanes shape`);
    }
  }

  const streamRes = await fetch(`${base}/api/misato/events/stream`, {
    headers: { accept: "text/event-stream" }
  });
  assert.ok(streamRes.ok, `/api/misato/events/stream returned HTTP ${streamRes.status}`);
  const streamType = streamRes.headers.get("content-type") || "";
  assert.ok(streamType.includes("text/event-stream") || streamType.includes("application/json"), "events stream returned unexpected content type");
  await streamRes.body?.cancel().catch(() => {});

  const daily = await fetchJson("/api/misato/command", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ command: dailyCommand })
  });
  assert.ok(daily.res.ok, `/api/misato/command daily returned HTTP ${daily.res.status}`);
  for (const key of ["missionSummary", "hermesPlan", "agentsAssigned", "councilFeedback", "moduleStatus"]) {
    requireField(daily.json, key, "/api/misato/command");
  }
  assert.equal(daily.json.approvalRequired, false, "daily command should not require approval");

  const risky = await fetchJson("/api/misato/command", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ command: riskyCommand })
  });
  assert.ok(risky.res.ok, `/api/misato/command risky returned HTTP ${risky.res.status}`);
  assert.equal(risky.json.approvalRequired, true, "risky command should require approval");

  console.log(JSON.stringify({
    ok: true,
    base,
    checks: checks.length + 2,
    daily: dailyCommand,
    risky: riskyCommand
  }, null, 2));
}

main().catch(err => {
  console.error(err instanceof Error ? err.stack || err.message : String(err));
  process.exitCode = 1;
});
