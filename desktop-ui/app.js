/* ================================================================
   MISATO Mission Control · app.js
   Branch: misato-claude-ui
   Tactical HUD — all views, all states, all mock data
   API contracts unchanged. No secrets logged. No auth modified.
   ================================================================ */

// ── Mock / Static data ─────────────────────────────────────────

const COUNCIL_AGENTS = [
  { id:'strategy', name:'Strategy Agent',         role:'Mission Planning',     specialty:'Goal alignment, priority sequencing, OKRs', perm:'Advisory', risk:'Low',    state:'idle',     feedback:'Awaiting next mission command.' },
  { id:'ui',       name:'Claude UI Agent',         role:'UI Lane Lead',         specialty:'Desktop polish, UX architecture, component design', perm:'Build', risk:'Low', state:'complete', feedback:'Tactical HUD v2 ready for handoff to Hermes.' },
  { id:'backend',  name:'Hermes Architecture Agent',role:'Backend Lane Lead',  specialty:'API routes, auth middleware, integrations, build safety', perm:'Build', risk:'Medium', state:'thinking', feedback:'Verifying bypass token propagation in Preview env.' },
  { id:'security', name:'Security Agent',          role:'Threat Analysis',      specialty:'Auth gates, secret safety, injection vectors', perm:'Audit', risk:'Low',   state:'idle',     feedback:'No secrets detected in UI layer. Token masked.' },
  { id:'qa',       name:'QA Agent',                role:'Quality Assurance',    specialty:'Edge cases, connection state coverage, regression', perm:'Audit', risk:'Low', state:'idle',  feedback:'7 connection states covered. Lint required.' },
  { id:'vercel',   name:'Vercel Deploy Agent',     role:'Deployment Ops',       specialty:'Preview gates, env propagation, production lock', perm:'Deploy', risk:'High', state:'blocked', feedback:'MISATO_DESKTOP_AUTH_TOKEN set. Redeploy needed.' },
  { id:'bizops',   name:'Business Ops Agent',      role:'Operations',           specialty:'Revenue tracking, KPIs, client ops', perm:'Advisory', risk:'Low', state:'idle', feedback:'NexCall pricing live. MISATO internal only.' },
  { id:'marketing',name:'Marketing Agent',         role:'Growth',               specialty:'Positioning, Discord presence, copy', perm:'Advisory', risk:'Low', state:'idle', feedback:'No public-facing changes in this build.' },
  { id:'finance',  name:'Finance Agent',           role:'Financial Analysis',   specialty:'Revenue modeling, cost tracking, Stripe events', perm:'Advisory', risk:'Low', state:'idle', feedback:'Stripe plans stable. No pricing changes.' },
  { id:'research', name:'Research Agent',          role:'Intelligence',         specialty:'Market intel, tech trends, competitor tracking', perm:'Advisory', risk:'Low', state:'idle', feedback:'Standing by for research requests.' },
  { id:'obsidian', name:'Obsidian Librarian Agent',role:'Knowledge Base',       specialty:'Vault sync, project brain, daily command notes', perm:'Read',    risk:'Low', state:'idle', feedback:'Mirror planned. No vault writes in v1.' },
  { id:'github',   name:'GitHub Handoff Agent',    role:'Code Handoffs',        specialty:'Branch management, PR coordination, commit safety', perm:'Commit', risk:'Medium', state:'idle', feedback:'misato-claude-ui branch ready to push.' },
  { id:'discord',  name:'Discord Integration Agent',role:'Community Ops',       specialty:'#misato channel, bot commands, @misato#6010', perm:'Mock', risk:'Low', state:'idle', feedback:'Discord integration planned. Mock mode only.' },
  { id:'approval', name:'Approval Gate Agent',     role:'Owner Authorization',  specialty:'High-risk gates, production deploys, env changes', perm:'Gate', risk:'High', state:'idle', feedback:'No live approvals pending.' }
];

const MOCK_PROJECTS = [
  { name:'NexCall',      status:'Active',      priority:'High',   risk:'Medium', nextAction:'Deploy MISATO backend to production',    agents:['Strategy','Backend','Vercel Deploy'], taskCount:14, slug:'nexcall' },
  { name:'Bad Genetics', status:'Active',      priority:'Medium', risk:'Low',    nextAction:'Complete checkout and auth flow',         agents:['UI Builder','Backend','QA'],           taskCount:9,  slug:'genetics' },
  { name:'Client Sites', status:'Maintenance', priority:'Low',    risk:'Low',    nextAction:'Monthly performance review',             agents:['QA'],                                  taskCount:3,  slug:'clients' },
  { name:'Personal Ops', status:'Planning',    priority:'Medium', risk:'Low',    nextAction:'Define Q3 goals and agent assignments',   agents:['Strategy','Finance'],                  taskCount:6,  slug:'personal' },
  { name:'Research Lab', status:'Active',      priority:'Low',    risk:'Low',    nextAction:'Document AI agent architecture findings', agents:['Research','Obsidian'],                 taskCount:7,  slug:'research' }
];

