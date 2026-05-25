/* ================================================================
   MISATO Mission Control · app.js
   Branch: misato-claude-ui
   13-Screen Control Center — all screens, all states, all mock data
   API contracts unchanged. No secrets logged. No auth modified.
   ================================================================ */

// ── Mock / Static data ──────────────────────────────────────────

const COUNCIL_AGENTS = [
  { id:'strategy', name:'Strategy Agent',          role:'Mission Planning',      specialty:'Goal alignment, priority sequencing, OKRs',         perm:'Advisory', risk:'Low',    state:'idle',     feedback:'Awaiting next mission command.' },
  { id:'ui',       name:'Claude UI Agent',          role:'UI Lane Lead',          specialty:'Desktop polish, UX architecture, component design',  perm:'Build',    risk:'Low',    state:'complete', feedback:'Tactical HUD v3 — 13-screen spec implemented.' },
  { id:'backend',  name:'Hermes Architecture Agent',role:'Backend Lane Lead',     specialty:'API routes, auth middleware, integrations, safety',   perm:'Build',    risk:'Medium', state:'thinking', feedback:'Verifying CORS + OPTIONS preflight on preview.' },
  { id:'security', name:'Security Agent',           role:'Threat Analysis',       specialty:'Auth gates, secret safety, injection vectors',        perm:'Audit',    risk:'Low',    state:'idle',     feedback:'No secrets in UI layer. Token masked throughout.' },
  { id:'qa',       name:'Codex QA Agent',           role:'Client Reliability',    specialty:'Bug patching, connection flow, build validation',     perm:'Audit',    risk:'Low',    state:'thinking', feedback:'Running client reliability audit on misato-codex-client-qa.' },
  { id:'vercel',   name:'Vercel Deploy Agent',      role:'Deployment Ops',        specialty:'Preview gates, env propagation, production lock',     perm:'Deploy',   risk:'High',   state:'blocked',  feedback:'Awaiting CORS redeploy on misato-full-build.' },
  { id:'bizops',   name:'Business Ops Agent',       role:'Operations',            specialty:'Revenue tracking, KPIs, client ops',                  perm:'Advisory', risk:'Low',    state:'idle',     feedback:'NexCall pricing live. MISATO internal only.' },
  { id:'marketing',name:'Marketing Agent',          role:'Growth',                specialty:'Positioning, Discord presence, copy',                 perm:'Advisory', risk:'Low',    state:'idle',     feedback:'No public-facing changes in this build.' },
  { id:'finance',  name:'Finance Agent',            role:'Financial Analysis',    specialty:'Revenue modeling, cost tracking, Stripe events',      perm:'Advisory', risk:'Low',    state:'idle',     feedback:'Stripe plans stable. No pricing changes.' },
  { id:'research', name:'Research Agent',           role:'Intelligence',          specialty:'Market intel, tech trends, competitor tracking',      perm:'Advisory', risk:'Low',    state:'idle',     feedback:'Standing by for research requests.' },
  { id:'obsidian', name:'Obsidian Librarian Agent', role:'Knowledge Base',        specialty:'Vault sync, project brain, daily command notes',      perm:'Read',     risk:'Low',    state:'idle',     feedback:'Mirror planned. No vault writes in v1.' },
  { id:'github',   name:'GitHub Handoff Agent',     role:'Code Handoffs',         specialty:'Branch management, PR coordination, commit safety',   perm:'Commit',   risk:'Medium', state:'idle',     feedback:'misato-claude-ui branch ready to push.' },
  { id:'discord',  name:'Discord Integration Agent',role:'Community Ops',         specialty:'#misato channel, bot commands, @misato#6010',         perm:'Mock',     risk:'Low',    state:'idle',     feedback:'Discord integration planned. Mock mode only.' },
  { id:'approval', name:'Approval Gate Agent',      role:'Owner Authorization',   specialty:'High-risk gates, production deploys, env changes',    perm:'Gate',     risk:'High',   state:'idle',     feedback:'No live approvals pending.' }
];

const MOCK_PROJECTS = [
  { name:'NexCall',      status:'Active',      priority:'High',   risk:'Medium', nextAction:'Deploy MISATO backend to production',    agents:['Strategy','Backend','Vercel Deploy'], taskCount:14, slug:'nexcall'  },
  { name:'Bad Genetics', status:'Active',      priority:'Medium', risk:'Low',    nextAction:'Complete checkout and auth flow',         agents:['UI Builder','Backend','QA'],           taskCount:9,  slug:'genetics' },
  { name:'Client Sites', status:'Maintenance', priority:'Low',    risk:'Low',    nextAction:'Monthly performance review',             agents:['QA'],                                  taskCount:3,  slug:'clients'  },
  { name:'Personal Ops', status:'Planning',    priority:'Medium', risk:'Low',    nextAction:'Define Q3 goals and agent assignments',   agents:['Strategy','Finance'],                  taskCount:6,  slug:'personal' },
  { name:'Research Lab', status:'Active',      priority:'Low',    risk:'Low',    nextAction:'Document AI agent architecture findings', agents:['Research','Obsidian'],                 taskCount:7,  slug:'research' }
];

const MOCK_TASKS = [
  { title:'Set MISATO_DESKTOP_AUTH_TOKEN in Vercel Preview', project:'NexCall',      priority:'High',   risk:'Low',    agent:'Hermes',    status:'Done',    approvalRequired:false },
  { title:'Add Vercel bypass token to desktop config UI',    project:'NexCall',      priority:'High',   risk:'Low',    agent:'Claude UI', status:'Done',    approvalRequired:false },
  { title:'Fix CORS / Cross-Origin-Resource-Policy',         project:'NexCall',      priority:'High',   risk:'Low',    agent:'Codex QA',  status:'Doing',   approvalRequired:false },
  { title:'Implement 13-screen UI spec',                     project:'NexCall',      priority:'High',   risk:'Low',    agent:'Claude UI', status:'Doing',   approvalRequired:false },
  { title:'Rebuild MISATO.exe with new desktop-ui',          project:'NexCall',      priority:'High',   risk:'Low',    agent:'Owner',     status:'Doing',   approvalRequired:false },
  { title:'Connect production MISATO routes to nexcall.one', project:'NexCall',      priority:'Medium', risk:'High',   agent:'Hermes',    status:'Blocked', approvalRequired:true  },
  { title:'Wire live Obsidian vault sync',                   project:'NexCall',      priority:'Low',    risk:'Medium', agent:'Obsidian',  status:'Idea',    approvalRequired:true  },
  { title:'Bad Genetics Stripe checkout integration',        project:'Bad Genetics', priority:'Medium', risk:'Medium', agent:'Backend',   status:'Idea',    approvalRequired:false },
  { title:'Bad Genetics UI polish pass',                     project:'Bad Genetics', priority:'Low',    risk:'Low',    agent:'Claude UI', status:'Idea',    approvalRequired:false }
];

const MOCK_LOGS = [
  { ts:'09:31:57', src:'CONN-TEST',  sev:'warn',  project:'NexCall', agent:'Claude UI', action:'GET /api/misato/status → Failed to fetch (CORS blocked)' },
  { ts:'09:27:18', src:'CONN-TEST',  sev:'warn',  project:'NexCall', agent:'Claude UI', action:'GET /api/misato/status → Vercel SSO wall detected' },
  { ts:'09:05:42', src:'DESKTOP',    sev:'info',  project:'NexCall', agent:'Owner',     action:'Bypass token generated and saved to Vercel Preview' },
  { ts:'09:03:18', src:'DEPLOY',     sev:'info',  project:'NexCall', agent:'Hermes',    action:'Commit 545faae pushed to misato-full-build, redeploy triggered' },
  { ts:'09:01:55', src:'BUILD',      sev:'info',  project:'NexCall', agent:'Claude UI', action:'desktop-ui v2 files written to outputs/' },
  { ts:'08:58:02', src:'AUTH',       sev:'info',  project:'NexCall', agent:'Security',  action:'MISATO_DESKTOP_AUTH_TOKEN set in Vercel Preview env' },
  { ts:'08:55:00', src:'CODEX',      sev:'info',  project:'NexCall', agent:'Codex QA',  action:'Client reliability lane started on misato-codex-client-qa' }
];

