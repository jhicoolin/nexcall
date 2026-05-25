const STORAGE_KEYS = {
  baseUrl: "misato_api_base_url",
  token: "misato_desktop_auth_token",
  bypassToken: "misato_vercel_bypass_token"
};

const storage = {
  get: (key, fallback = "") => {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => {
    try {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch {}
  }
};

const injectedBase = (window.__MISATO_API_BASE_URL__ || "").trim();
const state = {
  baseUrl: normalizeBaseUrl(storage.get(STORAGE_KEYS.baseUrl, injectedBase)),
  token: storage.get(STORAGE_KEYS.token, ""),
  bypassToken: storage.get(STORAGE_KEYS.bypassToken, ""),
  status: null,
  council: [],
  projects: [],
  tasks: [],
  approvals: [],
  logs: [],
  commandResult: null,
  lastError: "",
  commandHistory: [],
  connTest: {
    label: "Not tested",
    httpStatus: null,
    checkedAt: null,
    error: "",
    nextFix: "Click Test Connection after configuring MISATO_API_BASE_URL."
  }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function validateBaseUrl(value) {
  if (!value) return "MISATO_API_BASE_URL is missing.";
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return "API Base URL must start with http:// or https://.";
    if (!url.pathname.replace(/\/+$/, "").endsWith("/api/misato")) return "API Base URL must end with /api/misato.";
    return "";
  } catch {
    return "API Base URL is not a valid URL.";
  }
}

function headers() {
  const h = { "content-type": "application/json", accept: "application/json" };
  if (state.token) h["x-misato-desktop-token"] = state.token;
  if (state.bypassToken) h["x-vercel-protection-bypass"] = state.bypassToken;
  return h;
}

function endpoint(path) {
  return `${state.baseUrl}/${path}`;
}

function isConnected() {
  return state.connTest.label === "Connected";
}

function authModeLabel() {
  return `${state.token ? "desktop token configured" : "no desktop token"}; ${state.bypassToken ? "Vercel bypass configured" : "no Vercel bypass token"}`;
}

function statusClass(label) {
  return (
    {
      Connected: "connected",
      Unauthorized: "unauthorized",
      "Vercel Protected": "unauthorized",
      "404 / Wrong URL": "failed",
      Failed: "failed",
      "Not configured": "not-configured",
      "Not tested": "testing"
    }[label] || "testing"
  );
}

function errorForStatus(status, data) {
  if (status === 401 || status === 403) return data?.error || "Owner authentication required.";
  if (status === 404) return "MISATO route not found.";
  if (data?.error) return data.error;
  return `HTTP ${status}`;
}

function nextFixForStatus(status) {
  if (status === 401 || status === 403) return "Backend reached, but auth failed. Check desktop token and preview bypass token if Vercel protection is enabled.";
  if (status === 404) return "Wrong deployment URL. Use the misato-full-build preview URL ending in /api/misato.";
  if (status >= 500) return "Backend returned a server error. Ask Hermes to inspect the preview logs.";
  return "Cannot reach a usable backend state. Check URL, network, and preview deployment status.";
}

async function readJson(res) {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  if (!text) return {};
  if ((res.status === 401 || res.status === 403) && !contentType.includes("application/json")) {
    return {
      ok: false,
      __vercelProtected: true,
      error: "Vercel Protected - preview protection blocked the request. Add bypass token or disable preview protection for this deployment."
    };
  }
  if (contentType.includes("text/html") && !res.ok) return { ok: false, __vercelProtected: true, error: "Vercel Protected - preview protection blocked the request. Add bypass token or disable preview protection for this deployment." };
  if (!contentType.includes("application/json")) return { ok: false, error: text.slice(0, 240) || "Non-JSON response from backend." };
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: "Backend returned invalid JSON." };
  }
}

async function apiGet(path) {
  const res = await fetch(endpoint(path), { headers: headers() });
  const data = await readJson(res);
  return { res, data };
}