const MOCK_TASKS = [
  { title:'Set MISATO_DESKTOP_AUTH_TOKEN in Vercel Preview', project:'NexCall',      priority:'High',   risk:'Low',    agent:'Hermes',   status:'Done',    approvalRequired:false },
  { title:'Add Vercel bypass token to desktop config UI',     project:'NexCall',      priority:'High',   risk:'Low',    agent:'Claude UI','status':'Done',    approvalRequired:false },
  { title:'Build tactical HUD UI (Pixel Spec v2)',            project:'NexCall',      priority:'High',   risk:'Low',    agent:'Claude UI','status':'Doing',   approvalRequired:false },
  { title:'Redeploy misato-full-build after env var update',  project:'NexCall',      priority:'High',   risk:'Low',    agent:'Hermes',   status:'Doing',   approvalRequired:false },
  { title:'Rebuild MISATO.exe with new desktop-ui',           project:'NexCall',      priority:'High',   risk:'Low',    agent:'Owner',    status:'Doing',   approvalRequired:false },
  { title:'Connect production MISATO routes to nexcall.one',  project:'NexCall',      priority:'Medium', risk:'High',   agent:'Hermes',   status:'Blocked', approvalRequired:true  },
  { title:'Wire live Obsidian vault sync',                    project:'NexCall',      priority:'Low',    risk:'Medium', agent:'Obsidian', status:'Idea',    approvalRequired:true  },
  { title:'Bad Genetics Stripe checkout integration',         project:'Bad Genetics',  priority:'Medium', risk:'Medium', agent:'Backend',  status:'Idea',    approvalRequired:false },
  { title:'Bad Genetics UI polish pass',                      project:'Bad Genetics',  priority:'Low',    risk:'Low',    agent:'Claude UI','status':'Idea',    approvalRequired:false }
];

const MOCK_LOGS = [
  { ts:'00:07:11', src:'CONN-TEST',  project:'NexCall',  agent:'Claude UI',  action:'GET /api/misato/status → Vercel SSO wall detected', risk:'Low' },
  { ts:'00:05:42', src:'DESKTOP',   project:'NexCall',  agent:'Owner',      action:'Bypass token generated and saved to Vercel Preview', risk:'Low' },
  { ts:'00:03:18', src:'DEPLOY',    project:'NexCall',  agent:'Hermes',     action:'Commit 24662b7 pushed to misato-full-build', risk:'Low' },
  { ts:'00:01:55', src:'BUILD',     project:'NexCall',  agent:'Claude UI',  action:'desktop-ui v1 files written to outputs/', risk:'Low' },
  { ts:'23:58:02', src:'AUTH',      project:'NexCall',  agent:'Security',   action:'MISATO_DESKTOP_AUTH_TOKEN set in Vercel Preview env', risk:'Low' }
];

const INTEGRATIONS = [
  { name:'Vercel Preview',      mode:'connected', status:'Active',   next:'Redeploy after env var update to pick up token' },
  { name:'GitHub Handoffs',     mode:'ready',     status:'Ready',    next:'Push misato-claude-ui branch, open handoff PR' },
  { name:'Obsidian Mirror',     mode:'planned',   status:'Planned',  next:'Set OBSIDIAN_VAULT_PATH, owner approval required' },
  { name:'Discord @misato',     mode:'mock',      status:'Mock',     next:'Wire DISCORD_BOT_TOKEN, enable #misato channel' },
  { name:'Claude UI Lane',      mode:'connected', status:'Active',   next:'Tactical HUD v2 in review' },
  { name:'Hermes Backend Lane', mode:'ready',     status:'Active',   next:'Verifying bypass token + redeploy' },
  { name:'MISATO Council',      mode:'mock',      status:'Mock v1',  next:'14 agents active in mock mode, live pending approval' },
  { name:'Approval Gate',       mode:'ready',     status:'Ready',    next:'No approvals pending. Gate armed.' },
  { name:'MISATO Watchtower',   mode:'mock',      status:'Planned',  next:'Service health grid active; Uptime Kuma backend integration planned' },
  { name:'Design System Library', mode:'ready',   status:'Active',   next:'DESIGN.md + style guides available for Claude/Hermes' },
  { name:'Secret Sentinel',     mode:'manual',    status:'Manual',   next:'Run npm run secrets:scan for redacted local findings' }
];

const AGENT_LANES = [
  {
    id:'claude', cls:'lane-claude',
    name:'Claude UI Lane',
    branch:'misato-claude-ui',
    status:'active',
    statusCls:'t-data',
    currentTask:'Tactical HUD v2 build (Pixel Spec)',
    lastHandoff:'desktop-ui v1 → Hermes for build',
    blockers:'None',
    next:'Commit + push misato-claude-ui, notify Hermes',
    owns:'Desktop UI, visual design, layout, UX polish, interaction states'
  },
  {
    id:'hermes', cls:'lane-hermes',
    name:'Hermes Backend Lane',
    branch:'misato-hermes-backend',
    status:'active',
    statusCls:'t-warn',
    currentTask:'Bypass token propagation + Preview redeploy',
    lastHandoff:'Token env set, awaiting Claude UI polish lane',
    blockers:'MISATO.exe rebuild needed by owner',
    next:'Verify redeploy, confirm /api/misato/status returns 200',
    owns:'Backend API, auth middleware, integrations, build safety'
  },
  {
    id:'misato', cls:'lane-misato',
    name:'MISATO Coordinator',
    branch:'misato-full-build',
    status:'coordinating',
    statusCls:'t-ok',
    currentTask:'Council report, merge coordination',
    lastHandoff:'Hermes ↔ Claude UI sync',
    blockers:'None',
    next:'Merge misato-claude-ui → misato-full-build after review',
    owns:'Council orchestration, merge gating, handoff docs'
  },
  {
    id:'owner', cls:'lane-owner',
    name:'Owner Approval Lane',
    branch:'main (gate)',
    status:'standing by',
    statusCls:'t-bad',
    currentTask:'Close MISATO.exe → run cargo tauri build',
    lastHandoff:'Bypass token generated and saved',
    blockers:'Production deploy requires owner approval',
    next:'Launch rebuilt MISATO.exe, enter tokens, Test Connection',
    owns:'Production deploys, env vars, DNS, risky action approvals'
  }
];

const OBSIDIAN_FOLDERS = [
  { name:'Daily Command',      desc:'Active missions, today\'s priorities, blockers' },
  { name:'Active Missions',    desc:'Ongoing project briefs and deliverables' },
  { name:'Agent Status',       desc:'Council agent assignments and feedback' },
  { name:'Claude↔Hermes',      desc:'Cross-lane handoff notes and decisions' },
  { name:'Project Decisions',  desc:'Architecture choices, trade-off records' },
  { name:'Council Reports',    desc:'Consensus summaries and risk assessments' }
];