const INTEGRATIONS = [
  { name:'Vercel Preview',      icon:'☁',  mode:'active',   status:'Active',  desc:'Preview branch connected. Deployment protection bypass enabled.', next:'Redeploy after CORS fix' },
  { name:'GitHub Handoffs',     icon:'⌥',  mode:'ready',    status:'Ready',   desc:'Branch coordination active. misato-claude-ui ready to push.',    next:'Push + open PR to misato-full-build' },
  { name:'Obsidian Mirror',     icon:'⬡',  mode:'planned',  status:'Planned', desc:'Vault sync not yet configured. Mirror docs exist in repo.',       next:'Set OBSIDIAN_VAULT_PATH, owner approval required' },
  { name:'Discord @misato',     icon:'◈',  mode:'mock',     status:'Mock',    desc:'Bot token not connected. #misato channel planned.',              next:'Wire DISCORD_BOT_TOKEN' },
  { name:'Claude UI Lane',      icon:'◎',  mode:'active',   status:'Active',  desc:'13-screen spec implemented. Files ready for cargo tauri build.', next:'Copy to desktop-ui/, rebuild .exe' },
  { name:'Hermes Backend Lane', icon:'⬡',  mode:'active',   status:'Active',  desc:'Verifying CORS fix and OPTIONS preflight on preview deploy.',    next:'Confirm /api/misato/status → 200 JSON' },
  { name:'MISATO Council',      icon:'⬢',  mode:'mock',     status:'Mock v1', desc:'14 agents active in mock mode. Live pending owner approval.',    next:'Owner approval required for live council' },
  { name:'Approval Gate',       icon:'◆',  mode:'ready',    status:'Ready',   desc:'No approvals pending. Gate armed and ready.',                    next:'No action needed' }
];

const AGENT_LANES = [
  { id:'claude', cls:'claude',
    name:'Claude UI Lane',          branch:'misato-claude-ui',
    status:'active',                statusCls:'badge-teal',
    currentTask:'13-screen UI spec implementation (v3)',
    lastHandoff:'desktop-ui v2 → Hermes for build validation',
    blockers:'None',                next:'Commit + push misato-claude-ui, notify Hermes',
    owns:['Desktop UI','Visual design','Layout','UX polish','Component system']
  },
  { id:'hermes', cls:'hermes',
    name:'Hermes Backend Lane',     branch:'misato-hermes-backend',
    status:'active',                statusCls:'badge-amber',
    currentTask:'CORS fix + OPTIONS preflight + Preview redeploy',
    lastHandoff:'Token env set, awaiting Claude UI v3',
    blockers:'MISATO.exe rebuild needed by owner',
    next:'Verify redeploy, confirm /api/misato/status → 200 JSON',
    owns:['Backend API','Auth middleware','Integrations','Build safety']
  },
  { id:'codex', cls:'codex',
    name:'Codex QA Lane',           branch:'misato-codex-client-qa',
    status:'active',                statusCls:'badge-amber',
    currentTask:'Client reliability audit and bug patching',
    lastHandoff:'Reviewing CORS, OPTIONS, and desktop connection flow',
    blockers:'None',                next:'Complete audit, push fixes, trigger Hermes smoke test',
    owns:['Bug patching','QA','Connection flow','Build validation','Security']
  },
  { id:'misato', cls:'misato',
    name:'MISATO Coordinator',      branch:'misato-full-build',
    status:'coordinating',          statusCls:'badge-slate',
    currentTask:'Council report, merge coordination, spec review',
    lastHandoff:'Hermes ↔ Claude UI ↔ Codex sync',
    blockers:'None',                next:'Merge all lanes → misato-full-build after review',
    owns:['Council orchestration','Merge gating','Handoff docs']
  },
  { id:'owner', cls:'owner',
    name:'Owner Approval Lane',     branch:'main (gate)',
    status:'standing by',           statusCls:'badge-blue',
    currentTask:'Set token in Vercel → confirm MISATO.exe connects',
    lastHandoff:'Bypass token generated and saved',
    blockers:'Production deploy requires owner approval',
    next:'Launch rebuilt MISATO.exe, enter tokens, Test Connection',
    owns:['Production deploys','Env vars','DNS','Risky action approvals']
  }
];

const OBSIDIAN_FOLDERS = [
  { name:'Daily Command',     desc:'Active missions, today\'s priorities, blockers',                  count:3 },
  { name:'Active Missions',   desc:'Ongoing project briefs and deliverables',                         count:5 },
  { name:'Agent Status',      desc:'Council agent assignments and feedback',                          count:14 },
  { name:'Claude↔Hermes',     desc:'Cross-lane handoff notes and decisions',                         count:4 },
  { name:'Project Decisions', desc:'Architecture choices, trade-off records',                         count:7 },
  { name:'Council Reports',   desc:'Consensus summaries and risk assessments',                        count:2 }
];

const MOCK_APPROVALS = [
  { id:'apr-1', title:'Connect production MISATO routes to nexcall.one', risk:'High',   agent:'Hermes Architecture Agent', details:'Merges MISATO API routes to production. Affects DNS and public routing.', requestedAt:'5 min ago' },
  { id:'apr-2', title:'Wire live Obsidian vault sync to file system',    risk:'Medium', agent:'Obsidian Librarian Agent',  details:'Grants read access to OBSIDIAN_VAULT_PATH. Requires path config.',       requestedAt:'12 min ago' }
];

const QUICK_PROMPTS = [
  { label:'What needs attention today?', icon:'◎' },
  { label:'Ask the council',             icon:'⬢' },
  { label:'Review pending approvals',    icon:'◆' },
  { label:'Create a NexCall mission',    icon:'⊕' },
  { label:'Check project blockers',      icon:'⚠' },
  { label:'Summarize agent status',      icon:'≡' },
  { label:'Summarize logs (last hour)',  icon:'≣' },
  { label:'Escalate blocked work',       icon:'↑' }
];

const DESIGN_TOKENS = [
  { name:'--bg-void',    hex:'#07080C', usage:'Window chrome, deepest bg' },
  { name:'--bg-base',    hex:'#0C0E14', usage:'App background' },
  { name:'--surface-1',  hex:'#111318', usage:'Primary panel backgrounds' },
  { name:'--surface-2',  hex:'#181B22', usage:'Cards, raised elements' },
  { name:'--surface-3',  hex:'#1E2129', usage:'Hover states, selected rows' },
  { name:'--surface-4',  hex:'#252830', usage:'Modals, popovers' },
  { name:'--text-primary',   hex:'#E4E6F0', usage:'Primary labels, titles' },
  { name:'--text-secondary', hex:'#8A8FA0', usage:'Descriptions, metadata' },
  { name:'--text-tertiary',  hex:'#52566A', usage:'Disabled, timestamps, muted' },
  { name:'--accent-blue',    hex:'#4A8CFF', usage:'Primary actions, links, focus' },
  { name:'--accent-teal',    hex:'#00C9A7', usage:'Success, connected, live' },
  { name:'--accent-amber',   hex:'#F5A623', usage:'Warning, pending, attention' },
  { name:'--accent-red',     hex:'#E0444E', usage:'Error, critical, blocked, failed' },
  { name:'--accent-violet',  hex:'#8B5CF6', usage:'MISATO/AI brand color, council' },
  { name:'--accent-slate',   hex:'#6B7280', usage:'Neutral, idle, scheduled' }
];

const MOCK_SCHEDULE = [
  { time:'09:00 – 09:30', title:'MISATO Status Sync',              agent:'MISATO Coordinator', priority:'Medium', status:'Done' },
  { time:'10:00 – 10:45', title:'Review CORS fix deployment',       agent:'Hermes',             priority:'High',   status:'Doing' },
  { time:'11:00 – 12:00', title:'13-screen UI implementation',      agent:'Claude UI',          priority:'High',   status:'Doing' },
  { time:'13:00 – 13:30', title:'Codex QA client reliability audit',agent:'Codex QA',           priority:'High',   status:'Idea' },
  { time:'14:00 – 14:30', title:'Owner: rebuild MISATO.exe',        agent:'Owner',              priority:'High',   status:'Blocked' },
  { time:'15:00 – 15:15', title:'Approval review: prod deploy gate',agent:'Owner',              priority:'Medium', status:'Idea' }
];

// ── Storage ────────────────────────────────────────────────────
const storage = {
  get(k, d='') { try { return localStorage.getItem(k) || d; } catch { return d; } },
  set(k, v)    { try { localStorage.setItem(k, v); } catch {} }
};