async function testConnection() {
  state.baseUrl = normalizeBaseUrl(state.baseUrl);
  const urlError = validateBaseUrl(state.baseUrl);
  const checkedAt = new Date().toISOString();
  if (urlError) {
    state.connTest = { label: "Not configured", httpStatus: null, checkedAt, error: urlError, nextFix: "Paste the preview backend URL ending in /api/misato." };
    return render();
  }

  try {
    state.connTest = { label: "Testing", httpStatus: null, checkedAt, error: "", nextFix: "Checking MISATO backend reachability and auth." };
    render();
    const { res, data } = await apiGet("status");
    if (res.ok && data?.ok) {
      state.status = data;
      state.connTest = { label: "Connected", httpStatus: res.status, checkedAt, error: "", nextFix: "Connected to MISATO backend. Owner/auth check passed." };
      await loadAll(false);
    } else if (data?.__vercelProtected) {
      state.connTest = { label: "Vercel Protected", httpStatus: res.status, checkedAt, error: data.error, nextFix: "Add bypass token or disable preview protection for this deployment." };
    } else {
      const label = res.status === 401 || res.status === 403 ? "Unauthorized" : res.status === 404 ? "404 / Wrong URL" : "Failed";
      state.connTest = { label, httpStatus: res.status, checkedAt, error: errorForStatus(res.status, data), nextFix: nextFixForStatus(res.status) };
    }
  } catch (e) {
    state.connTest = {
      label: "Failed",
      httpStatus: null,
      checkedAt,
      error: String(e?.message || e),
      nextFix: "Failed to fetch - likely CORS/CORP, Vercel protection, network, or wrong URL."
    };
  }
  render();
}

async function loadAll(triggerRender = true) {
  if (!state.baseUrl || validateBaseUrl(state.baseUrl)) {
    if (triggerRender) render();
    return;
  }

  state.lastError = "";
  try {
    const [c, p, t, a] = await Promise.all([apiGet("council"), apiGet("projects"), apiGet("tasks"), apiGet("approvals")]);
    if (c.res.ok) state.council = c.data.items || [];
    if (p.res.ok) state.projects = p.data.items || [];
    if (t.res.ok) state.tasks = t.data.items || [];
    if (a.res.ok) state.approvals = a.data.items || [];
    state.logs = state.commandHistory.slice(0, 8).map((entry, index) => ({
      id: `local-${index}`,
      timestamp: entry.ts,
      action: entry.role === "user" ? "Command sent" : "Command response"
    }));
  } catch (e) {
    state.lastError = String(e?.message || e);
  }
  if (triggerRender) render();
}

async function sendCommand(prefill) {
  const input = document.getElementById("cmd");
  if (prefill && input && !input.disabled) input.value = prefill;
  const command = (input?.value || prefill || "").trim();
  if (!command) return;
  if (!state.baseUrl || validateBaseUrl(state.baseUrl)) {
    state.lastError = "Set a valid MISATO_API_BASE_URL before sending commands.";
    return render();
  }
  if (!isConnected()) {
    state.lastError = "Run Test Connection successfully before sending commands.";
    return render();
  }

  try {
    const res = await fetch(endpoint("command"), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ command })
    });
    const data = await readJson(res);
    if (data?.__vercelProtected) throw new Error("Vercel Protected - preview protection blocked the request. Add bypass token or disable preview protection for this deployment.");
    if (!res.ok || !data?.ok) throw new Error(errorForStatus(res.status, data));

    const result = data.result || data;
    state.commandResult = result;
    const summary = result?.missionSummary || data?.missionSummary || "Command completed.";
    state.commandHistory.unshift(
      { role: "user", text: command, ts: new Date().toISOString() },
      { role: "core", text: summary, result, ts: new Date().toISOString() }
    );
    state.commandHistory = state.commandHistory.slice(0, 12);
    state.lastError = "";
    if (input) input.value = "";
    await loadAll(false);
  } catch (e) {
    state.lastError = String(e?.message || e);
  }
  render();
  const stream = document.getElementById("stream");
  if (stream) stream.scrollTop = 0;
}