const QUICK_PROMPTS = [
  'What needs attention today?',
  'Ask the council',
  'Review pending approvals',
  'Create a NexCall mission',
  'Check project blockers',
  'Prepare Claude UI polish task'
];

// ── Storage ────────────────────────────────────────────────────
const storage = {
  get(k, d='') { try { return localStorage.getItem(k) || d; } catch { return d; } },
  set(k, v)    { try { localStorage.setItem(k, v); } catch {} }
};

// ── State ──────────────────────────────────────────────────────
const injectedBase = (window.__MISATO_API_BASE_URL__ || '').trim();
const state = {
  mode:        storage.get('misato_mode', 'preview'),
  baseUrl:     storage.get('misato_api_base_url', injectedBase),
  token:       storage.get('misato_desktop_auth_token', ''),
  bypassToken: storage.get('misato_vercel_bypass_token', ''),
  // api data (falls back to mock)
  council:   [],
  projects:  [],
  tasks:     [],
  approvals: [],
  logs:      [],
  // ui
  activeTab:  'cmd',
  messages:   [],
  loading:    false,
  lastError:  '',
  connTest: {
    label:     'Not configured',
    cls:       'unconfigured',
    httpStatus: null,
    checkedAt:  null,
    error:      '',
    nextFix:    'Set MISATO_API_BASE_URL to your private MISATO backend.'
  }
};

// ── Helpers ────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' }); }
  catch { return iso; }
}

function now() { return new Date().toISOString(); }
function isConnected() { return state.connTest.label === 'Connected'; }
function esc(s) { return String(s || '').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const MODES = {
  local: 'local',
  preview: 'preview',
  production: 'production'
};

function applyModeDefaults(mode, preserve=false) {
  state.mode = mode;
  if (mode === MODES.local) {
    state.baseUrl = 'http://localhost:3000/api/misato';
    if (!preserve) {
      state.token = '';
      state.bypassToken = '';
    }
  }
}

function modeLabel() {
  if (state.mode === MODES.local) return 'Local';
  if (state.mode === MODES.production) return 'Production';
  return 'Preview';
}

function connCls(label) {
  if (label === 'Connected')        return 'connected';
  if (label === 'Unauthorized')     return 'unauthorized';
  if (label === 'Vercel Protected') return 'protected';
  if (label === '404 / Wrong URL')  return 'not-found';
  if (label === 'Testing…')         return 'testing';
  if (label === 'Failed')           return 'failed';
  return 'unconfigured';
}

// ── Network layer (unchanged) ──────────────────────────────────
function headers() {
  const h = { 'content-type': 'application/json' };
  if (state.mode !== MODES.local && state.token) h['x-misato-desktop-token'] = state.token;
  if (state.mode !== MODES.local && state.bypassToken) h['x-vercel-protection-bypass'] = state.bypassToken;
  return h;
}

function endpoint(path) {
  return `${state.baseUrl.replace(/\/$/, '')}/${path}`;
}

async function apiGet(path) {
  const res  = await fetch(endpoint(path), { headers: headers() });
  // Detect Vercel SSO wall (returns HTML not JSON)
  const ct   = res.headers.get('content-type') || '';
  if (ct.includes('text/html') && !res.ok) {
    return { res, data: { __vercelProtected: true }, html: true };
  }
  const data = await res.json().catch(() => ({ ok: false, error: 'Invalid JSON' }));
  return { res, data };
}

// ── Actions ────────────────────────────────────────────────────
async function testConnection() {
  if (!state.baseUrl) {
    state.connTest = {
      label:'Not configured', cls:'unconfigured',
      httpStatus: null, checkedAt: now(),
      error: '',
      nextFix: 'Set MISATO_API_BASE_URL to your private MISATO backend. Use the misato-full-build preview URL, not nexcall.one, until production MISATO routes are deployed.'
    };
    render(); return;
  }

  state.connTest = { ...state.connTest, label:'Testing…', cls:'testing' };
  render();

  try {
    const { res, data, html } = await apiGet('status');
    const checkedAt = now();

    if (html || data?.__vercelProtected) {
      state.connTest = { label:'Vercel Protected', cls:'protected', httpStatus: res.status, checkedAt,
        error: 'Vercel deployment protection is blocking requests.',
        nextFix: 'Vercel Preview Protection is blocking this. Disable it for this preview or use Advanced bypass token.'
      };
    } else if (res.ok && data?.ok) {
      state.connTest = { label:'Connected', cls:'connected', httpStatus: res.status, checkedAt,
        error: '', nextFix: 'Connected to MISATO backend. Owner/auth check passed.' };
      await loadAll(false);
    } else if (res.status === 401 || data?.auth === 'invalid') {
      state.connTest = { label:'Unauthorized', cls:'unauthorized', httpStatus: res.status, checkedAt,
        error: data?.error || 'unauthorized',
        nextFix: state.mode === MODES.local ? 'Local mode should not require a token. Ensure npm run dev is running on localhost:3000.' : 'Desktop token is missing or mismatched. Verify MISATO_DESKTOP_AUTH_TOKEN and retry.'
      };
    } else if (res.status === 404) {
      state.connTest = { label:'404 / Wrong URL', cls:'not-found', httpStatus: 404, checkedAt,
        error: 'Route not found.',
        nextFix: '404 means wrong deployment URL. Confirm MISATO_API_BASE_URL ends with /api/misato and the misato-full-build deployment is live in Vercel.'
      };
    } else {
      state.connTest = { label:'Failed', cls:'failed', httpStatus: res.status, checkedAt,
        error: data?.error || `HTTP ${res.status}`,
        nextFix: 'Failed means network error, wrong URL, or preview unavailable. Check MISATO_API_BASE_URL is the exact Preview URL from Vercel.'
      };
    }
  } catch (e) {
    state.connTest = { label:'Failed', cls:'failed', httpStatus: null, checkedAt: now(),
      error: String(e.message || e),
      nextFix: 'Cannot reach backend. Check MISATO_API_BASE_URL and your network connection.'
    };
  }
  render();
}

async function loadAll(triggerRender=true) {
  if (!state.baseUrl) { if (triggerRender) render(); return; }
  state.lastError = '';
  try {
    const [council, projects, tasks, approvals, logs] = await Promise.allSettled([
      apiGet('council'), apiGet('projects'), apiGet('tasks'),
      apiGet('approvals'), apiGet('logs')
    ]);
    if (council.status   === 'fulfilled' && council.value.res.ok)   state.council   = council.value.data.items   || [];
    if (projects.status  === 'fulfilled' && projects.value.res.ok)  state.projects  = projects.value.data.items  || [];
    if (tasks.status     === 'fulfilled' && tasks.value.res.ok)     state.tasks     = tasks.value.data.items     || [];
    if (approvals.status === 'fulfilled' && approvals.value.res.ok) state.approvals = approvals.value.data.items || [];
    if (logs.status      === 'fulfilled' && logs.value.res.ok)      state.logs      = logs.value.data.items      || [];
  } catch (e) {
    state.lastError = String(e.message || e);
  }
  if (triggerRender) render();
}

async function sendCommand(cmdText) {
  const cmd = (cmdText || '').trim();
  if (!cmd || !state.baseUrl) return;

  state.messages.push({ type:'command', content:cmd, ts:now(), tags:['cmd'] });
  state.loading = true;
  state.lastError = '';
  render();

  try {
    const res  = await fetch(endpoint('command'), {
      method:'POST', headers:headers(),
      body: JSON.stringify({ command: cmd })
    });
    // Check for Vercel protection
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('text/html') && !res.ok) {
      state.messages.push({ type:'error', content:'Vercel deployment protection blocked this request. Add bypass token in Config.', ts:now(), tags:['core'] });
      state.loading = false;
      render(); return;
    }
    const data = await res.json().catch(() => ({ ok:false, error:'Invalid JSON' }));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    const result = data.result || {};
    state.messages.push({
      type:'reply',
      content: result.missionSummary || 'Command processed by MISATO Core.',
      ts: now(), tags:['core'],
      approvalRequired: result.approvalRequired || false
    });
    (result.councilFeedback || []).slice(0, 3).forEach(fb => {
      state.messages.push({ type:'council', content:`${fb.agent}: ${fb.feedback}`, ts:now(), tags:['council'] });
    });
    if (result.risksDetected?.length) {
      state.messages.push({ type:'council',
        content:`Risks: ${result.risksDetected.slice(0,3).join(' · ')}`, ts:now(), tags:['risk'] });
    }
    if (result.nextRecommendedActions?.length) {
      state.messages.push({ type:'reply',
        content:`Next: ${result.nextRecommendedActions.slice(0,2).join(' | ')}`, ts:now(), tags:['core'] });
    }
  } catch (e) {
    state.lastError = String(e.message || e);
  }
  state.loading = false;
  render();
}