// ── State ──────────────────────────────────────────────────────
const injectedBase = (window.__MISATO_API_BASE_URL__ || '').trim();
const state = {
  baseUrl:      storage.get('misato_api_base_url', injectedBase),
  token:        storage.get('misato_desktop_auth_token', ''),
  bypassToken:  storage.get('misato_vercel_bypass_token', ''),
  council:      [],
  projects:     [],
  tasks:        [],
  approvals:    [],
  logs:         [],
  activeScreen: 'overview',
  messages:     [],
  loading:      false,
  lastError:    '',
  configOpen:   false,
  agentFilter:  'all',
  feedFilter:   'all',
  designLibTab: 'tokens',
  obsidianFolder: 0,
  connTest: {
    label:       'Not configured',
    cls:         'unconfigured',
    httpStatus:  null,
    checkedAt:   null,
    error:       '',
    nextFix:     'Set MISATO API Base URL below.'
  }
};

// ── Helpers ────────────────────────────────────────────────────
function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function now()  { return new Date().toISOString(); }
function fmtTime(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' }); }
  catch { return iso; }
}
function isConnected() { return state.connTest.label === 'Connected'; }

function connCls(label) {
  if (label === 'Connected')        return 'connected';
  if (label === 'Unauthorized')     return 'unauthorized';
  if (label === 'Vercel Protected') return 'protected';
  if (label === '404 / Wrong URL')  return 'not-found';
  if (label === 'Testing…')         return 'testing';
  if (label === 'Failed')           return 'failed';
  return 'unconfigured';
}

function priorityBadge(p) {
  const map = { High:'badge-red', Medium:'badge-amber', Low:'badge-slate', Critical:'badge-red' };
  return `<span class="badge ${map[p] || 'badge-slate'}">${esc(p)}</span>`;
}

function statusBadge(s) {
  const map = { Done:'badge-teal', Doing:'badge-blue', Blocked:'badge-red', Idea:'badge-slate', Active:'badge-teal', Planning:'badge-violet', Maintenance:'badge-slate' };
  return `<span class="badge ${map[s] || 'badge-slate'}">${esc(s)}</span>`;
}

function agentStateBadge(s) {
  const map = { active:'badge-teal', complete:'badge-slate', thinking:'badge-blue', blocked:'badge-red', idle:'badge-slate' };
  return `<span class="badge ${map[s] || 'badge-slate'}">${esc(s)}</span>`;
}

// ── Network layer (unchanged API contract) ─────────────────────
function headers() {
  const h = { 'content-type': 'application/json' };
  // Tokens are read from state but never logged, never rendered as text
  if (state.token)       h['x-misato-desktop-token']     = state.token;
  if (state.bypassToken) h['x-vercel-protection-bypass'] = state.bypassToken;
  return h;
}

function endpoint(path) {
  const base = state.baseUrl.replace(/\/+$/, '');
  return `${base}/${path.replace(/^\/+/, '')}`;
}

async function apiGet(path) {
  const res = await fetch(endpoint(path), { method:'GET', headers: headers() });
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/html') && !res.ok) throw Object.assign(new Error('Vercel Protected'), { isVercelSso: true, status: res.status });
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  return res.json();
}

// ── Test Connection (7 states) ─────────────────────────────────
async function testConnection() {
  if (!state.baseUrl) {
    state.connTest = { label:'Not configured', cls:'unconfigured', httpStatus:null, checkedAt:null, error:'', nextFix:'Set MISATO API Base URL below.' };
    render(); return;
  }
  state.connTest = { label:'Testing…', cls:'testing', httpStatus:null, checkedAt:null, error:'', nextFix:'' };
  render();
  try {
    const res = await fetch(endpoint('status'), { method:'GET', headers: headers() });
    const ct = res.headers.get('content-type') || '';
    const checkedAt = now();
    if (ct.includes('text/html') && !res.ok) {
      state.connTest = { label:'Vercel Protected', cls:'protected', httpStatus:res.status, checkedAt, error:'Vercel SSO wall blocking API access.', nextFix:'Add the Vercel bypass token below.' };
    } else if (res.status === 401 || res.status === 403) {
      state.connTest = { label:'Unauthorized', cls:'unauthorized', httpStatus:res.status, checkedAt, error:'Backend rejected the desktop token.', nextFix:'Check your Desktop Auth Token matches MISATO_DESKTOP_AUTH_TOKEN in Vercel.' };
    } else if (res.status === 404) {
      state.connTest = { label:'404 / Wrong URL', cls:'not-found', httpStatus:404, checkedAt, error:'Route not found at this URL.', nextFix:'Verify the API Base URL includes the correct path.' };
    } else if (res.ok) {
      state.connTest = { label:'Connected', cls:'connected', httpStatus:200, checkedAt, error:'', nextFix:'' };
      loadAll();
    } else {
      state.connTest = { label:'Failed', cls:'failed', httpStatus:res.status, checkedAt, error:`Unexpected response: HTTP ${res.status}`, nextFix:'Check if the server is running.' };
    }
  } catch (e) {
    const checkedAt = now();
    if (e.isVercelSso) {
      state.connTest = { label:'Vercel Protected', cls:'protected', httpStatus:e.status, checkedAt, error:'Vercel SSO wall detected.', nextFix:'Add the Vercel bypass token below.' };
    } else {
      state.connTest = { label:'Failed', cls:'failed', httpStatus:null, checkedAt, error: e.message || 'Network error', nextFix:'Check MISATO API Base URL and your connection.' };
    }
  }
  render();
}

// ── Load all live data ─────────────────────────────────────────
async function loadAll() {
  try {
    const [council, projects, tasks, approvals, logs] = await Promise.allSettled([
      apiGet('council'), apiGet('projects'), apiGet('tasks'), apiGet('approvals'), apiGet('logs')
    ]);
    state.council   = council.status   === 'fulfilled' && Array.isArray(council.value)   ? council.value   : [];
    state.projects  = projects.status  === 'fulfilled' && Array.isArray(projects.value)  ? projects.value  : [];
    state.tasks     = tasks.status     === 'fulfilled' && Array.isArray(tasks.value)     ? tasks.value     : [];
    state.approvals = approvals.status === 'fulfilled' && Array.isArray(approvals.value) ? approvals.value : [];
    state.logs      = logs.status      === 'fulfilled' && Array.isArray(logs.value)      ? logs.value      : [];
  } catch {}
  render();
}

// ── Send command ───────────────────────────────────────────────
async function sendCommand(cmd) {
  if (!cmd.trim() || state.loading) return;
  state.loading = true;
  state.messages.push({ role:'user', text: cmd, ts: now() });
  render();
  try {
    const res = await fetch(endpoint('command'), {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ command: cmd })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const text = data.response || data.message || data.output || JSON.stringify(data);
    state.messages.push({ role:'misato', text, ts: now() });
  } catch (e) {
    state.messages.push({ role:'misato', text:`Error: ${e.message}`, ts: now() });
  }
  state.loading = false;
  render();
}

// ── Save config ────────────────────────────────────────────────
function saveConfig() {
  const url   = document.getElementById('cfg-url')?.value?.trim()   || '';
  const token = document.getElementById('cfg-token')?.value?.trim() || '';
  const byp   = document.getElementById('cfg-bypass')?.value?.trim()|| '';
  state.baseUrl     = url;
  state.token       = token;
  state.bypassToken = byp;
  storage.set('misato_api_base_url',         url);
  storage.set('misato_desktop_auth_token',   token);
  storage.set('misato_vercel_bypass_token',  byp);
  // Never log token values
  state.connTest = { label:'Not configured', cls:'unconfigured', httpStatus:null, checkedAt:null, error:'', nextFix:'Click Test Connection to verify.' };
  render();
  showToast('Configuration saved.', '◎');
}

