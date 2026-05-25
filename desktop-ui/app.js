const storage = {
  get(k, d = "") {
    try {
      return localStorage.getItem(k) || d;
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  }
};

const injectedBase = (window.__MISATO_API_BASE_URL__ || "").trim();
const state = {
  baseUrl: storage.get("misato_api_base_url", injectedBase),
  token: storage.get("misato_desktop_auth_token", ""),
  bypassToken: storage.get("misato_vercel_bypass_token", ""),
  status: null,
  council: [],
  projects: [],
  tasks: [],
  approvals: [],
  logs: [],
  commandResult: null,
  lastError: "",
  connTest: {
    label: "Not tested",
    httpStatus: null,
    checkedAt: null,
    error: "",
    nextFix: "Click Test Connection after configuring MISATO_API_BASE_URL."
  }
};

function headers() {
  const h = { "content-type": "application/json" };
  if (state.token) h["x-misato-desktop-token"] = state.token;
  if (state.bypassToken) h["x-vercel-protection-bypass"] = state.bypassToken;
  return h;
}

function endpoint(path) {
  const base = state.baseUrl.replace(/\/$/, "");
  return `${base}/${path}`;
}

function authModeLabel() {
  const ownerAuth = state.token ? "desktop token configured" : "no desktop token (session auth or token required)";
  const bypass = state.bypassToken ? "Vercel bypass configured" : "no Vercel bypass token";
  return `${ownerAuth}; ${bypass}`;
}

function isConnected() {
  return state.connTest.label === "Connected";
}

async function apiGet(path) {
  const res = await fetch(endpoint(path), { headers: headers() });
  const data = await res.json().catch(() => ({ ok: false, error: "Invalid JSON" }));
  return { res, data };
}

async function testConnection() {
  if (!state.baseUrl) {
    state.connTest = {
      label: "Not configured",
      httpStatus: null,
      checkedAt: new Date().toISOString(),
      error: "MISATO_API_BASE_URL is missing.",
      nextFix: "Set MISATO_API_BASE_URL to your private MISATO backend, e.g. https://nexcall.one/api/misato"
    };
    render();
    return;
  }

  try {
    const { res, data } = await apiGet("status");
    const checkedAt = new Date().toISOString();

    if (res.ok && data?.ok) {
      state.status = data;
      state.connTest = {
        label: "Connected",
        httpStatus: res.status,
        checkedAt,
        error: "",
        nextFix: "Connected to MISATO backend. Owner/auth check passed."
      };
      await loadAll(false);
    } else if (res.status === 401 || data?.auth === "invalid") {
      state.connTest = {
        label: "Unauthorized",
        httpStatus: res.status,
        checkedAt,
        error: data?.error || "unauthorized",
        nextFix: "Backend reached, but auth failed. Check MISATO_DESKTOP_AUTH_TOKEN or owner session."
      };
    } else {
      state.connTest = {
        label: "Failed",
        httpStatus: res.status,
        checkedAt,
        error: data?.error || `HTTP ${res.status}`,
        nextFix: "Cannot reach usable backend state. Check MISATO_API_BASE_URL and network."
      };
    }
  } catch (e) {
    state.connTest = {
      label: "Failed",
      httpStatus: null,
      checkedAt: new Date().toISOString(),
      error: String(e.message || e),
      nextFix: "Cannot reach backend. Check MISATO_API_BASE_URL and network."
    };
  }

  render();
}

async function loadAll(triggerRender = true) {
  if (!state.baseUrl) {
    if (triggerRender) render();
    return;
  }

  state.lastError = "";
  try {
    const council = await apiGet("council");
    if (council.res.ok) state.council = council.data.items || [];

    const projects = await apiGet("projects");
    if (projects.res.ok) state.projects = projects.data.items || [];

    const tasks = await apiGet("tasks");
    if (tasks.res.ok) state.tasks = tasks.data.items || [];

    const approvals = await apiGet("approvals");
    if (approvals.res.ok) state.approvals = approvals.data.items || [];

    const logs = await apiGet("logs");
    if (logs.res.ok) state.logs = logs.data.items || [];
  } catch (e) {
    state.lastError = String(e.message || e);
  }
  if (triggerRender) render();
}

async function sendCommand() {
  const input = document.getElementById("cmd");
  const command = (input?.value || "").trim();
  if (!command) return;

  if (!state.baseUrl) {
    state.lastError = "Set MISATO_API_BASE_URL before sending commands.";
    render();
    return;
  }

  try {
    const res = await fetch(endpoint("command"), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ command })
    });
    const data = await res.json().catch(() => ({ ok: false, error: "Invalid JSON" }));
    if (!res.ok) throw new Error(data.error || `${res.status}`);
    state.commandResult = data.result;
    state.lastError = "";
    input.value = "";
  } catch (e) {
    state.lastError = String(e.message || e);
  }
  render();
}