function saveConfig() {
  const mode = (document.getElementById('cfg-mode')?.value || state.mode || MODES.preview).trim();
  const base = (document.getElementById('cfg-base')?.value || '').trim();
  const token = (document.getElementById('cfg-token')?.value || '').trim();
  const bypass = (document.getElementById('cfg-bypass')?.value || '').trim();

  applyModeDefaults(mode, true);
  if (base) state.baseUrl = base;
  if (mode === MODES.local) {
    state.token = '';
    state.bypassToken = '';
  } else {
    if (token) state.token = token;
    if (bypass) state.bypassToken = bypass;
  }

  storage.set('misato_mode', state.mode);
  storage.set('misato_api_base_url', state.baseUrl);
  storage.set('misato_desktop_auth_token', state.token);
  storage.set('misato_vercel_bypass_token', state.bypassToken);
  state.connTest = { label:'Not tested', cls:'unconfigured', httpStatus:null, checkedAt:null,
    error:'', nextFix:'Click Test Connection to verify backend/auth.' };
  render();
}

function setTab(tab) { state.activeTab = tab; render(); }

// ── Header + Status Bar ────────────────────────────────────────
function renderHeader() {
  const cls = connCls(state.connTest.label);
  const ts  = state.connTest.checkedAt ? fmtTime(state.connTest.checkedAt) : null;
  return `
    <header class="hdr">
      <div class="hdr-left">
        <div class="hdr-logo">
          <div class="hdr-logo-mark">M</div>
          <div>
            <div class="hdr-title">MISATO</div>
            <div class="hdr-sub">Mission Control · Owner Only</div>
          </div>
        </div>
        <div class="hdr-sep"></div>
        <span class="hdr-badge hdr-badge-preview">${modeLabel()}</span>
      </div>
      <div class="hdr-right">
        <span class="hdr-badge hdr-badge-safe">⊘ Automations Disabled</span>
        <div class="status-chip chip-${cls}">
          <span class="led"></span>
          ${esc(state.connTest.label)}
        </div>
        ${ts ? `<span class="mono fs9 t-faint">${ts}</span>` : ''}
        <button class="btn btn-secondary" id="btn-reload" style="flex:none;padding:5px 10px">↺</button>
      </div>
    </header>`;
}