function saveConfig() {
  state.baseUrl = normalizeBaseUrl(document.getElementById("base")?.value || "");
  const enteredToken = (document.getElementById("token")?.value || "").trim();
  const enteredBypass = (document.getElementById("bypass")?.value || "").trim();
  if (enteredToken) state.token = enteredToken;
  if (enteredBypass) state.bypassToken = enteredBypass;

  const urlError = validateBaseUrl(state.baseUrl);
  storage.set(STORAGE_KEYS.baseUrl, state.baseUrl);
  storage.set(STORAGE_KEYS.token, state.token);
  storage.set(STORAGE_KEYS.bypassToken, state.bypassToken);
  state.connTest = {
    label: urlError ? "Not configured" : "Not tested",
    httpStatus: null,
    checkedAt: null,
    error: urlError,
    nextFix: urlError || "Click Test Connection to verify backend/auth."
  };
  render();
}

function clearTokens() {
  state.token = "";
  state.bypassToken = "";
  storage.set(STORAGE_KEYS.token, "");
  storage.set(STORAGE_KEYS.bypassToken, "");
  state.connTest = { label: "Not tested", httpStatus: null, checkedAt: null, error: "", nextFix: "Tokens cleared locally. Save a token, then click Test Connection." };
  render();
}

function renderResultDetails(result) {
  if (!result) return "";
  const list = (items) => (items || []).map((item) => `<li>${escapeHtml(typeof item === "string" ? item : JSON.stringify(item))}</li>`).join("");
  const feedback = (result.councilFeedback || []).map((item) => `<li><strong>${escapeHtml(item.agent)}</strong>: ${escapeHtml(item.feedback)}</li>`).join("");
  return `<div class='result'>
    <div class='small mono'>PROJECT: ${escapeHtml(result.projectDetected || "n/a")} | APPROVAL: ${escapeHtml(result.approvalRequired ? "required" : "not required")}</div>
    <p>${escapeHtml(result.missionSummary || "")}</p>
    ${feedback ? `<h4>Council</h4><ul class='list'>${feedback}</ul>` : ""}
    ${list(result.nextRecommendedActions) ? `<h4>Next Actions</h4><ul class='list'>${list(result.nextRecommendedActions)}</ul>` : ""}
    ${list(result.risksDetected) ? `<h4>Risks</h4><ul class='list'>${list(result.risksDetected)}</ul>` : ""}
  </div>`;
}

const StatusBar = () => `<div class='header'><div class='row'><div class='title'>MISATO Mission Control</div><span class='badge'>Preview</span></div><div class='row'><span class='status-chip ${statusClass(state.connTest.label)}'><span class='dot ${isConnected() ? "pulse" : ""}'></span>${escapeHtml(state.connTest.label)}</span><span class='small mono'>${state.connTest.checkedAt ? new Date(state.connTest.checkedAt).toLocaleTimeString() : "not checked"}</span></div></div>`;

const ConnectionPanel = () => `<div class='col'>
  <div class='card'><h3 class='h2'>Backend Connection</h3><div class='stack'>
    <input id='base' placeholder='https://your-preview.vercel.app/api/misato' value='${escapeHtml(state.baseUrl || "")}' />
    <input id='token' type='password' autocomplete='off' placeholder='MISATO_DESKTOP_AUTH_TOKEN (local only)' value='' />
    <input id='bypass' type='password' autocomplete='off' placeholder='VERCEL_PROTECTION_BYPASS (optional local only)' value='' />
    <div class='row'><button id='save'>Save Config</button><button id='test' class='secondary'>Test Connection</button><button id='clear-tokens' class='secondary'>Clear Tokens</button></div>
  </div></div>
  <div class='card'><h3 class='h2'>Connection Result</h3><div class='kv'>
    <span class='k'>Status</span><span class='v'>${escapeHtml(state.connTest.label)}</span>
    <span class='k'>HTTP</span><span class='v'>${state.connTest.httpStatus ?? "n/a"}</span>
    <span class='k'>Checked</span><span class='v'>${escapeHtml(state.connTest.checkedAt || "never")}</span>
  </div>${state.connTest.error ? `<p class='small bad'>${escapeHtml(state.connTest.error)}</p>` : ""}<p class='small'>${escapeHtml(state.connTest.nextFix)}</p></div>
  <div class='card'><h3 class='h2'>Auth Mode</h3><p class='small'>${escapeHtml(authModeLabel())}</p><p class='small'>Owner/API auth enforced. Secrets never shown.</p></div>
</div>`;