function saveConfig() {
  state.baseUrl = (document.getElementById("base")?.value || "").trim();
  const enteredToken = (document.getElementById("token")?.value || "").trim();
  const enteredBypass = (document.getElementById("bypass")?.value || "").trim();

  if (enteredToken) state.token = enteredToken;
  if (enteredBypass) state.bypassToken = enteredBypass;

  storage.set("misato_api_base_url", state.baseUrl);
  storage.set("misato_desktop_auth_token", state.token);
  storage.set("misato_vercel_bypass_token", state.bypassToken);
  state.connTest = {
    label: "Not tested",
    httpStatus: null,
    checkedAt: null,
    error: "",
    nextFix: "Click Test Connection to verify backend/auth."
  };
  render();
}

function setupView() {
  return `<div class='card'>
    <div class='title'>MISATO backend not connected</div>
    <p class='muted'>Set MISATO_API_BASE_URL (example: https://your-private-vercel-url/api/misato). No secrets embedded. No auth bypass.</p>
    <div class='stack'>
      <input id='base' placeholder='https://nexcall.one/api/misato' value='${state.baseUrl || ""}' />
      <input id='token' type='password' autocomplete='off' placeholder='MISATO_DESKTOP_AUTH_TOKEN (local only)' value='' />
      <input id='bypass' type='password' autocomplete='off' placeholder='VERCEL_PROTECTION_BYPASS (optional local only)' value='' />
      <p class='small muted'>Desktop token ${state.token ? "configured" : "not configured"}; bypass token ${state.bypassToken ? "configured" : "not configured"}. Values are hidden.</p>
      <div class='row'>
        <button id='save'>Save Config</button>
        <button id='test'>Test Connection</button>
      </div>
    </div>
  </div>`;
}

function list(items, mapper) {
  return `<ul>${items.map(mapper).join("")}</ul>`;
}

function connectionPanel() {
  return `<div class='card'>
    <div class='title'>Connection Diagnostics</div>
    <p class='small muted'>API Base URL: <strong>${state.baseUrl || "Not configured"}</strong></p>
    <p class='small muted'>Auth Mode: <strong>${authModeLabel()}</strong></p>
    <div class='stack'>
      <input id='base' placeholder='https://your-preview.vercel.app/api/misato' value='${state.baseUrl || ""}' />
      <input id='token' type='password' autocomplete='off' placeholder='MISATO_DESKTOP_AUTH_TOKEN (local only)' value='' />
      <input id='bypass' type='password' autocomplete='off' placeholder='VERCEL_PROTECTION_BYPASS (optional local only)' value='' />
      <p class='small muted'>Desktop token ${state.token ? "configured" : "not configured"}; bypass token ${state.bypassToken ? "configured" : "not configured"}.</p>
    </div>
    <div class='row'>
      <button id='test'>Test Connection</button>
      <button id='save'>Save Config</button>
    </div>
    <p class='small ${isConnected() ? "ok" : state.connTest.label === "Unauthorized" ? "warn" : "bad"}'>Connection status: ${state.connTest.label}</p>
    <p class='small muted'>HTTP status: ${state.connTest.httpStatus ?? "n/a"}</p>
    <p class='small muted'>Last checked: ${state.connTest.checkedAt || "never"}</p>
    ${state.connTest.error ? `<p class='small bad'>Error: ${state.connTest.error}</p>` : ""}
    <p class='small muted'>Next fix: ${state.connTest.nextFix}</p>
  </div>`;
}