// ── Sidebar (ConnectionPanel) ──────────────────────────────────
function renderSidebar() {
  const cls = connCls(state.connTest.label);
  const councilData = state.council.length ? state.council : COUNCIL_AGENTS;
  const thinking = councilData.filter(a => a.state === 'thinking').length;
  const blocked  = councilData.filter(a => a.state === 'blocked').length;
  const approvals= state.approvals.length || MOCK_TASKS.filter(t => t.approvalRequired).length;

  return `
    <div class="sidebar">
      <div class="sb-section">Connection Setup</div>

      <div class="sb-panel">
        <div class="sb-label">Mode</div>
        <select id="cfg-mode" class="m-input">
          <option value="local" ${state.mode===MODES.local?'selected':''}>Local Mode</option>
          <option value="preview" ${state.mode===MODES.preview?'selected':''}>Preview Mode</option>
          <option value="production" ${state.mode===MODES.production?'selected':''}>Production Mode</option>
        </select>
        <div class="m-input-hint">Current: ${modeLabel()} mode</div>

        <div class="sb-label" style="margin-top:10px">API Base URL</div>
        <input id="cfg-base" class="m-input" placeholder="https://…/api/misato" value="${esc(state.baseUrl)}" />
        <div class="m-input-hint">${state.mode===MODES.local ? 'Local Solo Mode: no token required. Run npm run dev first.' : state.mode===MODES.preview ? 'Preview mode uses one desktop token. Bypass token is advanced-only.' : 'Production must remain protected.'}</div>

        ${state.mode===MODES.local ? '' : `
        <div class="sb-label" style="margin-top:10px">Desktop Token</div>
        <input id="cfg-token" class="m-input" type="password" autocomplete="off" placeholder="MISATO_DESKTOP_AUTH_TOKEN" value="" />
        <div class="m-input-hint">Saved locally · ${state.token ? 'configured ✓' : 'not set'} · value never shown</div>

        <details style="margin-top:8px">
          <summary class="mono fs9 t-faint">Advanced: Vercel bypass token</summary>
          <div class="sb-label" style="margin-top:8px">Bypass Token</div>
          <input id="cfg-bypass" class="m-input" type="password" autocomplete="off" placeholder="x-vercel-protection-bypass" value="" />
          <div class="m-input-hint">Use only if Preview Protection is enabled.</div>
        </details>`}

        <div class="btn-row">
          <button class="btn btn-secondary" id="btn-save">Save</button>
          <button class="btn btn-primary" id="btn-test">Test Conn.</button>
        </div>
      </div>

      <div class="sb-panel">
        <div class="sb-label">Connection Result</div>
        <div class="conn-result ${cls}">
          <div class="conn-result-status">${esc(state.connTest.label)}</div>
          ${state.connTest.httpStatus != null ? `<div class="mono fs9 t-faint">HTTP ${state.connTest.httpStatus}</div>` : ''}
          <div class="conn-result-fix" style="margin-top:4px">${esc(state.connTest.nextFix)}</div>
          ${state.connTest.error ? `<div class="conn-result-err">${esc(state.connTest.error)}</div>` : ''}
          ${state.connTest.checkedAt ? `<div class="conn-result-ts">Last check: ${fmtTime(state.connTest.checkedAt)}</div>` : ''}
        </div>
      </div>

      <div class="sb-panel">
        <div class="sb-label">Auth Mode (${modeLabel()})</div>
        <div class="led-row" style="margin-bottom:6px">
          <span class="led ${state.token ? 'ok' : 'dim'}"></span>
          <span class="fs10 ${state.token ? 't-ok' : 't-faint'}">${state.token ? 'Desktop token configured' : 'No desktop token'}</span>
        </div>
        <div class="led-row" style="margin-bottom:6px">
          <span class="led ${state.bypassToken ? 'ok' : 'dim'}"></span>
          <span class="fs10 ${state.bypassToken ? 't-ok' : 't-faint'}">${state.bypassToken ? 'Bypass token configured' : 'No bypass token'}</span>
        </div>
        <div class="led-row">
          <span class="led ${isConnected() ? 'pulse-ok' : 'dim'}"></span>
          <span class="fs10 ${isConnected() ? 't-ok' : 't-faint'}">${isConnected() ? 'Owner auth verified' : 'Not verified'}</span>
        </div>
        <div class="divider"></div>
        <div class="mono fs9 t-faint">Tokens never logged or displayed in results.</div>
      </div>

      <div class="sb-panel">
        <div class="sb-label">Mission Stats</div>
        <div class="three-col" style="gap:4px;margin-bottom:0">
          <div class="stat-block">
            <div class="stat-val">${approvals}</div>
            <div class="stat-label">Approval</div>
          </div>
          <div class="stat-block">
            <div class="stat-val" style="color:var(--data)">${thinking}</div>
            <div class="stat-label">Active</div>
          </div>
          <div class="stat-block">
            <div class="stat-val" style="color:var(--bad)">${blocked}</div>
            <div class="stat-label">Blocked</div>
          </div>
        </div>
      </div>
    </div>`;
}

// ── Nav tabs ───────────────────────────────────────────────────
const TABS = [
  { id:'cmd',          key:'F1', label:'CMD',          dot:isConnected },
  { id:'council',      key:'F2', label:'Council',      dot:()=>false },
  { id:'projects',     key:'F3', label:'Projects',     dot:()=>false },
  { id:'approvals',    key:'F4', label:'Approvals',    dot:()=>(state.approvals.length + MOCK_TASKS.filter(t=>t.approvalRequired).length) > 0 },
  { id:'logs',         key:'F5', label:'Logs',         dot:()=>false },
  { id:'integrations', key:'F6', label:'Integrations', dot:()=>false },
  { id:'lanes',        key:'F7', label:'Lanes',        dot:()=>false },
  { id:'obsidian',     key:'F8', label:'Obsidian',     dot:()=>false }
];

function renderNav() {
  return `<nav class="nav">
    ${TABS.map(t => `
      <button class="nav-tab ${state.activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">
        <span class="nav-tab-key">${t.key}</span>
        <span class="nav-tab-dot"></span>
        ${t.label}
      </button>`).join('')}
  </nav>`;
}