// ── Toast ──────────────────────────────────────────────────────
function showToast(msg, icon='◎') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span class="toast-icon">${esc(icon)}</span><span class="toast-body">${esc(msg)}</span>`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ── Navigation ─────────────────────────────────────────────────
const NAV = [
  { group:'MISSION',    items:[
    { id:'overview', label:'Overview',       icon:'◉' },
    { id:'command',  label:'Command Center', icon:'⊕' }
  ]},
  { group:'AGENTS',     items:[
    { id:'agentdex',  label:'AgentDex',  icon:'⬢' },
    { id:'schedule',  label:'Schedule',  icon:'◷' },
    { id:'kanban',    label:'Kanban',    icon:'≣' }
  ]},
  { group:'OPERATIONS', items:[
    { id:'watchtower', label:'Watchtower',      icon:'◈' },
    { id:'sentinel',   label:'Secret Sentinel', icon:'◆' },
    { id:'logs',       label:'Logs',            icon:'≡' }
  ]},
  { group:'SYSTEM',     items:[
    { id:'designlib',   label:'Design Library',  icon:'◎' },
    { id:'integrations',label:'Integrations',    icon:'⬡' },
    { id:'lanes',       label:'Lanes',           icon:'⟂' },
    { id:'approvals',   label:'Approvals',       icon:'◇' },
    { id:'obsidian',    label:'Obsidian Mirror', icon:'⬡' }
  ]}
];

// ── Render Helpers ─────────────────────────────────────────────
function renderNav() {
  const groups = NAV.map(g => `
    <div class="nav-group">
      <div class="nav-group-label">${esc(g.group)}</div>
      ${g.items.map(item => `
        <button class="nav-item ${state.activeScreen === item.id ? 'active' : ''}" data-nav="${esc(item.id)}">
          <span class="nav-item-icon">${item.icon}</span>
          ${esc(item.label)}
        </button>`).join('')}
    </div>`).join('<div class="nav-divider"></div>');

  return `
    <nav class="nav">
      ${groups}
      <div class="nav-bottom">
        <button class="nav-config-btn" data-nav="config">
          <span>⚙</span>
          <span>Settings</span>
        </button>
      </div>
    </nav>`;
}

function renderFeed() {
  const entries = MOCK_LOGS.map(e => `
    <div class="feed-entry">
      <div class="feed-entry-header">
        <span class="feed-entry-ts">${esc(e.ts)}</span>
        <span class="feed-entry-src">${esc(e.src)}</span>
      </div>
      <div class="feed-entry-msg">${esc(e.action)}</div>
    </div>`).join('');
  return `
    <aside class="feed">
      <div class="feed-header">
        <span class="feed-title">Live Feed</span>
        <span class="live-badge">● LIVE</span>
      </div>
      <div class="feed-filter">
        <button class="feed-filter-btn active">ALL</button>
        <button class="feed-filter-btn">ALERTS</button>
        <button class="feed-filter-btn">AGENTS</button>
      </div>
      <div class="feed-entries">${entries}</div>
      <div class="feed-footer">
        <span style="font-size:10px;color:var(--text-tertiary)">${MOCK_LOGS.length} entries</span>
        <button class="btn btn-ghost btn-sm">Pause</button>
      </div>
    </aside>`;
}

function renderTopBar() {
  const { label, cls } = state.connTest;
  return `
    <header class="topbar">
      <div class="topbar-brand">
        <div class="topbar-brand-mark">M</div>
        MISATO
      </div>
      <div class="topbar-right">
        <div class="conn-indicator">
          <div class="conn-led ${cls}"></div>
          <span>${esc(label)}</span>
        </div>
      </div>
    </header>`;
}

function renderSectionHeader(title, meta, actions='') {
  return `
    <div class="section-header">
      <div class="row gap-8">
        <span class="section-title">${esc(title)}</span>
        ${meta ? `<span class="section-meta">${esc(meta)}</span>` : ''}
      </div>
      <div class="section-actions">${actions}</div>
    </div>`;
}

// ── Config Panel ───────────────────────────────────────────────
function renderConfigPanel() {
  const { label, cls, error, nextFix, checkedAt } = state.connTest;
  return `
    <div class="workspace-body">
      <div style="max-width:520px">
        <div class="config-panel mb-16">
          <div class="config-panel-title">Connection Settings</div>
          <div class="col gap-12">
            <div class="input-group">
              <label class="input-label" for="cfg-url">MISATO API Base URL</label>
              <input class="input input-mono" id="cfg-url" type="text"
                placeholder="https://…/api/misato"
                value="${esc(state.baseUrl)}" />
              <span class="input-hint">Preview: https://nexcall-git-misato-full-build-pixelmiles1-5825s-projects.vercel.app/api/misato</span>
            </div>
            <div class="input-group">
              <label class="input-label" for="cfg-token">Desktop Auth Token</label>
              <input class="input input-mono" id="cfg-token" type="password"
                placeholder="Paste token — value never shown"
                value="${state.token ? '••••••••••••••••' : ''}" />
              <span class="input-hint">Saved locally · value never shown</span>
            </div>
            <div class="input-group">
              <label class="input-label" for="cfg-bypass">Vercel Protection Bypass</label>
              <input class="input input-mono" id="cfg-bypass" type="password"
                placeholder="Paste bypass token — value never shown"
                value="${state.bypassToken ? '••••••••••••••••' : ''}" />
              <span class="input-hint">Saved locally · value never shown</span>
            </div>
          </div>
          <div class="config-save-row">
            <button class="btn btn-primary" id="btn-save">Save Config</button>
            <button class="btn btn-secondary" id="btn-test">Test Connection</button>
          </div>
          <p class="config-note">Tokens never logged or displayed in results.</p>
        </div>
        <div class="conn-result ${cls} mb-16">
          <div class="conn-result-status">${esc(label)}</div>
          ${error ? `<div class="conn-result-detail">${esc(error)}</div>` : ''}
          ${nextFix ? `<div class="conn-result-fix">→ ${esc(nextFix)}</div>` : ''}
          ${checkedAt ? `<div class="conn-result-ts">Last check: ${fmtTime(checkedAt)}</div>` : ''}
        </div>
        <div class="auth-modes">
          <div class="auth-mode-row">
            <div class="auth-mode-led ${state.token ? 'on' : 'off'}"></div>
            <span>${state.token ? 'Desktop token configured' : 'Desktop token not set'}</span>
          </div>
          <div class="auth-mode-row">
            <div class="auth-mode-led ${state.bypassToken ? 'on' : 'off'}"></div>
            <span>${state.bypassToken ? 'Bypass token configured' : 'Bypass token not set'}</span>
          </div>
          <div class="auth-mode-row">
            <div class="auth-mode-led ${isConnected() ? 'on' : 'off'}"></div>
            <span>${isConnected() ? 'Verified — connected to backend' : 'Not verified'}</span>
          </div>
        </div>
      </div>
    </div>`;
}

// ── Screen 1: Overview ─────────────────────────────────────────
function renderOverview() {
  const agents  = state.council.length  ? state.council  : COUNCIL_AGENTS;
  const tasks   = state.tasks.length    ? state.tasks    : MOCK_TASKS;
  const active  = agents.filter(a => a.state === 'active' || a.state === 'thinking').length;
  const blocked = tasks.filter(t => t.status === 'Blocked').length;
  const pending = (state.approvals.length ? state.approvals : MOCK_APPROVALS).length;
  const { label, cls } = state.connTest;

  const healthTiles = [
    { label:'Backend',       value: label, sub: state.baseUrl ? state.baseUrl.replace('https://', '').split('/')[0].substring(0,32) : 'Not configured', cls: cls === 'connected' ? 'ok' : cls === 'failed' || cls === 'protected' ? 'bad' : '' },
    { label:'Active Agents', value: active,   sub:`${agents.length} total in council` },
    { label:'Queue Depth',   value: tasks.filter(t=>t.status==='Doing').length, sub: blocked ? `${blocked} blocked` : 'No blockers', cls: blocked ? 'warn' : '' },
    { label:'Approvals',     value: pending,  sub: pending ? `${pending} pending review` : 'All clear', cls: pending ? 'warn' : 'ok' }
  ].map(t => `
    <div class="health-tile ${t.cls || ''}">
      <div class="health-tile-label">${esc(t.label)}</div>
      <div class="health-tile-value">${esc(String(t.value))}</div>
      <div class="health-tile-sub">${esc(t.sub)}</div>
    </div>`).join('');

  const agentRows = agents.slice(0,6).map(a => `
    <div class="wt-service-row">
      <div class="auth-mode-led on" style="background:${a.state==='active'||a.state==='complete'?'var(--accent-teal)':a.state==='thinking'?'var(--accent-blue)':a.state==='blocked'?'var(--accent-red)':'var(--surface-4)'}"></div>
      <div class="wt-service-name">${esc(a.name)}</div>
      <div class="wt-service-meta" style="flex:1;truncate">${esc((a.feedback||'').substring(0,40))}…</div>
      ${agentStateBadge(a.state)}
    </div>`).join('');

  const taskRows = tasks.filter(t=>t.status==='Doing').slice(0,5).map(t => `
    <div class="wt-service-row">
      ${priorityBadge(t.priority)}
      <div class="wt-service-name" style="flex:1">${esc(t.title.substring(0,40))}</div>
      <span style="font-size:10px;color:var(--text-tertiary)">${esc(t.agent)}</span>
    </div>`).join('');

  const alertRows = MOCK_LOGS.filter(l=>l.sev==='warn'||l.sev==='error').slice(0,4).map(l => `
    <div class="wt-service-row">
      <span class="log-ts">${esc(l.ts)}</span>
      <span class="log-src">${esc(l.src)}</span>
      <span class="log-msg" style="flex:1;font-size:11px">${esc(l.action.substring(0,50))}</span>
    </div>`).join('');

  return `
    ${renderSectionHeader('Overview', 'System status at a glance', `<button class="btn btn-secondary btn-sm" id="btn-refresh">Refresh</button>`)}
    <div class="workspace-body">
      <div class="health-strip section-gap">${healthTiles}</div>
      <div class="grid-2 section-gap">
        <div class="card">
          <div class="card-header"><span class="card-title">Agent Status</span><button class="btn btn-ghost btn-sm" data-nav="agentdex">View all →</button></div>
          ${agentRows || '<div class="empty-state"><div class="empty-state-msg">No agents loaded</div></div>'}
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Active Work</span><button class="btn btn-ghost btn-sm" data-nav="kanban">Kanban →</button></div>
          ${taskRows || '<div style="padding:12px;font-size:12px;color:var(--text-tertiary)">No tasks in progress</div>'}
        </div>
      </div>
      <div class="grid-3">
        <div class="card">
          <div class="card-header"><span class="card-title">Recent Alerts</span><button class="btn btn-ghost btn-sm" data-nav="logs">Logs →</button></div>
          ${alertRows || '<div class="empty-state" style="padding:16px"><div class="empty-state-msg">No alerts</div></div>'}
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Approval Backlog</span><button class="btn btn-ghost btn-sm" data-nav="approvals">Review →</button></div>
          ${pending ? (state.approvals.length ? state.approvals : MOCK_APPROVALS).map(a=>`
            <div class="wt-service-row">
              <span class="badge ${a.risk==='High'?'badge-red':a.risk==='Medium'?'badge-amber':'badge-slate'}">${esc(a.risk)}</span>
              <span style="font-size:11px;flex:1">${esc(a.title.substring(0,36))}…</span>
            </div>`).join('') : `<div style="padding:12px;font-size:12px;color:var(--accent-teal)">◉ No pending approvals</div>`}
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Security Posture</span><button class="btn btn-ghost btn-sm" data-nav="sentinel">Sentinel →</button></div>
          <div style="padding:4px 0">
            <div class="wt-service-row"><span class="auth-mode-led on"></span><span style="font-size:12px">Token masking enforced</span><span class="badge badge-teal">OK</span></div>
            <div class="wt-service-row"><span class="auth-mode-led on"></span><span style="font-size:12px">No secrets in UI layer</span><span class="badge badge-teal">OK</span></div>
            <div class="wt-service-row"><span class="auth-mode-led" style="background:var(--accent-amber)"></span><span style="font-size:12px">CORS config pending</span><span class="badge badge-amber">WARN</span></div>
          </div>
        </div>
      </div>
    </div>`;
}

// ── Screen 2: Command Center ───────────────────────────────────
function renderCommand() {
  const msgs = state.messages.map(m => `
    <div class="cmd-message cmd-message-${m.role === 'user' ? 'user' : 'resp'}">
      <div class="cmd-message-header">
        <span class="cmd-message-role">${m.role === 'user' ? 'You' : 'MISATO'}</span>
        <span class="cmd-message-ts">${fmtTime(m.ts)}</span>
      </div>
      <div class="cmd-message-body">${esc(m.text)}</div>
    </div>`).join('');

  const quickBtns = QUICK_PROMPTS.map(p =>
    `<button class="quick-action-btn" data-prompt="${esc(p.label)}">${p.icon} ${esc(p.label)}</button>`
  ).join('');

  const agents   = state.council.length ? state.council : COUNCIL_AGENTS;
  const activeAgents = agents.filter(a=>a.state==='active'||a.state==='thinking').slice(0,3);

  return `
    ${renderSectionHeader('Command Center', 'Active control surface',
      `<button class="btn btn-secondary btn-sm" id="btn-clear-msgs">Clear history</button>`)}
    <div class="workspace-body">
      <div class="mission-banner">
        <div>
          <div class="mission-banner-title">MISATO Active Session</div>
          <div class="mission-banner-meta">Preview deployment · ${isConnected() ? 'Connected' : 'Not connected — Test Connection to verify'}</div>
        </div>
        ${isConnected() ? '' : `<button class="btn btn-secondary btn-sm" data-nav="config">Configure →</button>`}
      </div>
      <div class="cmd-layout section-gap">
        <div class="card" style="padding:12px">
          <div class="card-header" style="margin-bottom:8px"><span class="card-title">Quick Actions</span></div>
          <div class="quick-actions-grid">${quickBtns}</div>
        </div>
        <div class="card" style="padding:12px">
          <div class="card-header" style="margin-bottom:8px"><span class="card-title">Active Context</span></div>
          ${activeAgents.length ? activeAgents.map(a=>`
            <div class="wt-service-row" style="padding:6px 0;border-bottom:1px solid var(--border-subtle)">
              <div class="auth-mode-led ${a.state==='thinking'?'on':'off'}" style="background:${a.state==='thinking'?'var(--accent-blue)':'var(--accent-teal)'}"></div>
              <div style="flex:1">
                <div style="font-size:12px;font-weight:500">${esc(a.name)}</div>
                <div style="font-size:10px;color:var(--text-tertiary)">${esc(a.feedback.substring(0,60))}</div>
              </div>
              ${agentStateBadge(a.state)}
            </div>`).join('') : '<div style="font-size:11px;color:var(--text-tertiary);padding:8px">Connect to load live agent context.</div>'}
        </div>
      </div>
      <div class="cmd-input-area">
        <div class="cmd-messages" id="cmd-messages">
          ${msgs || `<div class="cmd-empty">Send a command or select a quick action to begin.</div>`}
        </div>
        <div class="cmd-input-bar">
          <input class="cmd-input" id="cmd-input"
            placeholder="Send a command to MISATO… (Ctrl+Enter)"
            ${state.loading ? 'disabled' : ''} />
          <button class="btn btn-primary" id="btn-send" ${state.loading || !isConnected() ? 'disabled' : ''}>
            ${state.loading ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>`;
}

// ── Screen 3: AgentDex ─────────────────────────────────────────
function renderAgentDex() {
  const agents = state.council.length ? state.council : COUNCIL_AGENTS;
  const filters = ['all','active','thinking','idle','blocked','complete'];
  const filtered = state.agentFilter === 'all' ? agents : agents.filter(a => a.state === state.agentFilter);

  const pills = filters.map(f => `
    <button class="filter-pill ${state.agentFilter === f ? 'active' : ''}" data-filter="${esc(f)}">
      ${f.charAt(0).toUpperCase() + f.slice(1)}
      <span style="opacity:0.6;margin-left:4px">${agents.filter(a=>f==='all'||a.state===f).length}</span>
    </button>`).join('');

  const cards = filtered.map(a => `
    <div class="agent-card">
      <div class="agent-card-top">
        <div>
          <div class="agent-card-name">${esc(a.name)}</div>
          <div class="agent-card-role">${esc(a.role)}</div>
        </div>
        <div class="col gap-4" style="align-items:flex-end">
          ${agentStateBadge(a.state)}
          <span class="badge badge-slate">${esc(a.perm)}</span>
        </div>
      </div>
      <div class="agent-card-task">
        <div class="agent-card-task-label">Current task</div>
        ${esc(a.feedback)}
      </div>
      <div class="agent-card-footer">
        <span class="agent-card-ts">${esc(a.specialty.substring(0,30))}…</span>
        <span class="badge ${a.risk==='High'?'badge-red':a.risk==='Medium'?'badge-amber':'badge-slate'}">${esc(a.risk)} risk</span>
      </div>
    </div>`).join('');

  return `
    ${renderSectionHeader('AgentDex', `${agents.length} agents in council`,
      `<button class="btn btn-secondary btn-sm">+ Assign Task</button>`)}
    <div class="workspace-body">
      <div class="filter-strip">${pills}</div>
      ${filtered.length ? `<div class="grid-auto">${cards}</div>` : `<div class="empty-state"><div class="empty-state-icon">⬢</div><div class="empty-state-title">No agents match filter</div><button class="btn btn-ghost btn-sm" data-filter="all">Clear filter</button></div>`}
    </div>`;
}

// ── Screen 4: Schedule ─────────────────────────────────────────
function renderSchedule() {
  const items = MOCK_SCHEDULE.map(s => `
    <div class="agenda-item">
      <div class="agenda-time">${esc(s.time)}</div>
      <div class="agenda-body">
        <div class="agenda-title">${esc(s.title)}</div>
        <div class="agenda-meta">${esc(s.agent)} · ${priorityBadge(s.priority)} ${statusBadge(s.status)}</div>
      </div>
    </div>`).join('');

  return `
    ${renderSectionHeader('Schedule', 'Today · Agenda view',
      `<div class="schedule-view-toggle">
        <button class="view-toggle-btn">Day</button>
        <button class="view-toggle-btn active">Agenda</button>
        <button class="view-toggle-btn">Week</button>
       </div>
       <button class="btn btn-primary btn-sm" style="margin-left:8px">+ New Task</button>`)}
    <div class="workspace-body">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Today — ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</span>
          <span class="badge badge-blue">${MOCK_SCHEDULE.length} tasks</span>
        </div>
        ${items}
      </div>
    </div>`;
}

// ── Screen 5: Kanban ───────────────────────────────────────────
function renderKanban() {
  const tasks = state.tasks.length ? state.tasks : MOCK_TASKS;
  const cols  = ['Done','Doing','Blocked','Idea'];

  const board = cols.map(col => {
    const colTasks = tasks.filter(t => t.status === col);
    const cards = colTasks.map(t => {
      const left = t.status === 'Blocked' ? 'blocked' : t.priority === 'High' ? 'high' : t.status === 'Done' ? 'done' : '';
      return `
        <div class="kanban-card ${left}">
          <div class="kanban-card-title">${esc(t.title)}</div>
          <div class="kanban-card-footer">
            <span class="kanban-card-agent">${esc(t.agent)}</span>
            ${priorityBadge(t.priority)}
          </div>
          ${t.status === 'Blocked' ? `<div class="kanban-card-blocker">⚠ Blocked — requires approval</div>` : ''}
          <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px">${esc(t.project)}</div>
        </div>`;
    }).join('');
    const colCls = col === 'Doing' ? 'badge-blue' : col === 'Done' ? 'badge-teal' : col === 'Blocked' ? 'badge-red' : 'badge-slate';
    return `
      <div class="kanban-col">
        <div class="kanban-col-header">
          <span class="kanban-col-title">${esc(col)}</span>
          <span class="kanban-col-count badge ${colCls}">${colTasks.length}</span>
        </div>
        ${cards || `<div style="padding:12px;font-size:11px;color:var(--text-tertiary);text-align:center">No tasks</div>`}
      </div>`;
  }).join('');

  return `
    ${renderSectionHeader('Kanban', `${tasks.length} total tasks`,
      `<button class="btn btn-primary btn-sm">+ Add Task</button>`)}
    <div class="workspace-body" style="padding-bottom:0">
      <div class="kanban-board">${board}</div>
    </div>`;
}

// ── Screen 6: Watchtower ───────────────────────────────────────
function renderWatchtower() {
  const agents = state.council.length ? state.council : COUNCIL_AGENTS;
  const { label, cls } = state.connTest;

  const tiles = [
    { label:'API',         value: label, sub:'Preview deployment', cls: cls === 'connected' ? 'ok' : cls === 'failed' ? 'bad' : '' },
    { label:'Auth Gate',   value: state.token ? 'Configured' : 'Not set', sub:'x-misato-desktop-token', cls: state.token ? 'ok' : 'warn' },
    { label:'Queue Depth', value: (state.tasks.length || MOCK_TASKS).length, sub:'tasks tracked' },
    { label:'CORS',        value: 'WARN', sub:'Fix pending — redeploy required', cls:'warn' },
    { label:'Last Deploy', value: 'ab848f4', sub:'misato-hermes-backend' }
  ].map(t => `
    <div class="health-tile ${t.cls || ''}">
      <div class="health-tile-label">${esc(t.label)}</div>
      <div class="health-tile-value" style="font-size:16px">${esc(String(t.value))}</div>
      <div class="health-tile-sub">${esc(t.sub)}</div>
    </div>`).join('');

  const serviceRows = [
    { name:'Vercel Preview API',   meta:label, ts:'just now',  ok: cls === 'connected' },
    { name:'Desktop Auth Token',   meta: state.token ? 'Configured' : 'Not set', ts:'—', ok: !!state.token },
    { name:'Bypass Token',         meta: state.bypassToken ? 'Configured' : 'Not set', ts:'—', ok: !!state.bypassToken },
    { name:'CORS Headers',         meta:'Fix pending', ts:'—', ok: false },
    { name:'Discord Bot',          meta:'Mock only', ts:'—', ok: null },
    { name:'Obsidian Sync',        meta:'Not configured', ts:'—', ok: null }
  ].map(s => `
    <div class="wt-service-row">
      <div class="auth-mode-led" style="background:${s.ok===true?'var(--accent-teal)':s.ok===false?'var(--accent-amber)':'var(--surface-4)'}"></div>
      <div class="wt-service-name">${esc(s.name)}</div>
      <div class="wt-service-meta">${esc(s.meta)}</div>
      <div class="wt-service-ts">${esc(s.ts)}</div>
    </div>`).join('');

  const agentGrid = agents.map(a => {
    const initials = a.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
    const color = a.state==='active'||a.state==='complete'?'var(--accent-teal)':a.state==='thinking'?'var(--accent-blue)':a.state==='blocked'?'var(--accent-red)':'var(--surface-4)';
    return `<div class="wt-agent-tile">
      <div class="auth-mode-led" style="background:${color};width:8px;height:8px"></div>
      <div class="wt-agent-initials">${esc(initials)}</div>
      <div class="wt-agent-name">${esc(a.name.split(' ')[0])}</div>
    </div>`;
  }).join('');

  return `
    ${renderSectionHeader('Watchtower', 'Health and observability',
      `<button class="btn btn-secondary btn-sm" id="btn-refresh">Refresh</button>`)}
    <div class="workspace-body">
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:16px">${tiles}</div>
      <div class="grid-2 section-gap">
        <div class="card" style="padding:0">
          <div class="card-header" style="padding:12px 14px"><span class="card-title">Service Status</span></div>
          ${serviceRows}
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Agent State Map</span><span class="badge badge-slate">${agents.length} agents</span></div>
          <div class="wt-agent-grid">${agentGrid}</div>
        </div>
      </div>
      <div class="card" style="padding:0">
        <div class="card-header" style="padding:12px 14px"><span class="card-title">Recent Incidents</span></div>
        ${MOCK_LOGS.filter(l=>l.sev==='warn'||l.sev==='error').map(l=>`
          <div class="wt-service-row">
            <span class="log-ts">${esc(l.ts)}</span>
            <span class="badge ${l.sev==='error'?'badge-red':'badge-amber'}">${l.sev.toUpperCase()}</span>
            <span class="log-src">${esc(l.src)}</span>
            <span style="flex:1;font-size:11px;color:var(--text-secondary)">${esc(l.action)}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

// ── Screen 7: Secret Sentinel ──────────────────────────────────
function renderSentinel() {
  const findings = [
    { sev:'warn', title:'Token value appeared in chat session', loc:'Browser chat / session transcript', age:'1h ago', status:'Confirmed' },
    { sev:'info', title:'Bypass token in localStorage (expected)', loc:'desktop-ui/app.js → localStorage', age:'2h ago', status:'Confirmed' },
    { sev:'info', title:'.env.example contains placeholder values only', loc:'.env.example', age:'—', status:'OK' }
  ];

  const rows = findings.map(f => `
    <div class="sentinel-row">
      <span class="badge ${f.sev==='warn'?'badge-amber':f.sev==='error'?'badge-red':'badge-slate'}">${f.sev.toUpperCase()}</span>
      <div class="sentinel-row-info">
        <div class="sentinel-row-title">${esc(f.title)}</div>
        <div class="sentinel-row-path">${esc(f.loc)}</div>
      </div>
      <div class="col gap-4" style="align-items:flex-end">
        <span class="badge ${f.status==='OK'?'badge-teal':f.status==='Confirmed'?'badge-amber':'badge-slate'}">${esc(f.status)}</span>
        <span class="sentinel-row-age">${esc(f.age)}</span>
      </div>
    </div>`).join('');

  const checks = [
    { label:'Rotate all exposed secrets',          done:false },
    { label:'.env.* is gitignored',                done:true  },
    { label:'No secret values in client-side JS',  done:true  },
    { label:'Token fields masked in UI',           done:true  },
    { label:'No token in console.log / render',    done:true  },
    { label:'CORS headers do not leak secrets',    done:true  }
  ];
  const done = checks.filter(c=>c.done).length;

  return `
    ${renderSectionHeader('Secret Sentinel', 'Security scan and remediation',
      `<button class="btn btn-secondary btn-sm">Scan Now</button>`)}
    <div class="workspace-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
        ${[{l:'Critical',v:0,c:'ok'},{l:'High',v:0,c:'ok'},{l:'Warnings',v:findings.filter(f=>f.sev==='warn').length,c:'warn'},{l:'Last Scan',v:'2m ago',c:''}].map(t=>`
          <div class="health-tile ${t.c}">
            <div class="health-tile-label">${esc(t.l)}</div>
            <div class="health-tile-value" style="font-size:18px">${esc(String(t.v))}</div>
          </div>`).join('')}
      </div>
      <div class="sentinel-layout">
        <div class="card" style="padding:0">
          <div class="card-header" style="padding:12px 14px"><span class="card-title">Findings</span></div>
          ${rows}
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Remediation</span><span class="badge badge-teal">${done}/${checks.length}</span></div>
          ${checks.map(c=>`
            <div class="remediation-item ${c.done?'done':''}">
              <span class="remediation-check">${c.done?'✓':'○'}</span>
              <span>${esc(c.label)}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

// ── Screen 8: Design Library ───────────────────────────────────
function renderDesignLib() {
  const tabs = ['tokens','components','patterns'];
  const tabBtns = tabs.map(t =>
    `<span class="design-lib-nav-item ${state.designLibTab===t?'active':''}" data-dltab="${t}">${t.charAt(0).toUpperCase()+t.slice(1)}</span>`
  ).join('');

  let content = '';
  if (state.designLibTab === 'tokens') {
    content = `
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-tertiary);margin-bottom:12px">Color Tokens</div>
      ${DESIGN_TOKENS.map(t=>`
        <div class="token-swatch">
          <div class="token-color-block" style="background:${esc(t.hex)}"></div>
          <div class="col gap-4" style="flex:1">
            <span class="token-name">${esc(t.name)}</span>
            <span class="token-hex">${esc(t.hex)}</span>
          </div>
          <span class="token-usage">${esc(t.usage)}</span>
        </div>`).join('')}
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-tertiary);margin:16px 0 12px">Typography Scale</div>
      ${[
        {role:'Section title',   size:'15px',weight:'600'},
        {role:'Card title',     size:'13px',weight:'600'},
        {role:'Body / desc',    size:'13px',weight:'400'},
        {role:'Label / nav',    size:'12px',weight:'500'},
        {role:'Badge / status', size:'10px',weight:'700'},
        {role:'Timestamp',      size:'11px',weight:'400'},
      ].map(t=>`
        <div class="token-swatch">
          <div style="font-size:${t.size};font-weight:${t.weight};min-width:160px">Sample text</div>
          <span class="token-name">${esc(t.role)}</span>
          <span class="token-hex">${t.size} / ${t.weight}</span>
        </div>`).join('')}`;
  } else if (state.designLibTab === 'components') {
    content = `
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-tertiary);margin-bottom:12px">Buttons</div>
      <div class="row gap-8 mb-16">
        <button class="btn btn-primary">Primary</button>
        <button class="btn btn-secondary">Secondary</button>
        <button class="btn btn-danger">Danger</button>
        <button class="btn btn-ghost">Ghost</button>
        <button class="btn btn-primary" disabled>Disabled</button>
      </div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-tertiary);margin-bottom:12px">Badges</div>
      <div class="row gap-8 mb-16">
        <span class="badge badge-teal">Active</span>
        <span class="badge badge-blue">Doing</span>
        <span class="badge badge-amber">Warning</span>
        <span class="badge badge-red">Critical</span>
        <span class="badge badge-violet">Council</span>
        <span class="badge badge-slate">Idle</span>
      </div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-tertiary);margin-bottom:12px">Connection Result States</div>
      <div class="col gap-8">
        ${['Connected','Unauthorized','Vercel Protected','404 / Wrong URL','Failed','Not configured'].map(l=>`
          <div class="conn-result ${connCls(l)}">
            <div class="conn-result-status">${esc(l)}</div>
            <div class="conn-result-detail">Example detail message for the ${esc(l)} state.</div>
          </div>`).join('')}
      </div>`;
  } else {
    content = `
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-tertiary);margin-bottom:12px">Design Patterns</div>
      <div class="col gap-12">
        ${[
          {title:'Status badge + label', note:'Always pair color with text. Never color alone.'},
          {title:'Connection result card', note:'7 states: Not configured, Testing, Connected, Unauthorized, Vercel Protected, 404, Failed.'},
          {title:'Agent card (AgentDex)', note:'Status / role / current task / trust level / risk / feedback.'},
          {title:'Kanban card states', note:'Done (muted), Doing (normal), Blocked (amber left border + icon), Overdue (red).'},
          {title:'Log entry row', note:'Fixed-width: timestamp (mono) | source | severity | agent | message.'},
          {title:'Empty state', note:'Icon + title + message + CTA. Never a blank panel.'},
          {title:'Approval card', note:'Risk level + title + agent + details + always-visible action buttons.'},
          {title:'Health tile', note:'Label + metric value + sub-label. Top border color for warn/ok/bad.'}
        ].map(p=>`
          <div class="card card-sm">
            <div class="card-title mb-4">${esc(p.title)}</div>
            <div style="font-size:11px;color:var(--text-secondary)">${esc(p.note)}</div>
          </div>`).join('')}
      </div>`;
  }

  return `
    ${renderSectionHeader('Design Library', 'Tokens, components, patterns')}
    <div class="workspace-body" style="padding:0;overflow:hidden">
      <div class="design-lib-layout" style="height:100%">
        <div class="design-lib-nav">${tabBtns}</div>
        <div class="design-lib-content">${content}</div>
      </div>
    </div>`;
}

// ── Screen 9: Integrations ─────────────────────────────────────
function renderIntegrations() {
  const modeBadge = m => {
    const map = { active:'badge-teal', ready:'badge-blue', mock:'badge-slate', planned:'badge-amber' };
    return `<span class="badge ${map[m]||'badge-slate'}">${m.toUpperCase()}</span>`;
  };
  const cards = INTEGRATIONS.map(i => `
    <div class="integration-card">
      <div class="integration-card-top">
        <div class="row gap-8">
          <span class="integration-icon">${i.icon}</span>
          <div>
            <div class="integration-name">${esc(i.name)}</div>
          </div>
        </div>
        ${modeBadge(i.mode)}
      </div>
      <div class="integration-desc">${esc(i.desc)}</div>
      <div class="integration-next">→ ${esc(i.next)}</div>
      <div class="integration-actions">
        <button class="btn btn-secondary btn-sm">Configure</button>
        ${i.mode === 'active' ? `<button class="btn btn-ghost btn-sm">Test</button>` : ''}
      </div>
    </div>`).join('');

  return `
    ${renderSectionHeader('Integrations', `${INTEGRATIONS.filter(i=>i.mode==='active').length} active, ${INTEGRATIONS.filter(i=>i.mode==='mock'||i.mode==='planned').length} planned`,
      `<button class="btn btn-primary btn-sm">+ Add Integration</button>`)}
    <div class="workspace-body">
      <div class="grid-2">${cards}</div>
    </div>`;
}

// ── Screen 10: Lanes ───────────────────────────────────────────
function renderLanes() {
  const cards = AGENT_LANES.map(l => `
    <div class="lane-card ${l.cls}">
      <div class="row-between">
        <div>
          <div class="lane-name">${esc(l.name)}</div>
          <div class="lane-branch">${esc(l.branch)}</div>
        </div>
        <span class="badge ${l.statusCls}">${esc(l.status)}</span>
      </div>
      <div class="col gap-4">
        <div class="lane-task"><span style="color:var(--text-tertiary);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em">Current</span><br>${esc(l.currentTask)}</div>
        ${l.blockers !== 'None' ? `<div style="font-size:11px;color:var(--accent-amber)">⚠ ${esc(l.blockers)}</div>` : ''}
        <div style="font-size:11px;color:var(--text-secondary)">Next: ${esc(l.next)}</div>
      </div>
      <div class="lane-owns">
        ${l.owns.map(o=>`<span class="lane-owns-tag">${esc(o)}</span>`).join('')}
      </div>
    </div>`).join('');

  return `
    ${renderSectionHeader('Lanes', `${AGENT_LANES.length} active lanes`)}
    <div class="workspace-body">
      <div class="grid-2">${cards}</div>
    </div>`;
}

// ── Screen 11: Logs ────────────────────────────────────────────
function renderLogs() {
  const logs = state.logs.length ? state.logs : MOCK_LOGS;
  const rows = logs.map(l => `
    <tr>
      <td class="log-ts">${esc(l.ts)}</td>
      <td class="log-src">${esc(l.src)}</td>
      <td><span class="badge ${l.sev==='error'?'badge-red':l.sev==='warn'?'badge-amber':'badge-slate'} sev-${esc(l.sev)}">${(l.sev||'info').toUpperCase()}</span></td>
      <td style="font-size:11px;color:var(--text-secondary)">${esc(l.agent||'—')}</td>
      <td class="log-msg">${esc(l.action)}</td>
    </tr>`).join('');

  return `
    ${renderSectionHeader('Logs', `${logs.length} entries`,
      `<button class="btn btn-secondary btn-sm">Export</button>`)}
    <div class="workspace-body" style="padding:0">
      <div style="padding:8px 12px;border-bottom:1px solid var(--border-subtle);display:flex;gap:8px;background:var(--surface-1)">
        <span class="badge badge-slate">ALL</span>
        <span class="badge">INFO</span>
        <span class="badge badge-amber">WARN</span>
        <span class="badge badge-red">ERROR</span>
      </div>
      <div style="overflow:auto;max-height:calc(100vh - 180px)">
        <table class="log-table">
          <thead><tr>
            <th style="width:80px">Time</th>
            <th style="width:100px">Source</th>
            <th style="width:70px">Sev</th>
            <th style="width:100px">Agent</th>
            <th>Message</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