function appView() {
  const configured = !!state.baseUrl;
  const commandEnabled = configured && isConnected();

  return `<div class='wrap'>
    <div class='card top'>
      <div class='title'>MISATO Mission Control</div>
      <span class='small ${isConnected() ? "ok" : "bad"}'>${isConnected() ? "Connected" : "Disconnected"}</span>
      <span class='small muted'>API: ${state.baseUrl || "not set"}</span>
      <button id='reload'>Refresh Data</button>
      <button id='reconfig'>Config</button>
    </div>

    ${connectionPanel()}

    ${state.lastError ? `<div class='card bad'>Error: ${state.lastError}</div>` : ""}

    <div class='grid'>
      <div class='stack'>
        <div class='card'>
          <div class='title'>MISATO Core command input</div>
          <textarea id='cmd' placeholder='What needs attention today?' ${commandEnabled ? "" : "disabled"}></textarea>
          <div class='row'><button id='run' ${commandEnabled ? "" : "disabled"}>Run command</button></div>
          ${!configured ? `<p class='small warn'>Set MISATO_API_BASE_URL to enable commands.</p>` : ""}
          ${configured && !isConnected() ? `<p class='small warn'>Run Test Connection first. Retry until Connected.</p>` : ""}
          ${state.commandResult ? `<p class='small muted'>${state.commandResult.missionSummary || ""}</p>` : ""}
        </div>

        <div class='card'><div class='title'>Council activity</div>${list(state.council.slice(0, 8), (a) => `<li>${a.name} — <span class='muted'>${a.status}</span></li>`)}</div>
        <div class='card'><div class='title'>Projects</div>${list(state.projects.slice(0, 6), (p) => `<li>${p.name} — ${p.status} (${p.priority})</li>`)}</div>
        <div class='card'><div class='title'>Kanban / Tasks</div>${list(state.tasks.slice(0, 8), (t) => `<li>${t.title} — ${t.status}</li>`)}</div>
      </div>
      <div class='stack'>
        <div class='card'><div class='title'>Approvals</div>${list(state.approvals.slice(0, 6), (a) => `<li>${a.actionType} — <span class='warn'>${a.status}</span></li>`)}</div>
        <div class='card'><div class='title'>Logs</div>${list(state.logs.slice(0, 8), (l) => `<li>${l.timestamp} — ${l.action}</li>`)}</div>
        <div class='card'><div class='title'>Status</div>
          <p class='small muted'>Owner/auth required server-side. Live automations disabled in v1.</p>
          <p class='small muted'>Memory/Obsidian + Discord endpoints available in mock mode.</p>
        </div>
      </div>
    </div>
  </div>`;
}

function bind() {
  document.getElementById("save")?.addEventListener("click", saveConfig);
  document.getElementById("test")?.addEventListener("click", testConnection);
  document.getElementById("reload")?.addEventListener("click", loadAll);
  document.getElementById("reconfig")?.addEventListener("click", () => {
    state.status = null;
    state.connTest = {
      label: "Not tested",
      httpStatus: null,
      checkedAt: null,
      error: "",
      nextFix: "Click Test Connection after configuring MISATO_API_BASE_URL."
    };
    render();
  });
  document.getElementById("run")?.addEventListener("click", sendCommand);
}

function render() {
  const root = document.getElementById("app");
  const showSetup = !state.baseUrl && !state.connTest.checkedAt;
  root.innerHTML = showSetup ? setupView() : appView();
  bind();
}

render();