// ── View: Command Center ───────────────────────────────────────
function renderCommandCenter() {
  const configured  = !!state.baseUrl;
  const cmdEnabled  = configured && isConnected();

  const streamContent = state.messages.length === 0
    ? `<div class="stream-empty">
        <div class="stream-empty-glyph">[ ◎ ]</div>
        <div class="stream-empty-text">No commands sent yet.<br>Select a quick prompt or type a mission command below.</div>
      </div>`
    : state.messages.map(m => {
        const tagHtml = (m.tags||[]).map(t => {
          const tc = t==='cmd'?'tag-cmd':t==='council'?'tag-council':t==='risk'?'tag-risk':'tag-core';
          return `<span class="tag ${tc}">${t}</span>`;
        }).join('');
        const appTag = m.approvalRequired ? `<span class="tag tag-approval">Approval Required</span>` : '';
        return `<div class="msg ${m.type}-msg">
          <div class="msg-bubble ${m.type}">${esc(m.content)}</div>
          <div class="msg-meta">${tagHtml}${appTag}<span>${fmtTime(m.ts)}</span></div>
        </div>`;
      }).join('');

  const loadingRow = state.loading
    ? `<div class="msg"><div class="msg-bubble thinking">▌ MISATO Core processing…</div></div>`
    : '';

  return `
    ${!configured ? `<div class="warn-banner">Set MISATO_API_BASE_URL in the sidebar to enable commands. Use the misato-full-build preview URL.</div>` : ''}
    ${configured && !isConnected() ? `<div class="info-banner">Run Test Connection until status shows Connected. Check sidebar for fix instructions.</div>` : ''}

    <div class="panel">
      <div class="panel-hd">
        <div class="panel-label">Quick Prompts</div>
        ${cmdEnabled ? `<span class="mono fs9 t-ok">● Ready</span>` : `<span class="mono fs9 t-faint">○ Connect first</span>`}
      </div>
      <div class="prompt-chips">
        ${QUICK_PROMPTS.map(p =>
          `<button class="prompt-chip" data-prompt="${esc(p)}" ${cmdEnabled ? '' : 'disabled'}>${esc(p)}</button>`
        ).join('')}
      </div>
    </div>

    <div class="panel" style="flex:1">
      <div class="panel-hd">
        <div class="panel-label">Response Stream</div>
        <span class="mono fs9 t-faint">${state.messages.length} msgs</span>
      </div>
      <div class="stream" id="stream">${streamContent}${loadingRow}</div>
    </div>

    <div class="panel">
      <div class="panel-label" style="margin-bottom:8px">MISATO Core Command</div>
      <textarea id="cmd" class="cmd-area" ${cmdEnabled ? '' : 'disabled'}
        placeholder="${cmdEnabled ? 'Type mission command… (Ctrl+Enter to send)' : 'Connect to MISATO backend first'}"></textarea>
      <div class="cmd-bar">
        <span class="cmd-hint">Ctrl+Enter to send · No live automations in v1</span>
        <button id="btn-run" class="btn btn-primary" ${cmdEnabled ? '' : 'disabled'}
          style="flex:none;padding:6px 16px">▶ Run</button>
      </div>
      ${state.lastError ? `<div style="margin-top:6px;padding:6px 10px;border:1px solid var(--bad-border);background:var(--bad-dim);font-family:var(--font-mono);font-size:9px;color:var(--bad)">${esc(state.lastError)}</div>` : ''}
    </div>`;
}

// ── View: Council ──────────────────────────────────────────────
function renderCouncil() {
  const agents = state.council.length ? state.council : COUNCIL_AGENTS;
  const thinking= agents.filter(a=>a.state==='thinking').map(a=>a.name).join(', ');
  const blocked = agents.filter(a=>a.state==='blocked').map(a=>a.name).join(', ');
  const complete= agents.filter(a=>a.state==='complete').length;

  return `
    <div class="consensus-bar">
      <div class="consensus-block">
        <div class="cb-label">Consensus Summary</div>
        <div class="cb-value" style="font-size:11px">MISATO desktop auth layer in progress. UI lane complete. Backend lane verifying redeploy.</div>
      </div>
      <div class="consensus-block" style="flex:0 0 160px">
        <div class="cb-label">Agents Active</div>
        <div class="cb-value" style="color:var(--data)">${agents.filter(a=>a.state!=='idle').length} / ${agents.length}</div>
      </div>
      <div class="consensus-block" style="flex:0 0 160px">
        <div class="cb-label">Risks Found</div>
        <div class="cb-value" style="color:var(--warn)">Production deploy not gated yet</div>
      </div>
    </div>

    ${blocked ? `<div class="warn-banner">⚠ Blocked: ${blocked}. Redeploy needed after env var update.</div>` : ''}
    ${thinking ? `<div class="info-banner">◎ Thinking: ${thinking}</div>` : ''}

    <div class="agent-grid">
      ${agents.map(a => `
        <div class="agent-card ${a.state}">
          <div class="agent-hd">
            <div>
              <div class="agent-name">${esc(a.name)}</div>
              <div class="agent-role">${esc(a.role)}</div>
            </div>
            <span class="agent-state-badge state-${a.state}">${a.state}</span>
          </div>
          <div class="agent-specialty">${esc(a.specialty)}</div>
          <div class="agent-meta">
            <span class="perm-badge">${esc(a.perm)}</span>
            <span class="risk-badge risk-${a.risk}">${a.risk} Risk</span>
          </div>
          <div class="agent-feedback">"${esc(a.feedback)}"</div>
        </div>`).join('')}
    </div>`;
}