// ── Screen 12: Approvals ───────────────────────────────────────
function renderApprovals() {
  const approvals = state.approvals.length ? state.approvals : MOCK_APPROVALS;
  const cards = approvals.map(a => `
    <div class="approval-card ${(a.risk||'').toLowerCase()}">
      <div class="row-between mb-4">
        <span class="badge ${a.risk==='High'?'badge-red':a.risk==='Medium'?'badge-amber':'badge-slate'}">⚠ ${esc(a.risk)} Risk</span>
        <span style="font-size:10px;color:var(--text-tertiary)">Requested ${esc(a.requestedAt)}</span>
      </div>
      <div class="approval-title">${esc(a.title)}</div>
      <div class="approval-agent">Requested by ${esc(a.agent)}</div>
      <div style="font-size:11px;color:var(--text-secondary)">${esc(a.details)}</div>
      <div class="approval-actions">
        <button class="btn btn-primary btn-sm">Approve</button>
        <button class="btn btn-danger btn-sm">Reject</button>
        <button class="btn btn-ghost btn-sm">Defer</button>
      </div>
    </div>`).join('');

  const empty = `<div class="empty-state"><div class="empty-state-icon">◆</div><div class="empty-state-title" style="color:var(--accent-teal)">No pending approvals</div><div class="empty-state-msg">All gates clear. New approvals will appear here.</div></div>`;

  return `
    ${renderSectionHeader('Approvals', `${approvals.length} pending`,
      `<span class="badge ${approvals.length ? 'badge-amber' : 'badge-teal'}">${approvals.length} pending</span>`)}
    <div class="workspace-body">
      ${approvals.length ? cards : empty}
    </div>`;
}