const CommandCenter = () => {
  const enabled = !!state.baseUrl && !validateBaseUrl(state.baseUrl) && isConnected();
  return `<div class='card'><h3 class='h2'>Command Center</h3>
  <textarea id='cmd' placeholder='What needs attention today?' ${enabled ? "" : "disabled"}></textarea>
  <div class='row'><button id='run' ${enabled ? "" : "disabled"}>Run Command</button><button class='secondary quick' data-q='What needs attention today?' ${enabled ? "" : "disabled"}>Today</button><button class='secondary quick' data-q='Ask council what to do next' ${enabled ? "" : "disabled"}>Ask Council</button><button class='secondary quick' data-q='Show pending approvals' ${enabled ? "" : "disabled"}>Approvals</button></div>
  ${!state.baseUrl ? "<p class='small warn'>Set API Base URL first.</p>" : ""}
  ${state.baseUrl && validateBaseUrl(state.baseUrl) ? `<p class='small warn'>${escapeHtml(validateBaseUrl(state.baseUrl))}</p>` : ""}
  ${state.baseUrl && !isConnected() ? "<p class='small warn'>Test Connection until Connected before commands.</p>" : ""}
  ${state.lastError ? `<p class='small bad'>${escapeHtml(state.lastError)}</p>` : ""}
  <div id='stream' class='stream'>
    ${state.commandHistory
      .map((m) => `<div class='msg ${escapeHtml(m.role)}'><div class='small mono'>${escapeHtml(m.role.toUpperCase())} - ${new Date(m.ts).toLocaleTimeString()}</div><div>${escapeHtml(m.text)}</div>${m.result ? renderResultDetails(m.result) : ""}</div>`)
      .join("")}
  </div>
</div>`;
};

const CouncilPanel = () => `<div class='card'><h3 class='h2'>Council Activity</h3><ul class='list'>${state.council.slice(0, 8).map((a) => `<li>${escapeHtml(a.name)} - <span class='small'>${escapeHtml(a.status)}</span></li>`).join("") || "<li class='small'>No data</li>"}</ul></div>`;
const ApprovalPanel = () => `<div class='card'><h3 class='h2'>Approvals Queue</h3><ul class='list'>${state.approvals.slice(0, 8).map((a) => `<li>${escapeHtml(a.actionType)} - <span class='warn'>${escapeHtml(a.status)}</span></li>`).join("") || "<li class='small'>No approvals</li>"}</ul></div>`;
const ProjectsPanel = () => `<div class='card'><h3 class='h2'>Projects / Kanban</h3><ul class='list'>${state.projects.slice(0, 6).map((p) => `<li>${escapeHtml(p.name)} - ${escapeHtml(p.status)}</li>`).join("") || "<li class='small'>No projects</li>"}</ul></div>`;
const LogsPanel = () => `<div class='card'><h3 class='h2'>Logs</h3><ul class='list'>${state.logs.slice(0, 8).map((l) => `<li><span class='mono'>${escapeHtml(l.timestamp || "")}</span> - ${escapeHtml(l.action || "event")}</li>`).join("") || "<li class='small'>No logs</li>"}</ul></div>`;
const IntegrationsPanel = () => `<div class='card'><h3 class='h2'>Integrations</h3><p class='small'>Discord/Obsidian/GitHub/Vercel status only. Live automations disabled.</p></div>`;

const MisatoShell = () => `<div class='shell'>${StatusBar()}<div class='layout'>${ConnectionPanel()}<div class='col'>${CommandCenter()}${CouncilPanel()}${ProjectsPanel()}</div><div class='col'>${ApprovalPanel()}${LogsPanel()}${IntegrationsPanel()}</div></div></div>`;

function bind() {
  document.getElementById("save")?.addEventListener("click", saveConfig);
  document.getElementById("test")?.addEventListener("click", testConnection);
  document.getElementById("clear-tokens")?.addEventListener("click", clearTokens);
  document.getElementById("run")?.addEventListener("click", () => sendCommand());
  document.querySelectorAll(".quick").forEach((button) => button.addEventListener("click", () => sendCommand(button.dataset.q || "")));
  document.getElementById("cmd")?.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      sendCommand();
    }
  });
}

function render() {
  document.getElementById("app").innerHTML = MisatoShell();
  bind();
}

render();