// ── View: Projects / Kanban ────────────────────────────────────
function renderProjects() {
  const projects = state.projects.length ? state.projects : MOCK_PROJECTS;
  const tasks    = state.tasks.length    ? state.tasks    : MOCK_TASKS;

  const columns = { Idea:[], Doing:[], Blocked:[], Done:[] };
  tasks.forEach(t => { (columns[t.status] || columns.Idea).push(t); });

  function riskCls(r) { return r==='High'?'bad':r==='Medium'?'warn':'ok'; }
  function priBadge(p) { const c=p==='High'?'t-bad':p==='Medium'?'t-warn':'t-ok'; return `<span class="task-badge ${c}">${p}</span>`; }

  return `
    <div class="section-hd">Projects</div>
    <div class="project-grid">
      ${projects.map(p => `
        <div class="project-card">
          <div class="proj-name">${esc(p.name)}</div>
          <div class="proj-meta-row">
            <span class="task-badge t-${riskCls(p.risk)}">${p.risk} Risk</span>
            <span class="task-badge">${esc(p.status)}</span>
            <span class="task-badge">${esc(p.priority)} Pri</span>
            <span class="task-badge t-faint">${p.taskCount} tasks</span>
          </div>
          <div class="proj-next">→ ${esc(p.nextAction)}</div>
          <div class="proj-agents">Agents: ${esc(p.agents.join(' · '))}</div>
        </div>`).join('')}
    </div>

    <div class="section-hd">Kanban Board</div>
    <div class="kanban-board">
      ${['Idea','Doing','Blocked','Done'].map(col => `
        <div class="kanban-col">
          <div class="kanban-col-hd">
            <span class="led ${col==='Doing'?'data':col==='Blocked'?'bad':col==='Done'?'ok':'dim'}"></span>
            ${col} <span class="count">${columns[col].length}</span>
          </div>
          ${columns[col].map(t => `
            <div class="task-card ${col.toLowerCase()}">
              <div class="task-title">${esc(t.title)}</div>
              <div class="task-meta">
                ${priBadge(t.priority)}
                <span class="task-badge">${esc(t.project)}</span>
                <span class="task-badge t-dim">${esc(t.agent)}</span>
                ${t.approvalRequired ? '<span class="task-badge t-bad">⚑ Approval</span>' : ''}
              </div>
            </div>`).join('')}
          ${columns[col].length === 0 ? '<div class="log-empty">Empty</div>' : ''}
        </div>`).join('')}
    </div>`;
}

// ── View: Approvals ────────────────────────────────────────────
function renderApprovals() {
  const approvals = state.approvals.length ? state.approvals : [];
  const pending   = MOCK_TASKS.filter(t => t.approvalRequired);

  if (!approvals.length && !pending.length) {
    return `<div class="approval-empty">
      ✓ No approvals pending.<br>
      Approval Gate armed. Live automations disabled.
    </div>`;
  }

  const renderCard = (a, isTask=false) => `
    <div class="approval-card">
      <div class="approval-hd">
        <div>
          <div class="approval-type">${esc(isTask ? a.title : a.actionType || '—')}</div>
          <div class="approval-risk">Risk: ${esc(isTask ? a.risk : a.riskLevel || 'Unknown')}</div>
        </div>
        <span class="tag tag-approval">Approval Required</span>
      </div>
      <div class="approval-meta-row">
        <span>Project: ${esc(isTask ? a.project : a.project || '—')}</span>
        <span>Agent: ${esc(isTask ? a.agent : a.requestedBy || '—')}</span>
        ${!isTask && a.reason ? `<span>Reason: ${esc(a.reason)}</span>` : ''}
      </div>
      ${!isTask && a.preview ? `<div class="approval-reason">${esc(a.preview)}</div>` : ''}
      <div class="approval-btns">
        <button class="btn btn-danger approval-btn" disabled title="Live actions disabled in v1">✕ Reject</button>
        <button class="btn btn-warn approval-btn" disabled title="Live actions disabled in v1">↺ Revise</button>
        <button class="btn btn-primary approval-btn" disabled title="Live actions disabled in v1">✓ Approve</button>
      </div>
      <div class="mono fs9 t-faint" style="margin-top:6px">⊘ Approval buttons disabled in v1 — live actions not connected.</div>
    </div>`;

  return `
    <div class="warn-banner">⚑ ${approvals.length + pending.length} action(s) require owner approval. Approval Gate active. No actions will execute without your confirmation.</div>
    ${approvals.map(a => renderCard(a)).join('')}
    ${pending.length ? `<div class="section-hd">From Kanban</div>` : ''}
    ${pending.map(t => renderCard(t, true)).join('')}`;
}

// ── View: Logs ─────────────────────────────────────────────────
function renderLogs() {
  const logs = state.logs.length ? state.logs : MOCK_LOGS;
  const riskCls = r => r==='High'?'t-bad':r==='Medium'?'t-warn':'t-ok';

  return `
    <div class="panel-label" style="margin-bottom:8px">Operator Event Feed</div>
    <div class="log-feed">
      ${!logs.length
        ? '<div class="log-empty">No logs yet. Run a command or test connection.</div>'
        : logs.map(l => `
          <div class="log-row">
            <span class="log-ts">${esc(l.ts || fmtTime(l.timestamp))}</span>
            <span class="log-src">${esc(l.src || l.source || 'SYSTEM')}</span>
            <span class="log-agent">${esc(l.agent || '—')}</span>
            <span class="log-action">${esc(l.action)}</span>
            <span class="log-risk ${riskCls(l.risk || 'Low')}">${l.risk||'Low'}</span>
          </div>`).join('')}
    </div>`;
}

// ── View: Integrations ─────────────────────────────────────────
function renderIntegrations() {
  const modeCls = m => `mode-${m}`;
  return `
    <div class="integration-grid">
      ${INTEGRATIONS.map(i => `
        <div class="int-card">
          <div class="int-hd">
            <div class="led ${i.mode==='connected'?'ok':i.mode==='ready'?'data':i.mode==='mock'?'warn':'dim'}"></div>
            <div class="int-name">${esc(i.name)}</div>
            <span class="int-mode ${modeCls(i.mode)}">${i.mode}</span>
          </div>
          <div class="mono fs9 t-dim" style="margin-bottom:6px">Status: ${esc(i.status)}</div>
          <div class="int-next">→ ${esc(i.next)}</div>
        </div>`).join('')}
    </div>`;
}