// ── Screen 13: Obsidian Mirror ─────────────────────────────────
function renderObsidian() {
  const folder = OBSIDIAN_FOLDERS[state.obsidianFolder];
  const tree = OBSIDIAN_FOLDERS.map((f, i) => `
    <div class="obsidian-folder ${i === state.obsidianFolder ? 'active' : ''}" data-obfolder="${i}">
      <span>⬡</span>
      <span style="flex:1">${esc(f.name)}</span>
      <span class="obsidian-count">${f.count}</span>
    </div>`).join('');

  const docContent = `
    <h1>${esc(folder.name)}</h1>
    <p>${esc(folder.desc)}</p>
    <h2>About this folder</h2>
    <p>This folder mirrors MISATO's Obsidian vault. Live sync is planned but not yet connected. Content here is read-only.</p>
    <h2>Documents (${folder.count})</h2>
    <p style="color:var(--text-tertiary);font-style:italic">Connect your Obsidian vault to see mirrored documents. Set OBSIDIAN_VAULT_PATH in your environment configuration.</p>`;

  return `
    ${renderSectionHeader('Obsidian Mirror', 'Knowledge base',
      `<button class="btn btn-secondary btn-sm">Open in Obsidian</button>`)}
    <div class="workspace-body" style="padding:0;overflow:hidden">
      <div style="background:var(--accent-amber-bg);border-bottom:1px solid var(--accent-amber);padding:8px 16px;font-size:11px;color:var(--accent-amber)">
        ⚠ Live sync not configured — showing folder structure only. Set OBSIDIAN_VAULT_PATH to enable mirroring.
      </div>
      <div class="obsidian-layout" style="padding:16px;height:calc(100% - 40px)">
        <div class="obsidian-tree">${tree}</div>
        <div class="obsidian-doc">${docContent}</div>
      </div>
    </div>`;
}

