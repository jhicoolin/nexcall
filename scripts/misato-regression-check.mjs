import { readFile } from 'node:fs/promises';

const baseUrl = process.argv[2] || process.env.MISATO_BASE_URL || 'http://127.0.0.1:3010';
const root = process.cwd();

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function readText(path) {
  return await readFile(path, 'utf8');
}

async function checkSourceContracts() {
  const desktop = await readText(new URL('../desktop-ui/app.js', import.meta.url));
  const streamRoute = await readText(new URL('../app/events/stream/route.ts', import.meta.url));

  assert(!streamRoute.includes('type: "context_loaded"'), 'SSE route still injects synthetic context_loaded events');
  assert(streamRoute.includes('No synthetic context_loaded event here'), 'SSE route comment missing; expected no-noise contract');
  assert(desktop.includes('hasLiveSchedule = state.schedule !== null'), 'Schedule view is not keyed off live schedule truth');
  assert(desktop.includes('return isHermesConnected() ? [] : null;'), 'Lane builder still falls back to static lanes while Hermes is connected');
  assert(desktop.includes("agentName:    a.requestedAgent || a.requestedByAgentName || a.agentName || a.agent || a.requestedByAgentId || '—'"), 'Approval normalization no longer prefers requestedAgent');
  assert(!desktop.includes("{ name:'CORS Headers'"), 'Watchtower still contains the stale CORS warning tile');
}

async function fetchJson(path) {
  const res = await fetch(new URL(path, baseUrl));
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new Error(`${path} did not return JSON: ${text.slice(0, 240)}`);
  }
  return { res, json };
}

async function checkLiveEndpoints() {
  const status = await fetchJson('/api/misato/status');
  assert(status.res.ok, `/api/misato/status returned HTTP ${status.res.status}`);
  assert(status.json?.ok === true, '/api/misato/status ok flag was false');
  assert(typeof status.json?.capabilities?.schedule === 'boolean', 'status capabilities.schedule is not a boolean');
  assert(typeof status.json?.capabilities?.lanes === 'boolean', 'status capabilities.lanes is not a boolean');
  assert(typeof status.json?.capabilities?.approvals === 'boolean', 'status capabilities.approvals is not a boolean');
  assert(typeof status.json?.runtimeMode === 'string', 'status runtimeMode missing');

  const schedule = await fetchJson('/api/misato/schedule');
  assert(schedule.res.ok, `/api/misato/schedule returned HTTP ${schedule.res.status}`);
  assert(schedule.json?.ok === true, '/api/misato/schedule ok flag was false');
  assert(schedule.json?.viewData && typeof schedule.json.viewData === 'object', 'schedule endpoint missing viewData');
  assert(Array.isArray(schedule.json.viewData.agenda), 'schedule viewData.agenda is not an array');
  assert(Array.isArray(schedule.json.viewData.day) || typeof schedule.json.viewData.day === 'object', 'schedule viewData.day is missing');
  assert(Array.isArray(schedule.json.viewData.week) || typeof schedule.json.viewData.week === 'object', 'schedule viewData.week is missing');

  const lanes = await fetchJson('/api/misato/lanes');
  assert(lanes.res.ok, `/api/misato/lanes returned HTTP ${lanes.res.status}`);
  assert(lanes.json?.ok === true, '/api/misato/lanes ok flag was false');
  assert(Array.isArray(lanes.json?.items), '/api/misato/lanes items is not an array');

  const approvals = await fetchJson('/api/misato/approvals');
  assert(approvals.res.ok, `/api/misato/approvals returned HTTP ${approvals.res.status}`);
  assert(approvals.json?.ok === true, '/api/misato/approvals ok flag was false');
  assert(Array.isArray(approvals.json?.items), '/api/misato/approvals items is not an array');
  for (const approval of approvals.json.items) {
    assert('requestedAgent' in approval || 'requestedByAgentId' in approval, `approval ${approval?.id || '?'} is missing requestedAgent/requestedByAgentId`);
  }

}

async function main() {
  await checkSourceContracts();
  await checkLiveEndpoints();
  console.log(`MISATO regression checks passed against ${baseUrl}`);
}

main().catch((err) => {
  console.error(`MISATO regression checks failed for ${baseUrl}`);
  console.error(err?.stack || err?.message || String(err));
  process.exit(1);
});