// ── View: Agent Lanes ──────────────────────────────────────────
function renderAgentLanes() {
  const statusColor = s =>
    s==='active'?'t-ok':s==='coordinating'?'t-data':s==='standing by'?'t-warn':'t-dim';

  return `
    <div class="info-banner">Agent Lanes define ownership. No agent executes outside their lane without handoff. Production actions require Owner Approval Lane.</div>
    <div class="lane-grid">
      ${AGENT_LANES.map(l => `
        <div class="lane-card ${l.cls}">
          <div class="lane-hd">
            <div>
              <div class="lane-name">${esc(l.name)}</div>
              <div class="lane-branch mono fs9 t-faint">branch: ${esc(l.branch)}</div>
            </div>
            <span class="lane-status-chip ${statusColor(l.status)} ${l.status==='active'?'ok-border':''}"
              style="border-color:currentColor">${esc(l.status)}</span>
          </div>
          <div class="lane-row"><span class="lane-key">Current Task</span><span class="lane-val">${esc(l.currentTask)}</span></div>
          <div class="lane-row"><span class="lane-key">Last Handoff</span><span class="lane-val">${esc(l.lastHandoff)}</span></div>
          <div class="lane-row"><span class="lane-key">Blockers</span><span class="lane-val ${l.blockers!=='None'?'t-warn':''}">${esc(l.blockers)}</span></div>
          <div class="lane-row"><span class="lane-key">Next Action</span><span class="lane-val t-data">${esc(l.next)}</span></div>
          <div class="lane-owns"><span class="t-faint mono fs9">Owns: </span>${esc(l.owns)}</div>
        </div>`).join('')}
    </div>`;
}

// ── View: Obsidian Mirror ──────────────────────────────────────
function renderObsidian() {
  return `
    <div class="info-banner">Obsidian is planned as the shared project brain. Current mode: repo mirror / planning only. Real vault sync requires OBSIDIAN_VAULT_PATH and owner approval. No secrets synced.</div>
    <div class="warn-banner">⊘ No vault writes active in v1. This panel is read-only planning visibility.</div>

    <div class="two-col">
      <div class="panel">
        <div class="panel-label">Mirror Status</div>
        <div class="led-row" style="margin-bottom:8px">
          <span class="led warn"></span>
          <span class="fs11 t-warn">Planned — Not Active</span>
        </div>
        <div class="mono fs9 t-dim" style="line-height:16px">
          Mode: repo mirror / planning<br>
          Vault path: not set<br>
          Sync: disabled<br>
          Secrets: none synced<br>
          Owner approval: required to activate
        </div>
      </div>
      <div class="panel">
        <div class="panel-label">Activation Requirements</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:11px">
          <div class="led-row"><span class="led dim"></span><span>Set OBSIDIAN_VAULT_PATH env var</span></div>
          <div class="led-row"><span class="led dim"></span><span>Owner approval for vault writes</span></div>
          <div class="led-row"><span class="led dim"></span><span>Hermes backend route /api/misato/obsidian</span></div>
          <div class="led-row"><span class="led dim"></span><span>No sensitive data in mirror</span></div>
        </div>
      </div>
    </div>

    <div class="section-hd">Planned Vault Folders</div>
    <div class="obsidian-folders">
      ${OBSIDIAN_FOLDERS.map(f => `
        <div class="obs-folder">
          <div class="obs-folder-name">📁 ${esc(f.name)}</div>
          <div class="obs-folder-desc">${esc(f.desc)}</div>
        </div>`).join('')}
    </div>`;
}

// ── Main render ────────────────────────────────────────────────
function renderView() {
  switch (state.activeTab) {
    case 'cmd':          return renderCommandCenter();
    case 'council':      return renderCouncil();
    case 'projects':     return renderProjects();
    case 'approvals':    return renderApprovals();
    case 'logs':         return renderLogs();
    case 'integrations': return renderIntegrations();
    case 'lanes':        return renderAgentLanes();
    case 'obsidian':     return renderObsidian();
    default:             return renderCommandCenter();
  }
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderHeader()}
    <div class="shell">
      ${renderSidebar()}
      <div class="main">
        ${renderNav()}
        <div class="view">${renderView()}</div>
      </div>
    </div>`;
  bind();
}

// ── Event binding ──────────────────────────────────────────────
function bind() {
  document.getElementById('btn-save')?.addEventListener('click', saveConfig);
  document.getElementById('cfg-mode')?.addEventListener('change', e => {
    applyModeDefaults(e.target.value || MODES.preview);
    render();
  });
  document.getElementById('btn-test')?.addEventListener('click', testConnection);
  document.getElementById('btn-reload')?.addEventListener('click', loadAll);

  document.getElementById('btn-run')?.addEventListener('click', () => {
    const el = document.getElementById('cmd');
    const v  = (el?.value || '').trim();
    if (v) { sendCommand(v); if (el) el.value = ''; }
  });

  document.getElementById('cmd')?.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const v = e.target.value.trim();
      if (v) { sendCommand(v); e.target.value = ''; }
    }
  });

  // Quick prompts
  document.querySelectorAll('.prompt-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.prompt;
      if (p) sendCommand(p);
    });
  });

  // Nav tabs
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
  });

  // Auto-scroll stream
  const stream = document.getElementById('stream');
  if (stream) stream.scrollTop = stream.scrollHeight;
}

// ── Boot ───────────────────────────────────────────────────────
applyModeDefaults(state.mode || MODES.preview, true);
if (!state.baseUrl) applyModeDefaults(MODES.preview, true);
render();