// ── Main Render ────────────────────────────────────────────────
function renderScreen() {
  if (state.configOpen) return renderConfigPanel();
  switch (state.activeScreen) {
    case 'overview':     return renderOverview();
    case 'command':      return renderCommand();
    case 'agentdex':     return renderAgentDex();
    case 'schedule':     return renderSchedule();
    case 'kanban':       return renderKanban();
    case 'watchtower':   return renderWatchtower();
    case 'sentinel':     return renderSentinel();
    case 'logs':         return renderLogs();
    case 'designlib':    return renderDesignLib();
    case 'integrations': return renderIntegrations();
    case 'lanes':        return renderLanes();
    case 'approvals':    return renderApprovals();
    case 'obsidian':     return renderObsidian();
    default:             return renderOverview();
  }
}

function render() {
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML = `
    ${renderTopBar()}
    <div class="layout">
      ${renderNav()}
      <main class="workspace">
        ${renderScreen()}
      </main>
      ${renderFeed()}
    </div>
    <div class="toast-container" id="toast-container"></div>`;
  bind();
}

// ── Event Binding ──────────────────────────────────────────────
function bind() {
  // Navigation
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      const target = el.dataset.nav;
      if (target === 'config') {
        state.configOpen = !state.configOpen;
      } else {
        state.configOpen = false;
        state.activeScreen = target;
      }
      render();
    });
  });

  // Save config
  document.getElementById('btn-save')?.addEventListener('click', saveConfig);

  // Test connection
  document.getElementById('btn-test')?.addEventListener('click', testConnection);

  // Refresh
  document.getElementById('btn-refresh')?.addEventListener('click', () => {
    testConnection();
  });

  // Clear messages
  document.getElementById('btn-clear-msgs')?.addEventListener('click', () => {
    state.messages = [];
    render();
  });

  // Send command
  const sendBtn = document.getElementById('btn-send');
  const cmdInput = document.getElementById('cmd-input');
  if (sendBtn && cmdInput) {
    sendBtn.addEventListener('click', () => { sendCommand(cmdInput.value); cmdInput.value = ''; });
    cmdInput.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        sendCommand(cmdInput.value); cmdInput.value = '';
      }
    });
  }

  // Quick action prompts
  document.querySelectorAll('[data-prompt]').forEach(el => {
    el.addEventListener('click', () => {
      const cmd = el.dataset.prompt;
      if (!isConnected()) {
        state.configOpen = true;
        render();
        showToast('Connect to backend first — configure below.', '◈');
        return;
      }
      sendCommand(cmd);
      state.activeScreen = 'command';
      render();
    });
  });

  // AgentDex filter
  document.querySelectorAll('[data-filter]').forEach(el => {
    el.addEventListener('click', () => {
      state.agentFilter = el.dataset.filter;
      render();
    });
  });

  // Design library tabs
  document.querySelectorAll('[data-dltab]').forEach(el => {
    el.addEventListener('click', () => {
      state.designLibTab = el.dataset.dltab;
      render();
    });
  });

  // Obsidian folder
  document.querySelectorAll('[data-obfolder]').forEach(el => {
    el.addEventListener('click', () => {
      state.obsidianFolder = parseInt(el.dataset.obfolder, 10);
      render();
    });
  });

  // Auto-scroll cmd messages
  const msgs = document.getElementById('cmd-messages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

// ── Boot ───────────────────────────────────────────────────────
render();
