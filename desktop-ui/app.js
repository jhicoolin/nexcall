/* ================================================================
   MISATO Mission Control · app.js  v6.4
   Branch: misato-codex-live-ui-qa
   Local Hermes runtime is the primary daily path.
   Cloud preview and API tokens are Advanced / fallback only.
   API contracts unchanged. No secrets logged. No auth modified.
   v6: port 3010 canonical, /api/misato/ prefix on all data routes,
       correct mutation shapes, hermesMutate, resolveApproval, createTask,
       updateTask (honest offline), deleteTask (honest failure, approval gate),
       modal system, runtime status bar, wired approval/kanban actions
   v6.1: live feed fix, SSE polling fallback (15s), Sentinel Scan Now,
         refreshTopBarUI, sendCommand not-connected message
   v6.2: 127.0.0.1 canonical (not localhost), content-type guards on all
         fetch boundaries, SSE dot-notation normalization, normalizeCouncilAgent
         agentId/riskTier/lastActivityAt, loadAllFromHermes → /api/misato/status,
         sendCommand auto-refresh after success, apiGet HTML reject at any status,
         hermesMutate content-type check on success, pollLogsFallback CT guard
   v6.3: testConnection HTML check at any status (not just !res.ok),
         updateLiveAgent normalizes through normalizeCouncilAgent,
         sendCommand handles text/plain responses safely,
         dead loadAll() removed, auto-retry discovery every 60s when not-running,
         setup card text corrected (no false "auto-connect" claim),
         runtimeCtx.mode wired into runtimeStatus()
   v6.4: sendCommand reads data.responseText (Hermes canonical field — was falling
         through to JSON.stringify(data) and dumping raw CommandResult to chat).
         Final fallback is 'Command sent.' — raw JSON never reaches chat output.
         tasks/update route extracts { taskId, payload } correctly (was passing
         raw body to updateTask() which looks for .id — every task update silently
         returned task_not_found). ai-gateway: added sanitizeAiClassification()
         — raw model output now schema-checked before entering command pipeline
         (agentsRequired/planSteps enforced as arrays, riskLevel enum-validated,
         invalid shape falls back to deterministic classifier).
   ================================================================ */

// ── Mock / Fallback data (labeled _MOCK to make origin clear) ──

const MOCK_AGENTS = [
  { id:'strategy', name:'Strategy Agent',          role:'Mission Planning',      specialty:'Goal alignment, priority sequencing, OKRs',        perm:'Advisory', risk:'Low',    state:'idle',     feedback:'Awaiting next mission command.' },
  { id:'ui',       name:'Claude UI Agent',          role:'UI Lane Lead',          specialty:'Desktop polish, UX architecture, component design', perm:'Build',    risk:'Low',    state:'complete', feedback:'Tactical HUD v4 — Hermes-primary layout implemented.' },
  { id:'backend',  name:'Hermes Architecture Agent',role:'Backend Lane Lead',     specialty:'API routes, auth middleware, integrations, safety',  perm:'Build',    risk:'Medium', state:'thinking', feedback:'Verifying CORS + OPTIONS preflight on preview.' },
  { id:'security', name:'Security Agent',           role:'Threat Analysis',       specialty:'Auth gates, secret safety, injection vectors',       perm:'Audit',    risk:'Low',    state:'idle',     feedback:'No secrets in UI layer. Token masked throughout.' },
  { id:'qa',       name:'Codex QA Agent',           role:'Client Reliability',    specialty:'Bug patching, connection flow, build validation',    perm:'Audit',    risk:'Low',    state:'thinking', feedback:'Running client reliability audit.' },
  { id:'vercel',   name:'Vercel Deploy Agent',      role:'Deployment Ops',        specialty:'Preview gates, env propagation, production lock',    perm:'Deploy',   risk:'High',   state:'blocked',  feedback:'Awaiting CORS redeploy on misato-full-build.' },
  { id:'bizops',   name:'Business Ops Agent',       role:'Operations',            specialty:'Revenue tracking, KPIs, client ops',                 perm:'Advisory', risk:'Low',    state:'idle',     feedback:'NexCall pricing live. MISATO internal only.' },
  { id:'marketing',name:'Marketing Agent',          role:'Growth',                specialty:'Positioning, Discord presence, copy',                perm:'Advisory', risk:'Low',    state:'idle',     feedback:'No public-facing changes in this build.' },
  { id:'finance',  name:'Finance Agent',            role:'Financial Analysis',    specialty:'Revenue modeling, cost tracking, Stripe events',     perm:'Advisory', risk:'Low',    state:'idle',     feedback:'Stripe plans stable. No pricing changes.' },
  { id:'research', name:'Research Agent',           role:'Intelligence',          specialty:'Market intel, tech trends, competitor tracking',     perm:'Advisory', risk:'Low',    state:'idle',     feedback:'Standing by for research requests.' },
  { id:'obsidian', name:'Obsidian Librarian Agent', role:'Knowledge Base',        specialty:'Vault sync, project brain, daily command notes',     perm:'Read',     risk:'Low',    state:'idle',     feedback:'Mirror planned. No vault writes in v1.' },
  { id:'github',   name:'GitHub Handoff Agent',     role:'Code Handoffs',         specialty:'Branch management, PR coordination, commit safety',  perm:'Commit',   risk:'Medium', state:'idle',     feedback:'misato-claude-ui branch ready.' },
  { id:'discord',  name:'Discord Integration Agent',role:'Community Ops',         specialty:'#misato channel, bot commands, @misato#6010',        perm:'Mock',     risk:'Low',    state:'idle',     feedback:'Discord integration planned. Mock mode only.' },
  { id:'approval', name:'Approval Gate Agent',      role:'Owner Authorization',   specialty:'High-risk gates, production deploys, env changes',   perm:'Gate',     risk:'High',   state:'idle',     feedback:'No live approvals pending.' }
];

const MOCK_TASKS = [
  { id:'t1', title:'Fix CORS / Cross-Origin-Resource-Policy',         project:'NexCall',      priority:'High',   risk:'Low',    agent:'Codex QA',  status:'Doing',   approvalRequired:false },
  { id:'t2', title:'Implement Hermes-primary desktop UI (v4)',        project:'NexCall',      priority:'High',   risk:'Low',    agent:'Claude UI', status:'Doing',   approvalRequired:false },
  { id:'t3', title:'Rebuild MISATO.exe with new desktop-ui',          project:'NexCall',      priority:'High',   risk:'Low',    agent:'Owner',     status:'Doing',   approvalRequired:false },
  { id:'t4', title:'Set MISATO_DESKTOP_AUTH_TOKEN in Vercel Preview', project:'NexCall',      priority:'High',   risk:'Low',    agent:'Hermes',    status:'Done',    approvalRequired:false },
  { id:'t5', title:'Add Vercel bypass token to desktop config UI',    project:'NexCall',      priority:'High',   risk:'Low',    agent:'Claude UI', status:'Done',    approvalRequired:false },
  { id:'t6', title:'Connect production MISATO routes to nexcall.one', project:'NexCall',      priority:'Medium', risk:'High',   agent:'Hermes',    status:'Blocked', approvalRequired:true  },
  { id:'t7', title:'Wire live Obsidian vault sync',                   project:'NexCall',      priority:'Low',    risk:'Medium', agent:'Obsidian',  status:'Idea',    approvalRequired:true  },
  { id:'t8', title:'Bad Genetics Stripe checkout integration',        project:'Bad Genetics', priority:'Medium', risk:'Medium', agent:'Backend',   status:'Idea',    approvalRequired:false },
  { id:'t9', title:'Bad Genetics UI polish pass',                     project:'Bad Genetics', priority:'Low',    risk:'Low',    agent:'Claude UI', status:'Idea',    approvalRequired:false }
];

const MOCK_LOGS = [
  { ts:'09:31:57', src:'CONN-TEST', sev:'warn', project:'NexCall', agent:'Claude UI', action:'GET /api/misato/status → Failed to fetch (CORS blocked)' },
  { ts:'09:27:18', src:'CONN-TEST', sev:'warn', project:'NexCall', agent:'Claude UI', action:'GET /api/misato/status → Vercel SSO wall detected' },
  { ts:'09:05:42', src:'DESKTOP',   sev:'info', project:'NexCall', agent:'Owner',     action:'Bypass token generated and saved to Vercel Preview' },
  { ts:'09:03:18', src:'DEPLOY',    sev:'info', project:'NexCall', agent:'Hermes',    action:'Commit 545faae pushed to misato-full-build, redeploy triggered' },
  { ts:'09:01:55', src:'BUILD',     sev:'info', project:'NexCall', agent:'Claude UI', action:'desktop-ui v4 written — Hermes-primary layout' },
  { ts:'08:58:02', src:'AUTH',      sev:'info', project:'NexCall', agent:'Security',  action:'MISATO_DESKTOP_AUTH_TOKEN set in Vercel Preview env' },
  { ts:'08:55:00', src:'CODEX',     sev:'info', project:'NexCall', agent:'Codex QA',  action:'Client reliability lane started on misato-codex-client-qa' }
];

const MOCK_APPROVALS = [
  { id:'apr-1', title:'Connect production MISATO routes to nexcall.one', risk:'High',   agent:'Hermes Architecture Agent', details:'Merges MISATO API routes to production. Affects DNS and public routing.', requestedAt:'5 min ago' },
  { id:'apr-2', title:'Wire live Obsidian vault sync to file system',    risk:'Medium', agent:'Obsidian Librarian Agent',  details:'Grants read access to OBSIDIAN_VAULT_PATH. Requires path config.',       requestedAt:'12 min ago' }
];

const MOCK_SCHEDULE = [
  { time:'09:00 – 09:30', title:'MISATO Status Sync',              agent:'MISATO Coordinator', priority:'Medium', status:'Done',    live:false },
  { time:'10:00 – 10:45', title:'Review CORS fix deployment',       agent:'Hermes',             priority:'High',   status:'Doing',   live:true  },
  { time:'11:00 – 12:00', title:'Hermes-primary UI implementation', agent:'Claude UI',          priority:'High',   status:'Doing',   live:true  },
  { time:'13:00 – 13:30', title:'Codex QA client reliability audit',agent:'Codex QA',           priority:'High',   status:'Idea',    live:false },
  { time:'14:00 – 14:30', title:'Owner: rebuild MISATO.exe',        agent:'Owner',              priority:'High',   status:'Blocked', live:false },
  { time:'15:00 – 15:15', title:'Approval review: prod deploy gate',agent:'Owner',              priority:'Medium', status:'Idea',    live:false }
];

const MOCK_SENTINEL = {
  lastScanAt: '2025-05-25T09:33:00Z',
  findings: [
    { sev:'warn', title:'Token value appeared in chat session', loc:'Browser chat / session transcript', age:'1h ago', status:'Confirmed' },
    { sev:'info', title:'Bypass token in localStorage (expected)', loc:'desktop-ui/app.js → localStorage', age:'2h ago', status:'Confirmed' },
    { sev:'info', title:'.env.example contains placeholder values only', loc:'.env.example', age:'—', status:'OK' }
  ],
  remediation: [
    { label:'Rotate all exposed secrets',          done:false },
    { label:'.env.* is gitignored',                done:true  },
    { label:'No secret values in client-side JS',  done:true  },
    { label:'Token fields masked in UI',           done:true  },
    { label:'No token in console.log / render',    done:true  },
    { label:'CORS headers do not leak secrets',    done:true  }
  ]
};

const MOCK_WATCHTOWER = {
  services: [
    { name:'Hermes Local Bridge',  meta:'Not found yet', ok:false },
    { name:'SSE Event Stream',     meta:'Offline',       ok:false },
    { name:'Vercel Preview API',   meta:'Not tested',    ok:null  },
    { name:'Desktop Auth Token',   meta:'Not set',       ok:false },
    { name:'Discord Bot',          meta:'Mock only',     ok:null  },
    { name:'Obsidian Sync',        meta:'Not configured',ok:null  }
  ]
};

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
  { name:'--bg-void',        hex:'#07080C', usage:'Window chrome, deepest bg' },
  { name:'--bg-base',        hex:'#0C0E14', usage:'App background' },
  { name:'--surface-1',      hex:'#111318', usage:'Primary panel backgrounds' },
  { name:'--surface-2',      hex:'#181B22', usage:'Cards, raised elements' },
  { name:'--surface-3',      hex:'#1E2129', usage:'Hover states, selected rows' },
  { name:'--surface-4',      hex:'#252830', usage:'Modals, popovers' },
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

const INTEGRATIONS = [
  { name:'Local Hermes Bridge', icon:'⬡', mode:'active',  desc:'127.0.0.1:3010 runtime (configurable). Primary local AI runtime bridge.',  next:'Start Hermes runtime, then click Find Hermes' },
  { name:'Vercel Preview',      icon:'☁', mode:'active',  desc:'Preview branch connected. Deployment protection bypass enabled.',   next:'Redeploy after CORS fix' },
  { name:'GitHub Handoffs',     icon:'⌥', mode:'ready',   desc:'Branch coordination active. misato-claude-ui ready to push.',     next:'Push + open PR to misato-full-build' },
  { name:'Obsidian Mirror',     icon:'⬡', mode:'planned', desc:'Vault sync not yet configured. Mirror docs exist in repo.',        next:'Set OBSIDIAN_VAULT_PATH, owner approval required' },
  { name:'Discord @misato',     icon:'◈', mode:'mock',    desc:'Bot token not connected. #misato channel planned.',               next:'Wire DISCORD_BOT_TOKEN' },
  { name:'MISATO Council',      icon:'⬢', mode:'mock',    desc:'14 agents in mock mode. Live pending owner approval.',            next:'Owner approval required for live council' },
  { name:'Approval Gate',       icon:'◆', mode:'ready',   desc:'No approvals pending. Gate armed and ready.',                    next:'No action needed' }
];

const AGENT_LANES = [
  { id:'claude', cls:'claude', name:'Claude UI Lane',       branch:'misato-claude-ui',       status:'active',        statusCls:'badge-teal',
    currentTask:'Hermes-primary UI rework (v4)', lastHandoff:'desktop-ui v3 → Hermes for validation',
    blockers:'None', next:'Commit + push, notify Hermes',
    owns:['Desktop UI','Visual design','Layout','UX polish','Component system'] },
  { id:'hermes', cls:'hermes', name:'Hermes Backend Lane',  branch:'misato-hermes-backend',  status:'active',        statusCls:'badge-amber',
    currentTask:'CORS fix + OPTIONS preflight + Preview redeploy', lastHandoff:'Token env set, awaiting Claude UI v4',
    blockers:'MISATO.exe rebuild needed by owner', next:'Verify redeploy, confirm /api/misato/status → 200 JSON',
    owns:['Backend API','Auth middleware','Integrations','Build safety'] },
  { id:'codex',  cls:'codex',  name:'Codex QA Lane',        branch:'misato-codex-client-qa', status:'active',        statusCls:'badge-amber',
    currentTask:'Client reliability audit and bug patching', lastHandoff:'Reviewing CORS, OPTIONS, and desktop connection flow',
    blockers:'None', next:'Complete audit, push fixes, trigger Hermes smoke test',
    owns:['Bug patching','QA','Connection flow','Build validation','Security'] },
  { id:'misato', cls:'misato', name:'MISATO Coordinator',   branch:'misato-full-build',      status:'coordinating',  statusCls:'badge-slate',
    currentTask:'Council report, merge coordination, spec review', lastHandoff:'Hermes ↔ Claude UI ↔ Codex sync',
    blockers:'None', next:'Merge all lanes → misato-full-build after review',
    owns:['Council orchestration','Merge gating','Handoff docs'] },
  { id:'owner',  cls:'owner',  name:'Owner Approval Lane',  branch:'main (gate)',            status:'standing by',   statusCls:'badge-blue',
    currentTask:'Start Hermes runtime → confirm LOCAL SOLO mode', lastHandoff:'Bypass token generated and saved',
    blockers:'Production deploy requires owner approval', next:'Run npm run dev → launch MISATO.exe → click Find Hermes',
    owns:['Production deploys','Env vars','DNS','Risky action approvals'] }
];

const OBSIDIAN_FOLDERS = [
  { name:'Daily Command',     desc:'Active missions, today\'s priorities, blockers',     count:3 },
  { name:'Active Missions',   desc:'Ongoing project briefs and deliverables',            count:5 },
  { name:'Agent Status',      desc:'Council agent assignments and feedback',             count:14 },
  { name:'Claude↔Hermes',     desc:'Cross-lane handoff notes and decisions',            count:4 },
  { name:'Project Decisions', desc:'Architecture choices, trade-off records',            count:7 },
  { name:'Council Reports',   desc:'Consensus summaries and risk assessments',           count:2 }
];

// ── SSE event type → display ───────────────────────────────────
const EVENT_META = {
  command_received:   { color:'var(--accent-violet)', label:'Command',  icon:'⊕' },
  plan_generated:     { color:'var(--accent-blue)',   label:'Plan',     icon:'⬡' },
  agent_assigned:     { color:'var(--accent-teal)',   label:'Agent',    icon:'⬢' },
  task_updated:       { color:'var(--accent-teal)',   label:'Task',     icon:'◉' },
  risk_detected:      { color:'var(--accent-red)',    label:'Risk',     icon:'⚠' },
  approval_requested: { color:'var(--accent-amber)',  label:'Approval', icon:'◆' },
  approval_resolved:  { color:'var(--accent-teal)',   label:'Resolved', icon:'✓' },
  log:                { color:'var(--accent-slate)',  label:'Log',      icon:'≡' },
  status_change:      { color:'var(--accent-blue)',   label:'Status',   icon:'◎' }
};

const COMMAND_STAGES = [
  { type:'command_received',   label:'Command received',   icon:'⊕' },
  { type:'plan_generated',     label:'Plan generated',     icon:'⬡' },
  { type:'agent_assigned',     label:'Agent assigned',     icon:'⬢' },
  { type:'task_updated',       label:'Task started',       icon:'◉' },
  { type:'risk_detected',      label:'Risk scan',          icon:'⚠' },
  { type:'approval_requested', label:'Approval queued',    icon:'◆' },
  { type:'approval_resolved',  label:'Approval resolved',  icon:'✓' },
  { type:'status_change',      label:'Complete',           icon:'◎' }
];

// ── Canonical runtime origin ───────────────────────────────────
// Single source of truth for the local Hermes default.
// 127.0.0.1 is used explicitly — 'localhost' can resolve to ::1 (IPv6) on
// Windows, causing "Failed to fetch" even when Hermes is listening on IPv4.
const RUNTIME_CONFIG = window.__MISATO_RUNTIME_CONFIG__ || {};
const RUNTIME_DEFAULT_ORIGIN = RUNTIME_CONFIG.defaultRuntimeOrigin || 'http://127.0.0.1:3010';
const HERMES_DEFAULT_HOST = '127.0.0.1';
const HERMES_DEFAULT_PORT = '3010';

// ── Storage ────────────────────────────────────────────────────
const storage = {
  get(k, d='') { try { return localStorage.getItem(k) || d; } catch { return d; } },
  set(k, v)    { try { localStorage.setItem(k, v); } catch {} }
};

function normalizeHermesPort(port) {
  const value = String(port || '').trim();
  // 3010 is canonical per Hermes handoff (2026-05-25). 3000 and 3020 are dead.
  if (!value || value === '3000' || value === '3020') return '3010';
  return value;
}

function normalizeRuntimeOrigin(raw) {
  const normalize = RUNTIME_CONFIG.normalizeRuntimeOrigin;
  if (typeof normalize === 'function') return normalize(raw);
  const value = String(raw || '').trim();
  if (!value) return RUNTIME_DEFAULT_ORIGIN;
  try {
    const url = new URL(value.includes('://') ? value : `http://${value}`);
    if (!url.port) url.port = '3010';
    const pathname = url.pathname.replace(/\/+$/, '');
    if (pathname && pathname !== '/') return RUNTIME_DEFAULT_ORIGIN;
    if (url.hostname === 'localhost' || url.hostname === '0.0.0.0') url.hostname = '127.0.0.1';
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`;
  } catch {
    return RUNTIME_DEFAULT_ORIGIN;
  }
}

function normalizeApiBaseUrl(raw) {
  const normalize = RUNTIME_CONFIG.normalizeApiBaseUrl;
  if (typeof normalize === 'function') return normalize(raw);
  const value = String(raw || '').trim().replace(/\/+$/, '');
  if (!value) return '';
  try {
    const url = new URL(value.includes('://') ? value : `http://${value}`);
    const pathname = url.pathname.replace(/\/+$/, '');
    if (!pathname || pathname === '/') {
      url.pathname = '/api/misato';
    } else if (!pathname.endsWith('/api/misato')) {
      url.pathname = `${pathname}/api/misato`;
    }
    return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
  } catch {
    return value.endsWith('/api/misato') ? value : `${value}/api/misato`;
  }
}

function splitRuntimeOrigin(raw) {
  const split = RUNTIME_CONFIG.splitRuntimeOrigin;
  if (typeof split === 'function') return split(raw);
  const origin = normalizeRuntimeOrigin(raw);
  const url = new URL(origin);
  return { origin, host: url.hostname, port: url.port || '3010' };
}

// ── State ──────────────────────────────────────────────────────
const injectedRuntimeOrigin = normalizeRuntimeOrigin(
  RUNTIME_CONFIG.runtimeOrigin || window.__MISATO_RUNTIME_ORIGIN__ || ''
);
const injectedPreviewBaseUrl = normalizeApiBaseUrl(
  RUNTIME_CONFIG.previewApiBaseUrl || window.__MISATO_PREVIEW_API_BASE_URL__ || window.__MISATO_API_BASE_URL__ || ''
);
const injectedRuntimeParts = splitRuntimeOrigin(injectedRuntimeOrigin);
const state = {
  // ── Hermes connection (primary) ──────────────────────────────
  hermesOrigin:  normalizeRuntimeOrigin(storage.get('misato_runtime_origin', injectedRuntimeOrigin)),
  hermesHost:    storage.get('misato_hermes_host', injectedRuntimeParts.host || HERMES_DEFAULT_HOST),
  hermesPort:    normalizeHermesPort(storage.get('misato_hermes_port', injectedRuntimeParts.port || HERMES_DEFAULT_PORT)),
  // 'unknown' | 'finding' | 'connected' | 'not-running' | 'failed'
  hermesState:   'unknown',
  hermesHealth:  null,   // { status, version, uptime, agents, tasks, events }

  // ── Preview / token (secondary, collapsed Advanced) ──────────
  baseUrl:       normalizeApiBaseUrl(storage.get('misato_api_base_url', injectedPreviewBaseUrl)),
  token:         storage.get('misato_desktop_auth_token', ''),
  bypassToken:   storage.get('misato_vercel_bypass_token', ''),
  // Not configured | Testing… | Connected | Unauthorized | Vercel Protected | 404 / Wrong URL | Failed
  connTest: { label:'Not configured', cls:'unconfigured', httpStatus:null, checkedAt:null, error:'', nextFix:'' },

  // ── SSE ──────────────────────────────────────────────────────
  // 'idle' | 'connecting' | 'connected' | 'error'
  sseState:      'idle',
  feedEvents:    [],     // canonical: { eventId, timestamp, type, source, payload }
  feedPaused:    false,
  newWhilePaused:0,

  // ── Runtime data (null = not yet fetched) ───────────────────
  agents:        null,
  tasks:         null,
  approvals:     null,
  logs:          null,
  watchtower:    null,
  sentinel:      null,
  projects:      null,  // from /api/misato/projects
  lanes:         null,  // from /api/misato/lanes
  council:       null,  // from /api/misato/council
  runtimeCtx:   null,  // from /api/misato/status (mode, counts, etc.)

  // ── Command Center ───────────────────────────────────────────
  messages:      [],
  commandTimeline:[],    // stages populated by SSE events
  activeCommandId:null,
  loading:       false,

  // ── UI ───────────────────────────────────────────────────────
  activeScreen:   'overview',
  configOpen:     false,
  advancedOpen:   false,
  selectedAgent:  null,
  agentFilter:    'all',
  feedFilter:     'all',
  designLibTab:   'tokens',
  obsidianFolder: 0,
  modal:          null,  // { type, data } — current open modal or null
  logFilter:      'all', // 'all' | 'info' | 'warn' | 'error'
  scheduleView:   'agenda', // 'agenda' | 'day' | 'week'
  approvalFilter: 'pending', // 'pending' | 'approved' | 'rejected' | 'deferred' | 'all'
  schedule:       null  // from GET /api/misato/schedule — { viewData: { agenda, day, week }, unscheduledTasks }
};

// ── Utility Helpers ────────────────────────────────────────────
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function now()  { return new Date().toISOString(); }
function fmtTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  } catch { return String(iso); }
}
function fmtUptime(s) {
  if (!s && s !== 0) return '—';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
function isHermesConnected() { return state.hermesState === 'connected'; }
function isConnected()       { return isHermesConnected() || state.connTest.label === 'Connected'; }

function priorityBadge(p) {
  const m = { High:'badge-red', Medium:'badge-amber', Low:'badge-slate', Critical:'badge-red' };
  return `<span class="badge ${m[p]||'badge-slate'}">${esc(p)}</span>`;
}
function statusBadge(s) {
  const m = { Done:'badge-teal', Doing:'badge-blue', Blocked:'badge-red', Idea:'badge-slate', Active:'badge-teal', Planning:'badge-violet', Maintenance:'badge-slate' };
  return `<span class="badge ${m[s]||'badge-slate'}">${esc(s)}</span>`;
}
function agentStateBadge(s) {
  const m = { active:'badge-teal', complete:'badge-slate', thinking:'badge-blue', blocked:'badge-red', idle:'badge-slate' };
  return `<span class="badge ${m[s]||'badge-slate'}">${esc(s)}</span>`;
}
function normalizeCouncilAgent(agent) {
  const abilities = Array.isArray(agent?.abilities) ? agent.abilities : [];
  const blockedActions = Array.isArray(agent?.blockedActions) ? agent.blockedActions : [];
  const allowedTools = Array.isArray(agent?.allowedTools) ? agent.allowedTools : [];
  const rawStatus = String(agent?.status || agent?.state || "").toLowerCase();
  const agentState =
    rawStatus.includes("online") || rawStatus.includes("active") ? "active" :
    rawStatus.includes("think") || rawStatus.includes("pending") ? "thinking" :
    rawStatus.includes("block") || rawStatus.includes("fail") ? "blocked" :
    rawStatus.includes("complete") ? "complete" : "idle";

  return {
    ...agent,
    // Normalize agentId → id so card clicks, drawer, and event matching all work
    id:   agent?.id || agent?.agentId || agent?.agent_id,
    state: agentState,
    risk: agent?.risk || agent?.riskTier || agent?.riskLevel || "Low",
    perm: agent?.perm || (typeof agent?.permissionLevel === "number" ? `L${agent.permissionLevel}` : agent?.permissionLevel || "Advisory"),
    specialty: agent?.specialty || abilities.join(", ") || agent?.memoryScope || allowedTools.join(", ") || "Council operations",
    feedback:
      agent?.feedback ||
      agent?.summary ||
      agent?.currentTask ||
      agent?.status ||
      `${abilities.slice(0, 2).join(" · ") || "Standing by"}${blockedActions.length ? ` · Blocked: ${blockedActions.slice(0, 2).join(", ")}` : ""}`,
    lastActivityAt: agent?.lastActivityAt || agent?.updatedAt || null,
    currentTaskId:  agent?.currentTaskId  || agent?.taskId  || null
  };
}

function normalizeItemsResponse(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

function normalizeWatchtower(value) {
  if (!value) return null;
  const services = Array.isArray(value.services)
    ? value.services
    : Array.isArray(value.monitors)
      ? value.monitors.map((monitor) => ({
          name: monitor?.name || monitor?.id || "Monitor",
          meta: monitor?.target || monitor?.status || "",
          ok: monitor?.status === "up" ? true : monitor?.status === "down" ? false : null
        }))
      : [];
  return { ...value, services };
}

function mockBanner(label='') {
  return `<div class="mock-banner">◎ MOCK DATA${label ? ' — ' + label : ''} · Connect Hermes for live state</div>`;
}
function connCls(label) {
  const m = { 'Connected':'connected','Unauthorized':'unauthorized','Vercel Protected':'protected','404 / Wrong URL':'not-found','Testing…':'testing','Failed':'failed' };
  return m[label] || 'unconfigured';
}

// ── Hermes Base URL ────────────────────────────────────────────
function hermesBase() {
  const origin = normalizeRuntimeOrigin(
    state.hermesOrigin || `http://${(state.hermesHost||HERMES_DEFAULT_HOST).trim()}:${(state.hermesPort||HERMES_DEFAULT_PORT).trim()}`
  );
  state.hermesOrigin = origin;
  const parts = splitRuntimeOrigin(origin);
  state.hermesHost = parts.host;
  state.hermesPort = parts.port;
  return origin;
}
// Prefixed helper for all Hermes data/mutation routes (/api/misato/*)
// Exception: /health stays flat — it is the unauthenticated discovery probe.
function hermesApi(path) {
  return `${hermesBase()}/api/misato/${path.replace(/^\/+/, '')}`;
}

// ── Discover Hermes (probes /health) ──────────────────────────
async function discoverHermes() {
  state.hermesState = 'finding';
  render();
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 4000);
    const res  = await fetch(`${hermesBase()}/health`, { method:'GET', signal:ctrl.signal });
    clearTimeout(tid);
    if (res.ok) {
      // Verify the response is actually JSON — a 200 HTML page (e.g. Next.js error page
      // at /health) must not be treated as a live Hermes connection.
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        console.warn(`[MISATO] /health returned ${ct.split(';')[0].trim()} — not a JSON runtime`);
        state.hermesState = 'not-running';
      } else {
        let health = {};
        try { health = await res.json(); } catch {}
        state.hermesHealth = health;
        state.hermesState  = 'connected';
        startSSE();
        loadAllFromHermes();
      }
    } else {
      state.hermesState = 'not-running';
    }
  } catch (e) {
    // Surface connection refused vs other errors so dead ports are identifiable
    const isRefused = e?.message?.includes('fetch') || e?.name === 'AbortError';
    console.warn(`[MISATO] discoverHermes failed: ${e?.message || e} (target: ${hermesBase()}/health)`);
    state.hermesState = state.hermesState === 'finding' ? 'not-running' : state.hermesState;
  }
  render();
}

function saveHermesHostPort() {
  const h = document.getElementById('cfg-hermes-host')?.value?.trim() || HERMES_DEFAULT_HOST;
  const p = normalizeHermesPort(document.getElementById('cfg-hermes-port')?.value?.trim() || HERMES_DEFAULT_PORT);
  const changed = h !== state.hermesHost || p !== state.hermesPort;
  const origin = normalizeRuntimeOrigin(`http://${h}:${p}`);
  state.hermesOrigin = origin;
  state.hermesHost = splitRuntimeOrigin(origin).host;
  state.hermesPort = splitRuntimeOrigin(origin).port;
  storage.set('misato_hermes_host', h); storage.set('misato_hermes_port', p);
  storage.set('misato_runtime_origin', origin);
  // If target changed while SSE is open, restart the stream to the new endpoint.
  // Without this, mutations go to the new host:port but SSE events still come from the old one.
  if (changed && state.hermesState === 'connected') { stopSSE(); startSSE(); }
}

// ── Load all data from Hermes ──────────────────────────────────
async function loadAllFromHermes() {
  // All Hermes data routes use /api/misato/* prefix (confirmed hermes-to-claude.md 2026-05-25).
  // Only /health is flat — it is the unauthenticated boot discovery probe.
  const h = { accept: 'application/json' };
  const safeGet = (url) =>
    fetch(url, { headers: h }).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      // Reject HTML responses — Next.js page routes can return 200 HTML for missing API paths,
      // making them indistinguishable from a real 404 without this check.
      const ct = r.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        console.warn(`[MISATO] Expected JSON from ${url} — got ${ct.split(';')[0].trim()} (page route fallthrough?)`);
        throw new Error(`Not JSON: ${ct}`);
      }
      return r.json();
    }).catch(() => null);
  const [agents, tasks, approvals, logs, watchtower, sentinel, runtimeCtx, schedule, lanes] = await Promise.all([
    safeGet(hermesApi('agents')),
    safeGet(hermesApi('tasks')),
    safeGet(hermesApi('approvals')),
    safeGet(hermesApi('logs')),
    safeGet(hermesApi('watchtower')),
    safeGet(hermesApi('secrets')),
    safeGet(hermesApi('status')),    // runtime context: mode, counts, localSoloMode, activeModel, etc.
    safeGet(hermesApi('schedule')),  // schedule viewData: { agenda, day, week }
    safeGet(hermesApi('lanes'))      // lane cards: { items: [...] }
  ]);
  const normalizedAgents = normalizeItemsResponse(agents).map(normalizeCouncilAgent);
  const normalizedTasks = normalizeItemsResponse(tasks);
  const normalizedApprovals = normalizeItemsResponse(approvals);
  const normalizedLogs = normalizeItemsResponse(logs);
  if (normalizedAgents.length)    state.agents     = normalizedAgents;
  if (normalizedTasks.length)     state.tasks      = normalizedTasks;
  if (normalizedApprovals.length) state.approvals  = normalizedApprovals;
  if (normalizedLogs.length)      state.logs       = normalizedLogs;
  if (watchtower)                 state.watchtower  = normalizeWatchtower(watchtower);
  if (sentinel)                   state.sentinel    = sentinel;
  if (runtimeCtx)                 state.runtimeCtx  = runtimeCtx;
  // Schedule and lanes are optional — only overwrite if we got a valid response
  if (schedule?.ok)               state.schedule    = schedule;
  if (lanes?.ok)                  state.lanes       = lanes;
  render();
}

// ── SSE Event Subscription ─────────────────────────────────────
let _sseSource    = null;
let _sseErrCount  = 0;          // consecutive error count
const SSE_MAX_ERR = 3;          // escalate to discoverHermes after this many

function startSSE() {
  if (_sseSource) { _sseSource.close(); _sseSource = null; }
  state.sseState = 'connecting';
  try {
    _sseSource = new EventSource(hermesApi('events/stream'));
    _sseSource.onopen = () => {
      state.sseState  = 'connected';
      _sseErrCount    = 0;
      refreshFeedUI();
      refreshTopBarUI();
    };
    _sseSource.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data);
        // Normalize dot-notation types (task.updated) to underscore (task_updated).
        // Hermes emits both variants — normalize here so all downstream logic uses one form.
        if (evt.type) evt.type = evt.type.replace(/\./g, '_');
        state.feedEvents.unshift(evt);
        if (state.feedEvents.length > 500) state.feedEvents.length = 500;
        // Drive command timeline
        if (COMMAND_STAGES.find(s => s.type === evt.type)) processCommandEvent(evt);
        // Drive live data patches
        if (evt.type === 'task_updated'       && evt.payload?.task)     updateLiveTask(evt.payload.task);
        if (evt.type === 'agent_assigned'     && evt.payload?.agent)    updateLiveAgent(evt.payload.agent);
        if (evt.type === 'approval_requested' && evt.payload?.approval) prependLiveApproval(evt.payload.approval);
        if (evt.type === 'approval_resolved') loadAllFromHermes(); // resync after approval
        if (!state.feedPaused) refreshFeedUI();
        else { state.newWhilePaused++; refreshFeedPauseBadge(); }
      } catch {}
    };
    _sseSource.onerror = () => {
      state.sseState = 'error';
      _sseErrCount++;
      if (_sseSource) { _sseSource.close(); _sseSource = null; }
      refreshFeedUI(); refreshTopBarUI();
      if (_sseErrCount >= SSE_MAX_ERR) {
        // Hermes may have gone down — re-probe /health rather than blindly retrying SSE
        _sseErrCount = 0;
        setTimeout(() => { if (state.hermesState === 'connected') discoverHermes(); }, 5000);
      } else {
        setTimeout(() => { if (state.hermesState === 'connected') startSSE(); }, 8000);
      }
    };
  } catch {
    state.sseState = 'error';
    _sseErrCount++;
    setTimeout(() => { if (state.hermesState === 'connected') startSSE(); }, 8000);
  }
}

function stopSSE() {
  if (_sseSource) { _sseSource.close(); _sseSource = null; }
  state.sseState = 'idle';
}

// ── Log polling fallback (when SSE is unavailable) ─────────────
// Polls /logs every 15 s. Only runs when Hermes is up + SSE is not connected.
// Converts new log entries into feed events so the feed stays live.
let _lastPollLogTs = '';
async function pollLogsFallback() {
  if (!isHermesConnected()) return;
  if (state.sseState === 'connected') return; // SSE is working — skip
  try {
    const res = await fetch(hermesApi('logs'), { headers: { accept: 'application/json' } });
    if (!res.ok) return;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      console.warn(`[MISATO] pollLogsFallback expected JSON from ${hermesApi('logs')} — got ${ct.split(';')[0].trim()} (page route fallthrough — skipping poll)`);
      return;
    }
    const data = await res.json();
    const logs = normalizeItemsResponse(data);
    if (!logs.length) return;
    // Update state.logs
    state.logs = logs;
    // Seed feed events from new entries (avoid dupes by eventId / ts)
    const existingIds = new Set(state.feedEvents.map(e => e.eventId));
    const newEvents = logs
      .map(logToFeedEvent)
      .filter(e => !existingIds.has(e.eventId));
    if (newEvents.length) {
      state.feedEvents.unshift(...newEvents);
      if (state.feedEvents.length > 500) state.feedEvents.length = 500;
      if (!state.feedPaused) refreshFeedUI();
      else { state.newWhilePaused += newEvents.length; refreshFeedPauseBadge(); }
    }
  } catch {}
}
setInterval(pollLogsFallback, 15_000);

// ── Live data incremental updates (no full re-render) ─────────
function updateLiveTask(task) {
  if (!state.tasks) state.tasks = [];
  const idx = state.tasks.findIndex(t => t.id === task.id);
  if (idx >= 0) state.tasks[idx] = { ...state.tasks[idx], ...task };
  else state.tasks.unshift(task);
}
function updateLiveAgent(agent) {
  if (!state.agents) state.agents = [];
  // Normalize through the same pipeline as loadAllFromHermes so agentId → id
  // and riskTier/lastActivityAt are always mapped correctly.
  const normalized = normalizeCouncilAgent(agent);
  const idx = state.agents.findIndex(a => a.id === normalized.id);
  if (idx >= 0) state.agents[idx] = { ...state.agents[idx], ...normalized };
  // If agent is unknown (new to this session), prepend so it's visible immediately
  else if (normalized.id) state.agents.unshift(normalized);
}
function prependLiveApproval(approval) {
  if (!state.approvals) state.approvals = [];
  if (!state.approvals.find(a => a.id === approval.id)) state.approvals.unshift(approval);
}

// ── Command timeline from SSE events ──────────────────────────
function processCommandEvent(evt) {
  if (state.activeCommandId && evt.payload?.commandId && evt.payload.commandId !== state.activeCommandId) return;
  const existing = state.commandTimeline.find(e => e.type === evt.type);
  if (!existing) {
    state.commandTimeline.push({
      type:      evt.type,
      label:     COMMAND_STAGES.find(s=>s.type===evt.type)?.label || evt.type,
      icon:      COMMAND_STAGES.find(s=>s.type===evt.type)?.icon  || '◎',
      timestamp: evt.timestamp,
      detail:    evt.payload?.summary || evt.payload?.message || '',
      done:      true
    });
  }
  // Partial update if Command Center is active
  if (state.activeScreen === 'command' && !state.configOpen) {
    const tl = document.getElementById('command-timeline');
    if (tl) tl.innerHTML = buildTimelineHTML();
  }
}

// ── Partial DOM updates (avoid re-render on every SSE tick) ───
function refreshFeedUI() {
  const el = document.querySelector('.feed-entries');
  if (el) el.innerHTML = buildFeedEntriesHTML();
  refreshFeedMeta();
}
function refreshFeedMeta() {
  const lbl = document.querySelector('.live-badge');
  if (lbl) {
    const { text, color } = sseLiveLabel();
    lbl.textContent = text; lbl.style.color = color;
  }
  const cnt = document.querySelector('.feed-count');
  if (cnt) cnt.textContent = getFilteredFeedEvents().length;
  const pauseBtn = document.querySelector('#btn-feed-pause');
  if (pauseBtn) {
    pauseBtn.textContent = state.feedPaused
      ? (state.newWhilePaused ? `Follow Live (${state.newWhilePaused} new)` : 'Follow Live')
      : 'Pause';
  }
}
function refreshFeedPauseBadge() {
  const pauseBtn = document.querySelector('#btn-feed-pause');
  if (pauseBtn && state.feedPaused) {
    pauseBtn.textContent = `Follow Live (${state.newWhilePaused} new)`;
  }
}
function refreshTopBarUI() {
  // Replace the full topbar-right so runtime badge + hermes status stay in sync
  const right = document.querySelector('.topbar-right');
  if (!right) return;
  const rs = runtimeStatus();
  const modeBadgeCls = rs.hermesConnected ? 'badge-teal' : rs.runtimeMode === 'VERCEL PREVIEW' ? 'badge-blue' : 'badge-slate';
  const sseBadge = rs.sseAvailable ? `<span class="badge badge-teal" style="font-size:9px">SSE LIVE</span>` : '';
  right.innerHTML = `
    <span class="badge ${modeBadgeCls} runtime-mode-badge">${esc(rs.runtimeMode)}</span>
    ${sseBadge}
    ${buildTopBarHermesHTML()}
    ${state.connTest.label !== 'Not configured' && !isHermesConnected() ? `
      <div class="conn-indicator">
        <div class="conn-led ${connCls(state.connTest.label)}"></div>
        <span>${esc(state.connTest.label)}</span>
      </div>` : ''}`;
}

function sseLiveLabel() {
  if (state.sseState === 'connected')  return { text:'● LIVE',     color:'var(--accent-teal)' };
  if (state.sseState === 'connecting') return { text:'○ SSE…',     color:'var(--accent-amber)' };
  if (state.sseState === 'error' && isHermesConnected()) return { text:'● POLLING',  color:'var(--accent-amber)' };
  if (state.sseState === 'error')      return { text:'● SSE ERR',  color:'var(--accent-red)' };
  if (isHermesConnected()) return { text:'● HERMES', color:'var(--accent-blue)' };
  return { text:'● MOCK', color:'var(--accent-slate)' };
}

// ── Feed data ──────────────────────────────────────────────────
// Convert a log entry (from /logs) to a canonical feed event.
// NOT marked as mock — these are real Hermes log records.
function logToFeedEvent(log, i) {
  const sev = (log.sev || log.level || log.severity || 'info').toLowerCase();
  return {
    eventId:   log.id || `log-${i}`,
    timestamp: log.ts || log.timestamp || '',
    type:      sev === 'warn' || sev === 'warning' || sev === 'error' ? 'risk_detected' : 'log',
    source:    log.src || log.source || '',
    payload:   { message: log.action || log.message || log.msg || '', agent: log.agent, sev, _fromLogs: true }
  };
}
// Convert a MOCK_LOGS entry — always flagged _mock so the UI dims them.
function toFeedEvent(log, i) {
  return {
    eventId:   `mock-${i}`,
    timestamp: log.ts,
    type:      log.sev === 'warn' || log.sev === 'error' ? 'risk_detected' : 'log',
    source:    log.src,
    payload:   { message: log.action, agent: log.agent, sev: log.sev, _mock: true }
  };
}

// Event types that are too noisy for the default live feed.
// Heartbeats, stream lifecycle, and connection events are filtered from all views.
// Note: SSE heartbeats use named events (`event: heartbeat`) so never reach onmessage,
// but include the type anyway for defence-in-depth.
const FEED_NOISE_TYPES = new Set([
  'runtime.heartbeat', 'runtime_heartbeat', 'heartbeat',
  'stream.connected',  'stream_connected',
  'stream.reconnect',  'stream_reconnect',
  'context_loaded',    // fires on every SSE connection open — not a real event
  'ping', 'pong'
]);

function getFilteredFeedEvents() {
  let raw;
  if (state.feedEvents.length) {
    // SSE has delivered events — use them (real live data)
    raw = state.feedEvents;
  } else if (isHermesConnected() && state.logs && state.logs.length) {
    // Hermes is up but SSE hasn't fired yet — show polled logs (not mock)
    raw = state.logs.map(logToFeedEvent);
  } else {
    // Truly disconnected — show mock so the feed isn't empty
    raw = MOCK_LOGS.map(toFeedEvent);
  }

  // Remove noise events and deduplicate by eventId.
  // Approval spam (same approval_requested eventId appearing many times) is collapsed here.
  const seen = new Set();
  const cleaned = raw.filter(e => {
    if (FEED_NOISE_TYPES.has(e.type)) return false;
    const key = e.eventId || `${e.type}::${e.timestamp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (state.feedFilter === 'all')       return cleaned;
  if (state.feedFilter === 'alerts')    return cleaned.filter(e => e.type === 'risk_detected' || e.payload?.sev === 'warn' || e.payload?.sev === 'error' || e.payload?.sev === 'warning');
  if (state.feedFilter === 'agents')    return cleaned.filter(e => ['agent_assigned','status_change'].includes(e.type));
  if (state.feedFilter === 'commands')  return cleaned.filter(e => ['command_received','plan_generated','approval_requested','approval_resolved'].includes(e.type));
  if (state.feedFilter === 'tasks')     return cleaned.filter(e => e.type === 'task_updated');
  if (state.feedFilter === 'approvals') return cleaned.filter(e => ['approval_requested','approval_resolved'].includes(e.type));
  return cleaned;
}

function buildFeedEntriesHTML() {
  const events = getFilteredFeedEvents().slice(0, 100);
  if (!events.length) return `<div class="feed-empty">No events match this filter</div>`;
  return events.map(e => {
    const isMock = !!e.payload?._mock;
    const meta   = EVENT_META[e.type] || EVENT_META.log;
    const ts     = fmtTime(e.timestamp);
    const src    = e.source || '';
    // Never render raw JSON — if no human-readable field exists, show a typed placeholder.
    const msg    = e.payload?.message || e.payload?.action || e.payload?.summary ||
                   (typeof e.payload === 'string' ? e.payload : '') ||
                   `[${e.type || 'event'}]`;
    return `
      <div class="feed-entry ${isMock?'feed-entry-mock':''}">
        <div class="feed-entry-header">
          <span class="feed-entry-ts">${esc(ts)}</span>
          <span class="feed-entry-type" style="color:${meta.color}">${meta.icon} ${esc(meta.label)}</span>
          ${src ? `<span class="feed-entry-src">${esc(src)}</span>` : ''}
        </div>
        <div class="feed-entry-msg">${esc(msg)}</div>
      </div>`;
  }).join('');
}

// ── Command timeline HTML ──────────────────────────────────────
function buildTimelineHTML() {
  const done = new Set(state.commandTimeline.map(e => e.type));
  return COMMAND_STAGES.map(stage => {
    const hit = state.commandTimeline.find(e => e.type === stage.type);
    const cls = hit ? 'done' : done.size > 0 ? 'pending' : 'pending';
    return `
      <div class="timeline-item ${cls}">
        <div class="timeline-dot">${hit ? stage.icon : '○'}</div>
        <div class="timeline-body">
          <div class="timeline-label">${esc(stage.label)}</div>
          ${hit ? `<div class="timeline-detail">${esc(hit.detail || '')}</div><div class="timeline-ts">${esc(fmtTime(hit.timestamp))}</div>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ── Network layer — Preview / token path (unchanged contract) ──
function headers() {
  const h = { 'content-type': 'application/json', accept: 'application/json' };
  if (state.token)       h['x-misato-desktop-token']     = state.token;
  if (state.bypassToken) h['x-vercel-protection-bypass'] = state.bypassToken;
  return h;
}
function endpoint(path) {
  const base = isHermesConnected()
    ? hermesBase()
    : normalizeApiBaseUrl(state.baseUrl);
  return `${base}/${path.replace(/^\/+/, '')}`;
}
async function apiGet(path) {
  const res = await fetch(endpoint(path), { method:'GET', headers:headers() });
  const ct = res.headers.get('content-type') || '';
  // Reject HTML at any status — a 200 SSO page must not be parsed as JSON data
  if (ct.includes('text/html')) throw Object.assign(new Error('Vercel Protected'), { isVercelSso:true, status:res.status });
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status:res.status });
  return res.json();
}

// ── Hermes mutation layer ──────────────────────────────────────
// All write ops go through here. Surfaces URL + reason on failure.
async function hermesMutate(method, path, body) {
  const url = `${hermesBase()}/${path.replace(/^\/+/, '')}`;
  const res = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw Object.assign(new Error(`HTTP ${res.status} — ${text.substring(0, 120)}`), { url });
  }
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    console.warn(`[MISATO] hermesMutate expected JSON from ${url} — got ${ct.split(';')[0].trim()}`);
    throw Object.assign(new Error(`Not JSON: ${ct.split(';')[0].trim()}`), { url });
  }
  try { return await res.json(); } catch { return {}; }
}

// ── Approval resolution ────────────────────────────────────────
async function resolveApproval(id, action) {
  // action: 'approve' | 'reject' | 'defer'
  // Contract: POST /api/misato/approvals/action { approvalId, action }
  if (!isHermesConnected()) { showToast('◎ Hermes offline — start npm run dev to reconnect.', '⚠'); return; }
  try {
    await hermesMutate('POST', 'api/misato/approvals/action', { approvalId: id, action });
    // Optimistic: remove from local list
    if (action !== 'defer') {
      state.approvals = (state.approvals || []).filter(a => a.id !== id);
    }
    // UX Copy Deck compliant toast (includes approval ID for traceability)
    const actionLabel = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'deferred';
    showToast(`✓ Approval #${id} ${actionLabel} by owner.`, action === 'approve' ? '◉' : action === 'reject' ? '✕' : '○');
    render();
    // Refresh full approval list in background
    loadAllFromHermes();
  } catch (e) {
    const msg = e.url ? `✗ Approval action failed · ${e.message} · ${e.url}` : `✗ Approval action failed · ${e.message}`;
    showToast(msg, '⚠');
  }
}

// ── Task CRUD ──────────────────────────────────────────────────
async function createTask(data) {
  // Contract: POST /api/misato/tasks/create { title, project, priority, status, agent }
  if (!isHermesConnected()) { showToast('◎ Hermes offline — start npm run dev to reconnect.', '⚠'); return; }
  try {
    const task = await hermesMutate('POST', 'api/misato/tasks/create', {
      title:    data.title,
      project:  data.project  || 'NexCall',
      priority: data.priority || 'Medium',
      status:   data.status   || 'Idea',
      agent:    data.agent    || ''
    });
    updateLiveTask(task.id ? task : { ...data, id: `local-${Date.now()}` });
    showToast('Task created.', '◉');
    state.modal = null;
    render();
  } catch (e) {
    showToast(e.url ? `${e.message}\n${e.url}` : e.message, '⚠');
  }
}

async function updateTask(id, patch) {
  // Contract: POST /api/misato/tasks/update { taskId, payload }
  if (!isHermesConnected()) {
    // Optimistic update only — there is no sync queue, so this is local-only until page reload
    if (state.tasks) {
      const idx = state.tasks.findIndex(t => t.id === id);
      if (idx >= 0) { state.tasks[idx] = { ...state.tasks[idx], ...patch }; render(); }
    }
    showToast('Task updated locally — changes are not persisted (Hermes offline).', '◎');
    return;
  }
  try {
    await hermesMutate('POST', 'api/misato/tasks/update', { taskId: id, payload: patch });
    updateLiveTask({ id, ...patch });
    render();
  } catch (e) {
    // Still apply optimistic update for status/priority cycles so the board stays responsive
    updateLiveTask({ id, ...patch });
    render();
    showToast(e.url ? `Sync failed: ${e.message} — ${e.url}` : e.message, '⚠');
  }
}

async function deleteTask(id) {
  const task = (state.tasks || []).find(t => t.id === id);
  if (!task) return;
  // High-risk or approvalRequired tasks: create approval record instead of deleting
  if (task.risk === 'High' || task.approvalRequired) {
    const apr = {
      id: `apr-del-${id}-${Date.now()}`,
      title: `Delete task: ${task.title}`,
      risk: task.risk || 'Medium',
      agent: 'Owner',
      details: `Deletion of "${task.title}" requires owner approval.`,
      requestedAt: 'just now'
    };
    prependLiveApproval(apr);
    showToast('High-risk delete queued for approval.', '◆');
    render();
    return;
  }
  if (!isHermesConnected()) {
    // Optimistic local removal only — will re-appear on next Hermes sync
    state.tasks = (state.tasks || []).filter(t => t.id !== id);
    showToast('Task removed locally (Hermes offline — will reappear on reconnect).', '◎');
    render();
    return;
  }
  // Contract: POST /api/misato/tasks/delete { taskId }
  try {
    await hermesMutate('POST', 'api/misato/tasks/delete', { taskId: id });
    state.tasks = (state.tasks || []).filter(t => t.id !== id);
    showToast('✕ Task deleted.', '✕');
    render();
  } catch (e) {
    // Do NOT remove locally on failure — task is still live on Hermes, removing here is a lie.
    showToast(e.url ? `Delete failed — task not removed: ${e.message} (${e.url})` : `Delete failed: ${e.message}`, '⚠');
  }
}

// ── Runtime status ──────────────────────────────────────────────
function runtimeStatus() {
  const hermesUp  = isHermesConnected();
  const sseUp     = state.sseState === 'connected';
  const previewUp = state.connTest.label === 'Connected';
  // state.runtimeCtx is populated from GET /api/misato/status.
  // Use it to enrich the runtime label when Hermes reports a specific mode.
  const ctx = state.runtimeCtx || {};
  const hermesMode = ctx.mode || ctx.runtimeMode || null;
  return {
    runtimeMode:          hermesUp ? (hermesMode || 'LOCAL SOLO') : previewUp ? 'VERCEL PREVIEW' : 'DISCONNECTED',
    hermesConnected:      hermesUp,
    localSoloMode:        hermesUp,
    sseAvailable:         sseUp,
    persistenceMode:      hermesUp ? 'Hermes local' : 'none',
    authMode:             hermesUp ? 'none required' : state.token ? 'desktop token' : 'no auth',
    allowedMutationMode:  hermesUp ? (ctx.mutationMode || 'full CRUD') : 'read-only',
    agentCount:           ctx.agentCount ?? ctx.agents ?? null,
    taskCount:            ctx.taskCount  ?? ctx.tasks  ?? null,
    desktopTokenRequired: !hermesUp && !!normalizeApiBaseUrl(state.baseUrl),
    productionLocked:     true
  };
}

// ── Test Connection (Preview/token path) ───────────────────────
async function testConnection() {
  const previewBase = normalizeApiBaseUrl(state.baseUrl);
  if (!previewBase) {
    state.connTest = { label:'Not configured', cls:'unconfigured', httpStatus:null, checkedAt:null, error:'', nextFix:'Set the preview API base URL in the Advanced section.' };
    render(); return;
  }
  state.connTest = { label:'Testing…', cls:'testing', httpStatus:null, checkedAt:null, error:'', nextFix:'' };
  render();
  try {
    const url = `${previewBase}/status`;
    const res = await fetch(url, { method:'GET', headers:headers() });
    const ct  = res.headers.get('content-type') || '';
    const ts  = now();
    // Reject HTML at any HTTP status — a 200 SSO page must not be shown as Connected
    if (ct.includes('text/html'))                  state.connTest = { label:'Vercel Protected', cls:'protected',    httpStatus:res.status, checkedAt:ts, error:'Vercel SSO wall detected (HTML response).',       nextFix:'Add the Vercel bypass token in Advanced.' };
    else if (res.status === 401 || res.status === 403) state.connTest = { label:'Unauthorized',    cls:'unauthorized', httpStatus:res.status, checkedAt:ts, error:'Backend rejected the desktop token.',              nextFix:'Check Desktop Auth Token matches Vercel env.' };
    else if (res.status === 404)                   state.connTest = { label:'404 / Wrong URL',  cls:'not-found',   httpStatus:404,        checkedAt:ts, error:'Route not found at this URL.',                    nextFix:'Verify API Base URL includes the correct path.' };
    else if (res.ok)                               state.connTest = { label:'Connected',         cls:'connected',   httpStatus:200,        checkedAt:ts, error:'', nextFix:'' };
    else                                           state.connTest = { label:'Failed',            cls:'failed',      httpStatus:res.status, checkedAt:ts, error:`Unexpected response: HTTP ${res.status}`,         nextFix:'Check if the server is running.' };
  } catch (e) {
    const ts = now();
    if (e.isVercelSso) state.connTest = { label:'Vercel Protected', cls:'protected', httpStatus:e.status, checkedAt:ts, error:'Vercel SSO wall detected.', nextFix:'Add the Vercel bypass token in Advanced.' };
    else               state.connTest = { label:'Failed',           cls:'failed',    httpStatus:null,    checkedAt:ts, error:e.message||'Network error',   nextFix:'Check MISATO API Base URL and your connection.' };
  }
  render();
}

// ── Send command ───────────────────────────────────────────────
async function sendCommand(cmd) {
  if (!cmd.trim() || state.loading) return;
  if (!isConnected()) {
    state.messages.push({ role:'misato', text:`Not connected. Start Hermes (npm run dev) then click Find Hermes, or configure Vercel Preview in Settings.`, ts:now(), error:true });
    render(); return;
  }
  state.loading = true;
  state.commandTimeline = [];
  state.activeCommandId = null;
  state.messages.push({ role:'user', text:cmd, ts:now() });
  render();
  // Hermes: POST /api/misato/command — Vercel: POST baseUrl/command
  const url = isHermesConnected() ? hermesApi('command') : endpoint('command');
  try {
    const res = await fetch(url, {
      method:'POST', headers:headers(),
      body: JSON.stringify({ command:cmd })
    });
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { url });
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('text/html')) {
      console.warn(`[MISATO] sendCommand got HTML from ${url} — Vercel SSO or wrong route`);
      throw Object.assign(new Error('Got HTML — Vercel SSO wall or wrong route'), { url });
    }
    // Accept application/json (primary) and text/plain (some Hermes responses)
    if (!ct.includes('application/json') && !ct.includes('text/plain')) {
      console.warn(`[MISATO] sendCommand expected JSON from ${url} — got ${ct.split(';')[0].trim()}`);
      throw Object.assign(new Error(`Not JSON: ${ct.split(';')[0].trim()}`), { url });
    }
    // Parse safely — text/plain responses become { message: rawText }
    let data = {};
    if (ct.includes('application/json')) {
      try { data = await res.json(); } catch { data = {}; }
    } else {
      const rawText = await res.text().catch(() => '');
      data = { message: rawText };
    }
    // Canonical response shape from executeCommand():
    // { ok, commandId, responseText, intent, riskLevel, planSteps, commandStatus, … }
    // responseText is the primary human-readable field from Hermes.
    // Priority chain: responseText → missionSummary → response → message → output
    //   → [intent] commandStatus label (if shape is recognisable CommandResult)
    //   → 'Command sent.' (last resort — never dump raw JSON to chat)
    if (data.commandId) state.activeCommandId = data.commandId;
    const humanText = data.responseText || data.missionSummary || data.response || data.message || data.output;
    const text = humanText
      || (data.intent   ? `[${data.intent}] ${data.commandStatus || 'received'}` : '')
      || (data.ok === true ? 'Command sent.' : '')
      || 'Command sent.';
    // Capture model info for display in the chat bubble
    const modelUsed      = data.modelUsed || data.model || data.aiModel || null;
    const responseSource = data.responseSource || null;
    state.messages.push({ role:'misato', text, ts:now(), modelUsed, responseSource });
    // Refresh live state — commands can trigger task/agent/approval changes on Hermes
    if (isHermesConnected()) setTimeout(() => loadAllFromHermes(), 1500);
  } catch (e) {
    const attempted = e.url || url;
    state.messages.push({ role:'misato', text:`Error: ${e.message}\nAttempted: ${attempted}`, ts:now(), error:true });
  }
  state.loading = false;
  render();
}

// ── Save config ────────────────────────────────────────────────
function saveConfig() {
  const url   = document.getElementById('cfg-url')?.value?.trim()    || '';
  const token = document.getElementById('cfg-token')?.value?.trim()  || '';
  const byp   = document.getElementById('cfg-bypass')?.value?.trim() || '';
  if (url) {
    const normalizedUrl = normalizeApiBaseUrl(url);
    state.baseUrl = normalizedUrl;
    storage.set('misato_api_base_url', normalizedUrl);
  }
  if (token && token !== '••••••••••••••••') { state.token = token; storage.set('misato_desktop_auth_token', token); }
  if (byp   && byp   !== '••••••••••••••••') { state.bypassToken = byp; storage.set('misato_vercel_bypass_token', byp); }
  state.connTest = { label:'Not configured', cls:'unconfigured', httpStatus:null, checkedAt:null, error:'', nextFix:'Click Test Connection to verify.' };
  render();
  showToast('✓ Configuration saved.', '◎');
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

// ── Navigation config ──────────────────────────────────────────
const NAV = [
  { group:'MISSION',    items:[{ id:'overview',label:'Overview',icon:'◉' },{ id:'command',label:'Command Center',icon:'⊕' }]},
  { group:'AGENTS',     items:[{ id:'agentdex',label:'AgentDex',icon:'⬢' },{ id:'schedule',label:'Schedule',icon:'◷' },{ id:'kanban',label:'Kanban',icon:'≣' }]},
  { group:'OPERATIONS', items:[{ id:'watchtower',label:'Watchtower',icon:'◈' },{ id:'sentinel',label:'Secret Sentinel',icon:'◆' },{ id:'logs',label:'Logs',icon:'≡' }]},
  { group:'SYSTEM',     items:[{ id:'integrations',label:'Integrations',icon:'⬡' },{ id:'lanes',label:'Lanes',icon:'⟂' },{ id:'approvals',label:'Approvals',icon:'◇' },{ id:'obsidian',label:'Obsidian Mirror',icon:'⬡' },{ id:'designlib',label:'Design Library',icon:'◎' }]}
];

// ── Render — Shell ─────────────────────────────────────────────
function buildTopBarHermesHTML() {
  const h = state.hermesHealth;
  if (state.hermesState === 'connected' && h) {
    const v      = h.version ? `v${h.version}` : '';
    const uptime = fmtUptime(h.uptime);
    const active = h.agents?.active ?? '?';
    return `<div class="topbar-hermes connected">
      <span class="hermes-dot">◉</span>
      <span class="hermes-label">HERMES ${v}</span>
      ${uptime !== '—' ? `<span class="hermes-meta">↑ ${esc(uptime)}</span>` : ''}
      <span class="hermes-meta">${esc(String(active))} agents</span>
    </div>`;
  }
  if (state.hermesState === 'finding') {
    return `<div class="topbar-hermes finding"><span class="hermes-dot">○</span><span class="hermes-label">CONNECTING…</span></div>`;
  }
  if (state.hermesState === 'not-running') {
    return `<div class="topbar-hermes offline"><span class="hermes-dot">⚠</span><span class="hermes-label">HERMES OFFLINE · npm run dev</span></div>`;
  }
  return `<div class="topbar-hermes idle"><span class="hermes-dot">—</span><span class="hermes-label">NOT STARTED</span></div>`;
}

function renderTopBar() {
  const rs = runtimeStatus();
  const modeBadgeCls = rs.hermesConnected ? 'badge-teal' : rs.runtimeMode === 'VERCEL PREVIEW' ? 'badge-blue' : 'badge-slate';
  const sseBadge = rs.sseAvailable ? `<span class="badge badge-teal" style="font-size:9px">SSE LIVE</span>` : '';
  return `
    <header class="topbar">
      <div class="topbar-brand">
        <div class="topbar-brand-mark">M</div>
        MISATO
      </div>
      <div class="topbar-right">
        <span class="badge ${modeBadgeCls} runtime-mode-badge">${esc(rs.runtimeMode)}</span>
        ${sseBadge}
        ${buildTopBarHermesHTML()}
        ${state.connTest.label !== 'Not configured' && !isHermesConnected() ? `
          <div class="conn-indicator">
            <div class="conn-led ${connCls(state.connTest.label)}"></div>
            <span>${esc(state.connTest.label)}</span>
          </div>` : ''}
      </div>
    </header>`;
}

function renderNav() {
  const groups = NAV.map(g => `
    <div class="nav-group">
      <div class="nav-group-label">${esc(g.group)}</div>
      ${g.items.map(item => `
        <button class="nav-item ${state.activeScreen===item.id&&!state.configOpen?'active':''}" data-nav="${esc(item.id)}">
          <span class="nav-item-icon">${item.icon}</span>${esc(item.label)}
        </button>`).join('')}
    </div>`).join('<div class="nav-divider"></div>');
  return `
    <nav class="nav">
      ${groups}
      <div class="nav-bottom">
        <button class="nav-config-btn ${state.configOpen?'active':''}" data-nav="config">
          <span>⚙</span><span>Settings</span>
        </button>
      </div>
    </nav>`;
}

function renderFeed() {
  const { text: liveTxt, color: liveColor } = sseLiveLabel();
  const count = getFilteredFeedEvents().length;
  const filters = [
    { id:'all',       label:'ALL'   },
    { id:'alerts',    label:'ALERTS'},
    { id:'agents',    label:'AGENTS'},
    { id:'commands',  label:'CMDS'  },
    { id:'tasks',     label:'TASKS' },
    { id:'approvals', label:'APPV'  }
  ];
  return `
    <aside class="feed">
      <div class="feed-header">
        <span class="feed-title">Live Feed</span>
        <span class="live-badge" style="color:${liveColor}">${liveTxt}</span>
      </div>
      <div class="feed-filter">
        ${filters.map(f=>`<button class="feed-filter-btn ${state.feedFilter===f.id?'active':''}" data-feedfilter="${f.id}">${f.label}</button>`).join('')}
      </div>
      <div class="feed-entries">${buildFeedEntriesHTML()}</div>
      <div class="feed-footer">
        <span class="feed-count-wrap" style="font-size:10px;color:var(--text-tertiary)">
          <span class="feed-count">${count}</span> events
        </span>
        <button class="btn btn-ghost btn-sm" id="btn-feed-pause">${state.feedPaused ? (state.newWhilePaused ? `Follow Live (${state.newWhilePaused} new)` : 'Follow Live') : 'Pause'}</button>
      </div>
    </aside>`;
}

function renderSectionHeader(title, meta='', actions='') {
  return `
    <div class="section-header">
      <div class="row gap-8">
        <span class="section-title">${esc(title)}</span>
        ${meta ? `<span class="section-meta">${esc(meta)}</span>` : ''}
      </div>
      <div class="section-actions">${actions}</div>
    </div>`;
}

// ── Hermes Setup Card — shown on Overview when offline ─────────
function renderHermesSetupCard() {
  const host = esc(state.hermesHost || HERMES_DEFAULT_HOST);
  const port = esc(state.hermesPort || '3010');
  return `
    <div class="setup-card">
      <div class="setup-card-icon">⬡</div>
      <div class="setup-card-body">
        <div class="setup-card-title">Hermes is not running</div>
        <div class="setup-card-sub">Start your local AI runtime to activate MISATO · ${host}:${port || '3010'}</div>
        <div class="setup-steps">
          <div class="setup-step"><span class="setup-step-num">1</span><span>Open a terminal in your <code>nexcall</code> project folder</span></div>
          <div class="setup-step"><span class="setup-step-num">2</span><span>Run: <code>npm run dev</code></span></div>
          <div class="setup-step"><span class="setup-step-num">3</span><span>Click <strong>Try Again</strong> below — or wait up to 60 s for auto-connect</span></div>
        </div>
        <div class="setup-card-actions">
          <button class="btn btn-primary" id="btn-retry-hermes">Try Again</button>
          <button class="btn btn-ghost btn-sm" data-nav="config">Use Vercel Preview instead →</button>
        </div>
      </div>
    </div>`;
}

// ── Settings panel — Local Hermes first ────────────────────────
function renderHermesStatusInline() {
  const h  = esc(state.hermesHost || HERMES_DEFAULT_HOST);
  const p  = esc(state.hermesPort || HERMES_DEFAULT_PORT);
  const st = state.hermesState;
  if (st === 'connected') return `
    <div class="hermes-inline found">
      <span>◉</span>
      <span>Hermes connected — <strong>LOCAL SOLO</strong> mode active · ${h}:${p}</span>
      <span class="hermes-inline-ver">${state.hermesHealth?.version ? `v${state.hermesHealth.version}` : ''}</span>
    </div>`;
  if (st === 'finding') return `
    <div class="hermes-inline finding"><span>○</span><span>Searching ${h}:${p}…</span></div>`;
  if (st === 'not-running') return `
    <div class="hermes-inline not-found">
      <span>⚠</span>
      <div class="hermes-inline-steps">
        <div><strong>Hermes not found at ${h}:${p}</strong> — start the runtime then click Find Hermes</div>
        <div class="inline-steps-row">
          <span>1. <code>cd nexcall</code></span>
          <span>2. <code>npm run dev</code></span>
          <span>3. Click Find Hermes above</span>
        </div>
      </div>
    </div>`;
  return `<div class="hermes-inline idle"><span>—</span><span>Click Find Hermes to discover your local runtime</span></div>`;
}

function renderConfigPanel() {
  const { label, cls, error, nextFix, checkedAt } = state.connTest;
  return `
    <div class="workspace-body">
      <div style="max-width:540px">
        <div class="config-section-label">LOCAL HERMES BRIDGE</div>
        <div class="config-panel mb-12">
          <div class="row gap-8 mb-10">
            <div class="input-group" style="flex:1">
              <label class="input-label" for="cfg-hermes-host">Host</label>
              <input class="input input-mono" id="cfg-hermes-host" type="text" placeholder="127.0.0.1" value="${esc(state.hermesHost||HERMES_DEFAULT_HOST)}" />
            </div>
            <div class="input-group" style="width:90px">
              <label class="input-label" for="cfg-hermes-port">Port</label>
              <input class="input input-mono" id="cfg-hermes-port" type="text" placeholder="3010" value="${esc(state.hermesPort||'3010')}" />
            </div>
          </div>
          <div class="row gap-8 mb-8">
            <button class="btn btn-primary" id="btn-find-hermes">Find Hermes</button>
            ${state.hermesState === 'connected' ? `<button class="btn btn-ghost btn-sm" id="btn-stop-hermes">Disconnect</button>` : ''}
          </div>
          ${renderHermesStatusInline()}
        </div>

        <details class="advanced-details" ${state.advancedOpen?'open':''} id="advanced-details">
          <summary class="advanced-summary">
            <span class="advanced-arrow">▶</span>
            <span>Advanced — Vercel Preview API &amp; Token</span>
            ${state.token||state.bypassToken ? `<span class="badge badge-slate" style="margin-left:8px">configured</span>` : ''}
          </summary>
          <div class="advanced-body">
            <p class="config-note" style="margin-bottom:12px">Use this for cloud preview testing only. Local Hermes defaults to <code>http://127.0.0.1:3010</code> and stays the daily path.</p>
            <div class="col gap-10">
              <div class="input-group">
                <label class="input-label" for="cfg-url">MISATO API Base URL</label>
                <input class="input input-mono" id="cfg-url" type="text" placeholder="https://…/api/misato" value="${esc(state.baseUrl)}" />
                <span class="input-hint">e.g. https://nexcall-git-….vercel.app/api/misato</span>
              </div>
              <div class="input-group">
                <label class="input-label" for="cfg-token">Desktop Auth Token</label>
                <input class="input input-mono" id="cfg-token" type="password" placeholder="Paste token — value never shown" value="${state.token?'••••••••••••••••':''}" />
                <span class="input-hint">Saved locally · value never shown after entry</span>
              </div>
              <div class="input-group">
                <label class="input-label" for="cfg-bypass">Vercel Protection Bypass</label>
                <input class="input input-mono" id="cfg-bypass" type="password" placeholder="Paste bypass token — value never shown" value="${state.bypassToken?'••••••••••••••••':''}" />
                <span class="input-hint">Saved locally · value never shown after entry</span>
              </div>
            </div>
            <div class="config-save-row">
              <button class="btn btn-primary" id="btn-save">Save Config</button>
              <button class="btn btn-secondary" id="btn-test">Test Connection</button>
            </div>
            <p class="config-note">Tokens never logged or displayed in results.</p>
            ${label !== 'Not configured' ? `
              <div class="conn-result ${cls} mt-12">
                <div class="conn-result-status">${esc(label)}</div>
                ${error   ? `<div class="conn-result-detail">${esc(error)}</div>` : ''}
                ${nextFix ? `<div class="conn-result-fix">→ ${esc(nextFix)}</div>` : ''}
                ${checkedAt ? `<div class="conn-result-ts">Last check: ${fmtTime(checkedAt)}</div>` : ''}
              </div>` : ''}
            <div class="auth-modes mt-8">
              <div class="auth-mode-row"><div class="auth-mode-led ${state.token?'on':'off'}"></div><span>${state.token?'Desktop token configured':'Desktop token not set'}</span></div>
              <div class="auth-mode-row"><div class="auth-mode-led ${state.bypassToken?'on':'off'}"></div><span>${state.bypassToken?'Bypass token configured':'Bypass token not set'}</span></div>
            </div>
          </div>
        </details>
      </div>
    </div>`;
}

// ── Screen 1: Overview ─────────────────────────────────────────
function renderOverview() {
  const hermes  = isHermesConnected();
  const h       = state.hermesHealth;
  const agents  = state.agents  || (hermes ? [] : MOCK_AGENTS);
  const tasks   = state.tasks   || (hermes ? [] : MOCK_TASKS);
  const appr    = state.approvals || (hermes ? [] : MOCK_APPROVALS);
  // Show mock banner only when Hermes is NOT connected and we're using fallback data
  const isMock  = !state.agents && !hermes;
  // Show model info from status endpoint
  const ctx     = state.runtimeCtx || {};
  const activeModel = ctx.activeModel || ctx.model || ctx.aiModel || null;
  const active  = hermes && h?.agents?.active != null ? h.agents.active : agents.filter(a=>a.state==='active'||a.state==='thinking').length;
  const blocked = tasks.filter(t=>t.status==='Blocked').length;
  const pending = appr.length;

  const healthTiles = [
    { label:'Hermes',        value: hermes ? 'Connected' : state.hermesState === 'not-running' ? 'Offline' : '—', sub: hermes ? `${state.hermesHost}:${state.hermesPort}` : 'Local runtime', cls: hermes ? 'ok' : state.hermesState==='not-running' ? 'bad' : '' },
    { label:'Uptime',        value: hermes && h?.uptime != null ? fmtUptime(h.uptime) : '—',  sub: hermes ? (h?.version ? `v${h.version}` : 'running') : 'not running',  cls: hermes ? 'ok' : '' },
    { label:'Active Agents', value: hermes && !state.agents ? '…' : active, sub: hermes && !state.agents ? 'loading…' : `${agents.length} total`, cls: active > 0 ? '' : '' },
    { label:'Queue Depth',   value: hermes && !state.tasks ? '…' : tasks.filter(t=>t.status==='Doing').length, sub:blocked?`${blocked} blocked`:'No blockers', cls:blocked?'warn':'' },
    { label:'Approvals',     value: hermes && !state.approvals ? '…' : pending, sub:pending?`${pending} pending review`:'All clear', cls:pending?'warn':'ok' }
  ].map(t => `
    <div class="health-tile ${t.cls||''}">
      <div class="health-tile-label">${esc(t.label)}</div>
      <div class="health-tile-value">${esc(String(t.value))}</div>
      <div class="health-tile-sub">${esc(t.sub)}</div>
    </div>`).join('');

  const modelTile = activeModel ? `
    <div class="model-tile">
      <div class="model-tile-label">Active Model</div>
      <div class="model-tile-value">${esc(activeModel)}</div>
      <div class="model-tile-sub">${esc(ctx.runtimeMode || 'Hermes local')}</div>
    </div>` : '';

  const agentRows = agents.slice(0,6).map(a=>`
    <div class="wt-service-row">
      <div class="auth-mode-led" style="background:${a.state==='active'||a.state==='complete'?'var(--accent-teal)':a.state==='thinking'?'var(--accent-blue)':a.state==='blocked'?'var(--accent-red)':'var(--surface-4)'}"></div>
      <div class="wt-service-name">${esc(a.name)}</div>
      <div class="wt-service-meta" style="flex:1">${esc((a.feedback||'').substring(0,40))}…</div>
      ${agentStateBadge(a.state)}
    </div>`).join('');

  const taskRows = tasks.filter(t=>t.status==='Doing').slice(0,5).map(t=>`
    <div class="wt-service-row">
      ${priorityBadge(t.priority)}
      <div class="wt-service-name" style="flex:1">${esc(t.title.substring(0,40))}</div>
      <span style="font-size:10px;color:var(--text-tertiary)">${esc(t.agent)}</span>
    </div>`).join('');

  return `
    ${renderSectionHeader('Overview','System status at a glance',`<button class="btn btn-secondary btn-sm" id="btn-refresh">Refresh</button>`)}
    <div class="workspace-body">
      ${state.hermesState === 'not-running' ? renderHermesSetupCard() : ''}
      ${isMock && state.hermesState !== 'unknown' ? mockBanner() : ''}
      <div class="health-strip section-gap" style="grid-template-columns:repeat(${activeModel?6:5},1fr);${state.hermesState==='not-running'?'opacity:0.45;pointer-events:none':''}">
        ${healthTiles}
        ${modelTile}
      </div>
      <div class="grid-2 section-gap">
        <div class="card">
          <div class="card-header"><span class="card-title">Agent Status</span><button class="btn btn-ghost btn-sm" data-nav="agentdex">View all →</button></div>
          ${agentRows || '<div class="empty-state" style="padding:16px"><div class="empty-state-msg">No agents loaded</div></div>'}
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Active Work</span><button class="btn btn-ghost btn-sm" data-nav="kanban">Kanban →</button></div>
          ${taskRows || '<div style="padding:12px;font-size:12px;color:var(--text-tertiary)">No tasks in progress</div>'}
        </div>
      </div>
      <div class="grid-3">
        <div class="card">
          <div class="card-header"><span class="card-title">Recent Alerts</span><button class="btn btn-ghost btn-sm" data-nav="logs">Logs →</button></div>
          ${(state.logs || (hermes ? [] : MOCK_LOGS)).filter(l=>{
              const sev = (l.sev||l.level||l.severity||'').toLowerCase();
              return sev==='warn'||sev==='warning'||sev==='error';
            }).slice(0,4).map(l=>`
            <div class="wt-service-row"><span class="log-ts">${esc(l.ts||fmtTime(l.timestamp))}</span><span class="log-src">${esc(l.src||l.source||'')}</span><span class="log-msg" style="flex:1;font-size:11px">${esc((l.action||l.message||l.msg||'').substring(0,50))}</span></div>`).join('')
          || '<div style="padding:12px;font-size:12px;color:var(--accent-teal)">◉ No recent alerts</div>'}
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Approval Backlog</span><button class="btn btn-ghost btn-sm" data-nav="approvals">Review →</button></div>
          ${pending ? appr.map(a=>`
            <div class="wt-service-row">
              <span class="badge ${a.risk==='High'?'badge-red':a.risk==='Medium'?'badge-amber':'badge-slate'}">${esc(a.risk)}</span>
              <span style="font-size:11px;flex:1">${esc((a.title||'').substring(0,36))}…</span>
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
  const connected = isConnected();
  const hermes    = isHermesConnected();
  const agents    = state.agents || (hermes ? [] : MOCK_AGENTS);
  const active    = agents.filter(a=>a.state==='active'||a.state==='thinking').slice(0,3);
  const modeLabel = hermes ? `Hermes LOCAL SOLO · ${state.hermesHost}:${state.hermesPort}` : state.connTest.label === 'Connected' ? 'Vercel Preview' : 'Not connected';
  const hasTimeline = state.commandTimeline.length > 0;

  const msgs = state.messages.map(m=>`
    <div class="cmd-message cmd-message-${m.role==='user'?'user':'resp'}${m.error?' cmd-message-error':''}">
      <div class="cmd-message-header">
        <span class="cmd-message-role">${m.role==='user'?'You':'MISATO'}</span>
        <span class="cmd-message-ts">${fmtTime(m.ts)}</span>
      </div>
      <div class="cmd-message-body" style="white-space:pre-wrap">${esc(m.text)}</div>
      ${(m.role === 'misato' && !m.error && (m.modelUsed || m.responseSource)) ? `
        <div class="cmd-message-meta">
          ${m.modelUsed ? `<span class="badge badge-violet cmd-model-badge">${esc(m.modelUsed)}</span>` : ''}
          ${m.responseSource === 'deterministic-fallback' ? `<span class="badge badge-amber cmd-model-badge cmd-fallback-note">deterministic fallback</span>` : ''}
        </div>` : ''}
    </div>`).join('');

  const rs = runtimeStatus();
  return `
    ${renderSectionHeader('Command Center','Active control surface',`<button class="btn btn-ghost btn-sm" id="btn-clear-msgs">Clear</button>`)}
    <div class="workspace-body">
      <div class="mission-banner">
        <div>
          <div class="mission-banner-title">MISATO Active Session</div>
          <div class="mission-banner-meta">${esc(modeLabel)}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
          <span class="badge ${rs.hermesConnected?'badge-teal':rs.runtimeMode==='VERCEL PREVIEW'?'badge-blue':'badge-slate'}">${esc(rs.runtimeMode)}</span>
          <span class="badge badge-slate" style="font-size:9px">${esc(rs.allowedMutationMode)}</span>
          ${rs.sseAvailable ? `<span class="badge badge-teal" style="font-size:9px">SSE</span>` : `<span class="badge badge-amber" style="font-size:9px">POLLING</span>`}
          ${!connected ? `<button class="btn btn-secondary btn-sm" data-nav="config">Configure →</button>` : ''}
        </div>
      </div>
      <div class="cmd-layout section-gap">
        <div class="card" style="padding:12px">
          <div class="card-header mb-8"><span class="card-title">Quick Actions</span></div>
          <div class="quick-actions-grid">
            ${QUICK_PROMPTS.map(p=>`<button class="quick-action-btn" data-prompt="${esc(p.label)}">${p.icon} ${esc(p.label)}</button>`).join('')}
          </div>
        </div>
        <div class="card" style="padding:12px">
          <div class="card-header mb-8">
            <span class="card-title">${hasTimeline ? 'Mission Timeline' : 'Active Context'}</span>
            ${hasTimeline ? `<button class="btn btn-ghost btn-sm" id="btn-clear-timeline">Clear</button>` : ''}
          </div>
          ${hasTimeline ? `<div class="timeline" id="command-timeline">${buildTimelineHTML()}</div>` : `
            ${active.length ? active.map(a=>`
              <div class="wt-service-row" style="padding:6px 0;border-bottom:1px solid var(--border-subtle)">
                <div class="auth-mode-led" style="background:${a.state==='thinking'?'var(--accent-blue)':'var(--accent-teal)'}"></div>
                <div style="flex:1">
                  <div style="font-size:12px;font-weight:500">${esc(a.name)}</div>
                  <div style="font-size:10px;color:var(--text-tertiary)">${esc((a.feedback||'').substring(0,60))}</div>
                </div>
                ${agentStateBadge(a.state)}
              </div>`).join('') : `<div style="font-size:11px;color:var(--text-tertiary);padding:8px">${connected?'No agents active':'Connect to load live agent context.'}</div>`}
          `}
        </div>
      </div>
      <div class="cmd-input-area">
        <div class="cmd-messages" id="cmd-messages">
          ${msgs || `<div class="cmd-empty">Send a command or select a quick action to begin.</div>`}
        </div>
        <div class="cmd-input-bar">
          <input class="cmd-input" id="cmd-input" placeholder="Send a command to MISATO… (Ctrl+Enter)" ${state.loading?'disabled':''} />
          <button class="btn btn-primary" id="btn-send" ${state.loading||!connected?'disabled':''}>
            ${state.loading?'Sending…':'Send'}
          </button>
        </div>
      </div>
    </div>`;
}

// ── Screen 3: AgentDex ─────────────────────────────────────────
function renderAgentDex() {
  const hermes   = isHermesConnected();
  const agents   = state.agents || (hermes ? [] : MOCK_AGENTS);
  const isMock   = !state.agents && !hermes;
  const filters  = ['all','active','thinking','idle','blocked','complete'];
  const filtered = state.agentFilter==='all' ? agents : agents.filter(a=>a.state===state.agentFilter);

  const pills = filters.map(f=>`
    <button class="filter-pill ${state.agentFilter===f?'active':''}" data-filter="${f}">
      ${f.charAt(0).toUpperCase()+f.slice(1)}
      <span style="opacity:0.6;margin-left:4px">${agents.filter(a=>f==='all'||a.state===f).length}</span>
    </button>`).join('');

  const cards = filtered.map(a=>`
    <div class="agent-card ${state.selectedAgent?.id===a.id?'selected':''}" data-agent="${esc(a.id)}">
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
        ${esc(a.feedback||'—')}
      </div>
      ${a.progress != null ? `
      <div class="agent-card-progress">
        <div class="agent-progress-wrap">
          <div class="agent-progress-bar"><div class="agent-progress-fill" style="width:${Math.min(100,Math.max(0,a.progress))}%"></div></div>
          <span class="agent-progress-pct">${a.progress}%</span>
        </div>
      </div>` : ''}
      <div class="agent-card-footer">
        <span class="agent-card-ts">${esc((a.specialty||'').substring(0,30))}…</span>
        <span class="badge ${a.risk==='High'?'badge-red':a.risk==='Medium'?'badge-amber':'badge-slate'}">${esc(a.risk)} risk</span>
      </div>
    </div>`).join('');

  const drawer = state.selectedAgent ? `
    <div class="agent-drawer">
      <div class="agent-drawer-header">
        <div>
          <div class="agent-drawer-name">${esc(state.selectedAgent.name)}</div>
          <div class="agent-drawer-role">${esc(state.selectedAgent.role)}</div>
        </div>
        <button class="btn btn-ghost btn-sm" id="btn-close-drawer">✕</button>
      </div>
      <div class="agent-drawer-section">
        <div class="agent-drawer-label">State</div>
        ${agentStateBadge(state.selectedAgent.state)}
      </div>
      <div class="agent-drawer-section">
        <div class="agent-drawer-label">Specialty</div>
        <div class="agent-drawer-value">${esc(state.selectedAgent.specialty||'—')}</div>
      </div>
      <div class="agent-drawer-section">
        <div class="agent-drawer-label">Permissions</div>
        <span class="badge badge-slate">${esc(state.selectedAgent.perm)}</span>
        <span class="badge ${state.selectedAgent.risk==='High'?'badge-red':state.selectedAgent.risk==='Medium'?'badge-amber':'badge-slate'}" style="margin-left:4px">${esc(state.selectedAgent.risk)} risk</span>
      </div>
      ${state.selectedAgent.progress != null ? `
      <div class="agent-drawer-section">
        <div class="agent-drawer-label">Progress</div>
        <div class="agent-progress-wrap" style="margin-bottom:4px">
          <div class="agent-progress-bar" style="height:4px"><div class="agent-progress-fill" style="width:${Math.min(100,Math.max(0,state.selectedAgent.progress))}%"></div></div>
          <span class="agent-progress-pct">${state.selectedAgent.progress}%</span>
        </div>
        ${state.selectedAgent.tasksCompleted != null ? `<div style="font-size:10px;color:var(--text-tertiary)">${state.selectedAgent.tasksCompleted} done · ${state.selectedAgent.tasksPending||0} pending</div>` : ''}
      </div>` : ''}
      <div class="agent-drawer-section">
        <div class="agent-drawer-label">Current feedback</div>
        <div class="agent-drawer-value">${esc(state.selectedAgent.feedback||'—')}</div>
      </div>
      ${state.selectedAgent.lastActivityAt ? `
      <div class="agent-drawer-section">
        <div class="agent-drawer-label">Last activity</div>
        <div class="agent-drawer-value" style="font-family:var(--font-mono);font-size:10px">${esc(fmtTime(state.selectedAgent.lastActivityAt))}</div>
      </div>` : ''}
      <div class="agent-drawer-section">
        <div class="agent-drawer-label">Recent events</div>
        ${state.feedEvents.filter(e=>e.payload?.agent===state.selectedAgent.id||e.source===state.selectedAgent.id).slice(0,5).map(e=>`
          <div class="feed-entry" style="padding:6px 0;border-bottom:1px solid var(--border-subtle)">
            <div class="feed-entry-header"><span class="feed-entry-ts">${esc(fmtTime(e.timestamp))}</span><span class="feed-entry-type" style="color:${EVENT_META[e.type]?.color||'var(--accent-slate)'}">${esc(e.type||'')}</span></div>
            <div class="feed-entry-msg">${esc(e.payload?.message||'')}</div>
          </div>`).join('') || `<div style="font-size:11px;color:var(--text-tertiary)">No recent events</div>`}
      </div>
    </div>` : '';

  return `
    ${renderSectionHeader('AgentDex',`${agents.length} agent${agents.length!==1?'s':''} in council`,`<button class="btn btn-secondary btn-sm" id="btn-assign-task">+ Assign Task</button>`)}
    <div class="workspace-body" style="padding-bottom:0">
      ${isMock ? mockBanner() : ''}
      ${hermes && !state.agents ? `<div class="hermes-loading"><div class="loading-dot"></div> Loading agents from Hermes…</div>` : ''}
      <div class="filter-strip">${pills}</div>
      <div class="agentdex-layout">
        <div class="agentdex-grid">
          ${filtered.length ? `<div class="grid-auto">${cards}</div>` : `<div class="empty-state"><div class="empty-state-icon">⬢</div><div class="empty-state-title">No agents match</div><button class="btn btn-ghost btn-sm" data-filter="all">Clear filter</button></div>`}
        </div>
        ${drawer}
      </div>
    </div>`;
}

// ── Screen 4: Schedule ─────────────────────────────────────────

// Look up an agent name from state.agents by agentId, falling back gracefully.
function agentNameFromId(agentId) {
  if (!agentId) return null;
  const agents = state.agents || (isHermesConnected() ? [] : MOCK_AGENTS);
  const found = agents.find(a => a.agentId === agentId || a.id === agentId);
  return found?.name || null;
}

// Normalise a raw task or schedule-entry into the shape schedule renderers expect.
function toScheduleItem(t) {
  const agentName = t.agent || t.assignee || agentNameFromId(t.ownerAgentId || t.assignedAgentId) || '—';
  const timeStr = t.time
    || (t.scheduledAt ? new Date(t.scheduledAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '—');
  return {
    scheduledAt: t.scheduledAt || null,
    hourStr:     t.hour || (t.scheduledAt ? String(new Date(t.scheduledAt).getHours()) : null),
    time:        timeStr,
    title:       t.title || t.name || '—',
    agent:       agentName,
    priority:    t.priority || 'Medium',
    status:      t.status || 'Scheduled',
    live:        !!(t.liveAt || t.status === 'Doing')
  };
}

// Fallback: derive schedule items from task list (used only when /schedule not available)
function normalizeScheduleItems(tasks) {
  if (!tasks) return null;
  const scheduled = tasks.filter(t => t.scheduledAt || t.time || t.scheduledFor);
  if (!scheduled.length) return null;
  return scheduled.map(toScheduleItem);
}

function renderAgendaItem(s) {
  return `
    <div class="agenda-item">
      <div class="agenda-time">${esc(s.time)}</div>
      <div class="agenda-body">
        <div class="agenda-title">${esc(s.title)}</div>
        <div class="agenda-meta">${esc(s.agent)} · ${priorityBadge(s.priority)} ${statusBadge(s.status)} ${s.live?`<span class="badge badge-teal" style="margin-left:4px">LIVE</span>`:`<span class="badge badge-slate" style="margin-left:4px">SCHEDULED</span>`}</div>
      </div>
    </div>`;
}

function renderScheduleAgenda(items, hermes, totalUnscheduled) {
  if (!items || !items.length) return `
    <div class="empty-state">
      <div class="empty-state-icon">◷</div>
      <div class="empty-state-title">${hermes ? 'No scheduled tasks' : 'No tasks with schedule data'}</div>
      <div class="empty-state-msg">
        ${hermes
          ? `${totalUnscheduled != null ? `${totalUnscheduled} tasks without scheduledAt. ` : ''}Create a scheduled task with + New Task.`
          : 'Connect Hermes and add tasks with scheduledAt to see the live schedule.'}
      </div>
    </div>`;
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Today — ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</span>
        <span class="badge ${hermes?'badge-teal':'badge-blue'}">${items.length} task${items.length!==1?'s':''}${hermes?' · LIVE':''}</span>
      </div>
      ${items.map(s => renderAgendaItem(s)).join('')}
    </div>`;
}

function renderScheduleDay(agendaItems, dayViewMap) {
  const HOURS = Array.from({length:17}, (_,i) => i + 6); // 6..22
  const now = new Date();
  const nowH = now.getHours();
  const todayKey = now.toISOString().slice(0, 10);

  // Prefer the structured day map from /schedule; fall back to scanning agenda items
  let tasksByHour = {};
  if (dayViewMap && dayViewMap[todayKey]) {
    // Backend format: { "YYYY-MM-DD": [{ id, title, hour: "14", ... }] }
    for (const item of dayViewMap[todayKey]) {
      const h = parseInt(item.hour, 10);
      if (!isNaN(h)) { (tasksByHour[h] = tasksByHour[h] || []).push(toScheduleItem(item)); }
    }
  } else if (agendaItems?.length) {
    // Fallback: derive from agenda items
    for (const item of agendaItems) {
      const h = item.scheduledAt ? new Date(item.scheduledAt).getHours() : null;
      if (h != null) { (tasksByHour[h] = tasksByHour[h] || []).push(item); }
    }
  }

  const totalToday = Object.values(tasksByHour).reduce((sum, arr) => sum + arr.length, 0);
  return `
    <div class="card" style="padding:0;overflow:hidden">
      <div class="card-header" style="padding:12px 14px">
        <span class="card-title">Day — ${now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</span>
        <span class="badge badge-slate">${totalToday} scheduled today</span>
      </div>
      <div class="schedule-day-grid" style="padding:0 12px 16px">
        ${HOURS.map(h => {
          const isNow = h === nowH;
          const label = `${h%12||12}${h<12?'a':'p'}`;
          const hourItems = tasksByHour[h] || [];
          return `
            <div class="schedule-day-hour ${isNow?'now-row':''}">
              ${isNow?`<div class="schedule-now-stripe"></div>`:''}
              <div class="schedule-day-hour-label">${label}</div>
              <div class="schedule-day-tasks">
                ${hourItems.map(i=>`
                  <div class="schedule-day-task priority-${(i.priority||'medium').toLowerCase()}">
                    <span style="flex:1">${esc(i.title)}</span>
                    <span class="schedule-day-task-agent">${esc(i.agent||'—')}</span>
                  </div>`).join('')}
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

function renderScheduleWeek(agendaItems, weekViewMap) {
  const today    = new Date();
  const todayIdx = today.getDay(); // 0=Sun
  const DAY_ABBR   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const DAY_FULL   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  const cols = DAY_ABBR.map((abbr, i) => {
    const diff = i - todayIdx;
    const d = new Date(today);
    d.setDate(today.getDate() + diff);
    const isToday = i === todayIdx;

    let dayItems = [];
    if (weekViewMap && weekViewMap[DAY_FULL[i]]) {
      // Backend format: { "Monday": [...tasks] }
      dayItems = weekViewMap[DAY_FULL[i]].map(toScheduleItem);
    } else if (agendaItems?.length) {
      // Fallback: filter agenda by date
      const dStr = d.toISOString().slice(0, 10);
      dayItems = agendaItems.filter(item => item.scheduledAt?.startsWith(dStr));
    }
    return { abbr, date: d, isToday, items: dayItems };
  });

  const hasAny = cols.some(c => c.items.length);
  return `
    <div class="card" style="padding:0;overflow:hidden">
      <div class="card-header" style="padding:12px 14px">
        <span class="card-title">Week of ${cols[0].date.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${cols[6].date.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
        ${!hasAny ? `<span class="badge badge-slate">No items this week</span>` : ''}
      </div>
      <div class="schedule-week-grid" style="padding:12px">
        ${cols.map(c => `
          <div class="schedule-week-day ${c.isToday?'today':''}">
            <div class="schedule-week-day-header">
              ${c.abbr} <span class="schedule-week-day-date">${c.date.getDate()}</span>
            </div>
            ${c.items.length ? c.items.map(i=>`
              <div class="schedule-week-task">
                <div class="schedule-week-task-title">${esc(i.title)}</div>
                <div class="schedule-week-task-time">${esc(i.time||'—')}</div>
              </div>`).join('') : `<div class="schedule-week-empty">—</div>`}
          </div>`).join('')}
      </div>
      ${!hasAny ? `<div style="padding:0 12px 12px;font-size:11px;color:var(--text-tertiary);text-align:center">Tasks need a <code>scheduledAt</code> ISO date to appear in Week view.</div>` : ''}
    </div>`;
}

function renderSchedule() {
  const hermes = isHermesConnected();
  const view   = state.scheduleView || 'agenda';

  // Source priority:
  // 1. state.schedule.viewData (from GET /api/misato/schedule — richest)
  // 2. normalizeScheduleItems(state.tasks) (tasks with scheduledAt)
  // 3. MOCK_SCHEDULE (when fully disconnected)
  const hasLiveSchedule = state.schedule !== null;
  const vd = state.schedule?.viewData || null;
  const isMock = !hasLiveSchedule && !state.tasks && !hermes;

  // For Agenda: use backend agenda array, or fall back to derived items
  const agendaItems = hasLiveSchedule
    ? (Array.isArray(vd?.agenda) ? vd.agenda.map(toScheduleItem) : [])
    : (normalizeScheduleItems(state.tasks) || (!hermes ? MOCK_SCHEDULE : []));
  const unscheduled = state.schedule?.unscheduledTasks ?? null;

  let content;
  if (view === 'day') {
    content = renderScheduleDay(agendaItems, vd?.day || null);
  } else if (view === 'week') {
    content = renderScheduleWeek(agendaItems, vd?.week || null);
  } else {
    content = renderScheduleAgenda(agendaItems, hermes, unscheduled);
  }

  const viewLabel = view.charAt(0).toUpperCase() + view.slice(1);
  return `
    ${renderSectionHeader('Schedule',`${viewLabel} view`,`
      <div class="schedule-view-toggle">
        <button class="view-toggle-btn ${view==='day'?'active':''}"    data-schedview="day">Day</button>
        <button class="view-toggle-btn ${view==='agenda'?'active':''}" data-schedview="agenda">Agenda</button>
        <button class="view-toggle-btn ${view==='week'?'active':''}"   data-schedview="week">Week</button>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-add-task" style="margin-left:8px">+ New Task</button>`)}
    <div class="workspace-body">
      ${isMock ? mockBanner('connect Hermes for live schedule') : ''}
      ${hermes && !hasLiveSchedule && !state.tasks ? `<div class="hermes-loading"><div class="loading-dot"></div> Loading schedule from Hermes…</div>` : ''}
      ${hermes && hasLiveSchedule && !agendaItems.length
          ? `<div class="waiting-hermes">◎ Hermes connected · ${unscheduled ?? 0} task${unscheduled !== 1 ? 's' : ''} without <code>scheduledAt</code>. Use + New Task to create a scheduled item.</div>`
          : ''}
      ${content || ''}
    </div>`;
}

// ── Screen 5: Kanban ───────────────────────────────────────────
function renderKanban() {
  const hermes = isHermesConnected();
  const tasks  = state.tasks || (hermes ? [] : MOCK_TASKS);
  const isMock = !state.tasks && !hermes;
  const cols   = ['Done','Doing','Blocked','Idea'];
  const board  = cols.map(col => {
    const colTasks = tasks.filter(t=>t.status===col);
    const cls = col==='Doing'?'badge-blue':col==='Done'?'badge-teal':col==='Blocked'?'badge-red':'badge-slate';
    return `
      <div class="kanban-col">
        <div class="kanban-col-header">
          <span class="kanban-col-title">${esc(col)}</span>
          <span class="kanban-col-count badge ${cls}">${colTasks.length}</span>
        </div>
        ${colTasks.map(t=>{
          const left = t.status==='Blocked'?'blocked':t.priority==='High'?'high':t.status==='Done'?'done':'';
          const statuses = ['Idea','Doing','Blocked','Done'];
          const priorities = ['Low','Medium','High'];
          const nextStatus = statuses[(statuses.indexOf(t.status)+1) % statuses.length];
          const nextPriority = priorities[(priorities.indexOf(t.priority)+1) % priorities.length];
          return `
            <div class="kanban-card ${left}">
              <div class="kanban-card-title">${esc(t.title)}</div>
              <div class="kanban-card-footer">
                <span class="kanban-card-agent">${esc(t.agent || t.assignedAgentId || '—')}</span>
                ${priorityBadge(t.priority)}
              </div>
              ${t.status==='Blocked'?`<div class="kanban-card-blocker">⚠ Blocked${t.linkedApprovalId?' — approval pending':' — requires approval'}</div>`:''}
              <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px">${esc(t.project || t.projectId || '—')}</div>
              <div class="kanban-card-actions">
                <button class="kc-action" data-task-id="${esc(t.id)}" data-task-status="${esc(nextStatus)}" title="Move to ${nextStatus}">→ ${esc(nextStatus)}</button>
                <button class="kc-action" data-task-id="${esc(t.id)}" data-task-priority="${esc(nextPriority)}" title="Set ${nextPriority}">${esc(nextPriority)} ↑</button>
                <button class="kc-action kc-delete" data-task-id="${esc(t.id)}" data-task-delete="1" title="Delete task">✕</button>
              </div>
            </div>`;
        }).join('') || `<div style="padding:12px;font-size:11px;color:var(--text-tertiary);text-align:center">No tasks</div>`}
      </div>`;
  }).join('');
  return `
    ${renderSectionHeader('Kanban',`${tasks.length} total tasks`,`<button class="btn btn-primary btn-sm" id="btn-add-task">+ Add Task</button>`)}
    <div class="workspace-body" style="padding-bottom:0">
      ${isMock ? mockBanner() : ''}
      <div class="kanban-board">${board}</div>
    </div>`;
}

// ── Screen 6: Watchtower ───────────────────────────────────────
function renderWatchtower() {
  const hermes  = isHermesConnected();
  const h       = state.hermesHealth;
  const agents  = state.agents || (hermes ? [] : MOCK_AGENTS);
  const tasks   = state.tasks  || (hermes ? [] : MOCK_TASKS);
  const wt      = state.watchtower || (hermes ? { services: [] } : MOCK_WATCHTOWER);
  const isMock  = !state.watchtower && !hermes;

  const ctx = state.runtimeCtx || {};
  const tiles = [
    { label:'Hermes',       value: hermes?'Connected':'Offline',           sub: hermes ? `${state.hermesHost}:${state.hermesPort}` : 'Start npm run dev',       cls: hermes?'ok':'bad'  },
    { label:'SSE Stream',   value: state.sseState==='connected'?'Live':state.sseState==='connecting'?'Connecting':'Offline', sub: state.sseState==='connected'?`${state.feedEvents.length} events`:'Polling fallback',  cls: state.sseState==='connected'?'ok':''  },
    { label:'Auth Gate',    value: hermes ? 'Local Solo' : state.token?'Token':'Not set', sub: hermes ? 'No token required' : 'x-misato-desktop-token',         cls: hermes?'ok':state.token?'ok':'' },
    { label:'Queue Depth',  value: hermes && !state.tasks ? '…' : tasks.filter(t=>t.status==='Doing').length, sub:tasks.filter(t=>t.status==='Blocked').length?`${tasks.filter(t=>t.status==='Blocked').length} blocked`:'No blockers', cls:tasks.filter(t=>t.status==='Blocked').length?'warn':'' },
    { label:'Runtime Mode', value: ctx.runtimeMode || (hermes ? 'LOCAL' : 'OFFLINE'), sub: hermes ? `v${state.hermesHealth?.version||'?'} · uptime ${fmtUptime(state.hermesHealth?.uptime)}` : 'Not connected', cls: hermes?'ok':'' }
  ].map(t=>`
    <div class="health-tile ${t.cls||''}">
      <div class="health-tile-label">${esc(t.label)}</div>
      <div class="health-tile-value" style="font-size:16px">${esc(String(t.value))}</div>
      <div class="health-tile-sub">${esc(t.sub)}</div>
    </div>`).join('');

  const services = (wt.services || (hermes ? [] : MOCK_WATCHTOWER.services)).map(s=>`
    <div class="wt-service-row">
      <div class="auth-mode-led" style="background:${s.ok===true?'var(--accent-teal)':s.ok===false?'var(--accent-amber)':'var(--surface-4)'}"></div>
      <div class="wt-service-name">${esc(s.name)}</div>
      <div class="wt-service-meta">${esc(s.meta||'')}</div>
    </div>`).join('');

  const agentGrid = agents.map(a=>{
    const initials = a.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
    const color = a.state==='active'||a.state==='complete'?'var(--accent-teal)':a.state==='thinking'?'var(--accent-blue)':a.state==='blocked'?'var(--accent-red)':'var(--surface-4)';
    return `<div class="wt-agent-tile">
      <div class="auth-mode-led" style="background:${color};width:8px;height:8px"></div>
      <div class="wt-agent-initials">${esc(initials)}</div>
      <div class="wt-agent-name">${esc(a.name.split(' ')[0])}</div>
    </div>`;
  }).join('');

  return `
    ${renderSectionHeader('Watchtower','Health and observability',`<button class="btn btn-secondary btn-sm" id="btn-refresh">Refresh</button>`)}
    <div class="workspace-body">
      ${isMock?mockBanner():''}
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:16px">${tiles}</div>
      <div class="grid-2 section-gap">
        <div class="card" style="padding:0">
          <div class="card-header" style="padding:12px 14px"><span class="card-title">Service Status</span></div>
          ${services}
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Agent State Map</span><span class="badge badge-slate">${agents.length} agents</span></div>
          <div class="wt-agent-grid">${agentGrid}</div>
        </div>
      </div>
      <div class="card" style="padding:0">
        <div class="card-header" style="padding:12px 14px"><span class="card-title">Recent Incidents</span></div>
        ${(() => {
          // Priority: SSE risk_detected events → live logs → mock logs
          const sseRisks = state.feedEvents.filter(e=>e.type==='risk_detected').slice(0,6);
          if (sseRisks.length) {
            return sseRisks.map(e=>`
              <div class="wt-service-row">
                <span class="log-ts">${esc(fmtTime(e.timestamp))}</span>
                <span class="badge badge-red">RISK</span>
                <span style="flex:1;font-size:11px;color:var(--text-secondary)">${esc(e.payload?.message||e.payload?.action||'')}</span>
              </div>`).join('');
          }
          const fallbackLogs = state.logs || (hermes ? [] : MOCK_LOGS);
          const incidents    = fallbackLogs.filter(l=>{
            const sev = (l.sev||l.level||l.severity||'').toLowerCase();
            return sev==='warn'||sev==='warning'||sev==='error';
          }).slice(0,6);
          return incidents.map(l=>{
            const sev = (l.sev||l.level||l.severity||'info').toLowerCase();
            return `
              <div class="wt-service-row">
                <span class="log-ts">${esc(l.ts||fmtTime(l.timestamp))}</span>
                <span class="badge ${sev==='error'?'badge-red':'badge-amber'}">${sev.toUpperCase()}</span>
                <span class="log-src">${esc(l.src||l.source||'')}</span>
                <span style="flex:1;font-size:11px;color:var(--text-secondary)">${esc(l.action||l.message||l.msg||'')}</span>
              </div>`;
          }).join('') || '<div style="padding:12px;font-size:12px;color:var(--accent-teal)">◉ No recent incidents</div>';
        })()}
      </div>
    </div>`;
}

// ── Screen 7: Secret Sentinel ──────────────────────────────────
function renderSentinel() {
  const hermes = isHermesConnected();
  const data   = state.sentinel || (hermes ? { findings: [], remediation: [], gitleaksInstalled: null, scanAvailable: true, lastScanAt: null } : MOCK_SENTINEL);
  const isMock = !state.sentinel && !hermes;
  const { findings, lastScanAt } = data;
  const gitleaksInstalled = data.gitleaksInstalled;
  const scanAvailable     = data.scanAvailable !== false; // default true unless explicitly false
  const critical = data.critical ?? (findings||[]).filter(f=>['critical','error'].includes((f.sev||'').toLowerCase())).length;
  const high     = data.high     ?? (findings||[]).filter(f=>f.sev?.toLowerCase()==='high').length;
  const warnings = data.warnings ?? (findings||[]).filter(f=>f.sev?.toLowerCase()==='warn').length;
  // Hermes may return remediation as a string or array — normalize defensively.
  const remediation = Array.isArray(data.remediation)
    ? data.remediation
    : typeof data.remediation === 'string'
      ? [{ label: data.remediation, done: false }]
      : [];
  const done = remediation.filter(c => c.done).length;

  const statusPanel = hermes ? `
    <div class="card" style="padding:0;margin-bottom:16px">
      <div class="card-header" style="padding:10px 14px"><span class="card-title">Scan Status</span></div>
      <div class="sentinel-status-row">
        <div class="auth-mode-led ${gitleaksInstalled===true?'on':gitleaksInstalled===false?'':''}"></div>
        <span class="sentinel-status-label">Gitleaks binary</span>
        <span class="badge ${gitleaksInstalled===true?'badge-teal':gitleaksInstalled===false?'badge-red':'badge-slate'}">
          ${gitleaksInstalled===true?'Installed':gitleaksInstalled===false?'Not found':'Unknown'}
        </span>
      </div>
      <div class="sentinel-status-row">
        <div class="auth-mode-led ${scanAvailable?'on':''}"></div>
        <span class="sentinel-status-label">Scan endpoint</span>
        <span class="badge ${scanAvailable?'badge-teal':'badge-amber'}">${scanAvailable?'Available':'Unavailable'}</span>
      </div>
      <div class="sentinel-status-row">
        <div class="auth-mode-led on"></div>
        <span class="sentinel-status-label">Secret values in UI</span>
        <span class="badge badge-teal">Hidden — [REDACTED]</span>
      </div>
      ${gitleaksInstalled===false ? `
      <div class="sentinel-scan-state">
        <span style="color:var(--accent-amber)">⚠</span>
        <span>Gitleaks not installed. Install via: <code>brew install gitleaks</code> or download from gitleaks.io</span>
      </div>` : ''}
    </div>` : '';

  return `
    ${renderSectionHeader('Secret Sentinel','Security scan — repo scope only',`<button class="btn btn-secondary btn-sm" id="btn-scan-now" ${!hermes||!scanAvailable?'disabled title="Hermes must be running with scan endpoint"':''}>Scan Now</button>`)}
    <div class="workspace-body">
      ${isMock ? mockBanner('connect Hermes for live scan results') : ''}
      ${hermes && !state.sentinel ? `<div class="hermes-loading"><div class="loading-dot"></div> Loading scan status from Hermes…</div>` : ''}
      ${statusPanel}
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
        ${[
          {l:'Critical', v: critical, c: critical>0?'bad':'ok'},
          {l:'High',     v: high,     c: high>0?'warn':'ok'},
          {l:'Warnings', v: warnings, c: warnings>0?'warn':''},
          {l:'Last Scan', v: lastScanAt ? fmtTime(lastScanAt) : '—', c:''}
        ].map(t=>`
          <div class="health-tile ${t.c}">
            <div class="health-tile-label">${esc(t.l)}</div>
            <div class="health-tile-value" style="font-size:16px">${esc(String(t.v))}</div>
          </div>`).join('')}
      </div>
      <div class="sentinel-layout">
        <div class="card" style="padding:0">
          <div class="card-header" style="padding:12px 14px">
            <span class="card-title">Findings</span>
            <span style="font-size:10px;color:var(--text-tertiary)">Secret values never displayed · [REDACTED] only</span>
          </div>
          ${(findings||[]).length ? (findings||[]).map(f=>{
            const sev = (f.sev || f.severity || 'info').toLowerCase();
            return `
            <div class="sentinel-row">
              <span class="badge ${sev==='warn'||sev==='warning'?'badge-amber':sev==='error'||sev==='critical'||sev==='high'?'badge-red':'badge-slate'}">${sev.toUpperCase()}</span>
              <div class="sentinel-row-info">
                <div class="sentinel-row-title">${esc(f.title || f.ruleId || f.rule || '—')}</div>
                <div class="sentinel-row-path">${esc(f.loc || f.file || '—')}${f.line ? `:${f.line}` : ''}</div>
              </div>
              <div class="col gap-4" style="align-items:flex-end">
                <span class="badge ${f.status==='OK'?'badge-teal':f.status==='Confirmed'?'badge-amber':'badge-slate'}">${esc(f.status||'found')}</span>
                <span class="sentinel-row-age">${esc(f.age||'')}</span>
              </div>
            </div>`}).join('') : `<div style="padding:16px;text-align:center;font-size:12px;color:var(--accent-teal)">◉ No findings${hermes?' — last scan clean':' — run scan to check'}</div>`}
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Remediation</span><span class="badge ${done===(remediation||[]).length&&done>0?'badge-teal':'badge-slate'}">${done}/${(remediation||[]).length}</span></div>
          ${(remediation||[]).length ? (remediation||[]).map(c=>`
            <div class="remediation-item ${c.done?'done':''}">
              <span class="remediation-check">${c.done?'✓':'○'}</span>
              <span>${esc(c.label)}</span>
            </div>`).join('') : `<div style="padding:12px;font-size:11px;color:var(--text-tertiary)">No checklist — run Hermes scan for recommendations.</div>`}
        </div>
      </div>
    </div>`;
}

// ── Screen 8: Logs ─────────────────────────────────────────────
function renderLogs() {
  const hermes  = isHermesConnected();
  const allLogs = state.logs || (hermes ? [] : MOCK_LOGS);
  const isMock  = !state.logs && !hermes;
  const filterDefs = [
    { id:'all',   label:'ALL',   cls:'badge-slate' },
    { id:'info',  label:'INFO',  cls:'' },
    { id:'warn',  label:'WARN',  cls:'badge-amber' },
    { id:'error', label:'ERROR', cls:'badge-red' }
  ];
  const filtered = state.logFilter === 'all' ? allLogs : allLogs.filter(l => {
    const sev = (l.sev||l.level||l.severity||'info').toLowerCase();
    if (state.logFilter === 'warn')  return sev === 'warn' || sev === 'warning';
    if (state.logFilter === 'error') return sev === 'error';
    if (state.logFilter === 'info')  return sev === 'info';
    return true;
  });
  const rows = filtered.map(l => {
    const sev = (l.sev||l.level||l.severity||'info').toLowerCase();
    return `
    <tr>
      <td class="log-ts">${esc(l.ts||fmtTime(l.timestamp))}</td>
      <td class="log-src">${esc(l.src||l.source||'—')}</td>
      <td><span class="badge ${sev==='error'?'badge-red':sev==='warn'||sev==='warning'?'badge-amber':'badge-slate'}">${sev.toUpperCase()}</span></td>
      <td style="font-size:11px;color:var(--text-secondary)">${esc(l.agent||'—')}</td>
      <td class="log-msg">${esc(l.action||l.message||l.msg||'')}</td>
    </tr>`;
  }).join('');
  const filterStrip = filterDefs.map(f => `
    <button class="filter-pill ${state.logFilter===f.id?'active':''} ${f.cls}" data-logfilter="${f.id}" style="padding:2px 8px;font-size:10px">${f.label}</button>`).join('');
  return `
    ${renderSectionHeader('Logs',`${filtered.length} / ${allLogs.length} entries`,`<button class="btn btn-secondary btn-sm" id="btn-refresh">Refresh</button>`)}
    <div class="workspace-body" style="padding:0">
      ${isMock ? `<div style="border-radius:0">${mockBanner()}</div>` : ''}
      <div style="padding:8px 12px;border-bottom:1px solid var(--border-subtle);display:flex;gap:6px;background:var(--surface-1);align-items:center">
        ${filterStrip}
      </div>
      <div style="overflow:auto;max-height:calc(100vh - 200px)">
        <table class="log-table">
          <thead><tr><th style="width:80px">Time</th><th style="width:100px">Source</th><th style="width:70px">Sev</th><th style="width:100px">Agent</th><th>Message</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" style="padding:16px;text-align:center;color:var(--text-tertiary)">No entries match this filter</td></tr>'}</tbody>
        </table>
      </div>
    </div>`;
}

// ── Screen 9: Integrations ─────────────────────────────────────
function buildLiveIntegrations() {
  const hermes    = isHermesConnected();
  const h         = state.hermesHealth;
  const sseUp     = state.sseState === 'connected';
  const tokenSet  = !!state.token;
  const bypassSet = !!state.bypassToken;
  // Build a live-aware copy of the integrations list
  return INTEGRATIONS.map(i => {
    if (i.name === 'Local Hermes Bridge') {
      return {
        ...i,
        mode: hermes ? 'active' : 'planned',
        desc: hermes
          ? `Connected · ${state.hermesHost}:${state.hermesPort}${h?.version ? ' · v' + h.version : ''}${h?.uptime != null ? ' · ↑' + fmtUptime(h.uptime) : ''}. SSE ${sseUp ? 'live' : 'reconnecting'}.`
          : `Not running · Start with npm run dev at ${state.hermesHost}:${state.hermesPort}`,
        next: hermes ? 'Running — no action needed' : 'Start Hermes runtime, then click Find Hermes'
      };
    }
    if (i.name === 'Vercel Preview') {
      const previewState = state.connTest.label;
      const isPreviewUp  = previewState === 'Connected';
      return {
        ...i,
        mode: isPreviewUp ? 'active' : (tokenSet || bypassSet ? 'ready' : 'planned'),
        desc: isPreviewUp
          ? `Preview connected · ${state.baseUrl}`
          : tokenSet
            ? `Token configured · Last test: ${previewState}`
            : 'Not configured — see Advanced in Settings.',
        next: isPreviewUp ? 'Connected · optional when Hermes is local' : previewState !== 'Not configured' ? `Fix: ${state.connTest.nextFix || previewState}` : 'Open Settings → Advanced to configure'
      };
    }
    return i;
  });
}

function renderIntegrations() {
  const items = buildLiveIntegrations();
  const modeBadge = m => {
    const map = { active:'badge-teal', ready:'badge-blue', mock:'badge-slate', planned:'badge-amber' };
    return `<span class="badge ${map[m]||'badge-slate'}">${m.toUpperCase()}</span>`;
  };
  const cards = items.map(i=>`
    <div class="integration-card">
      <div class="integration-card-top">
        <div class="row gap-8"><span class="integration-icon">${i.icon}</span><div class="integration-name">${esc(i.name)}</div></div>
        ${modeBadge(i.mode)}
      </div>
      <div class="integration-desc">${esc(i.desc)}</div>
      <div class="integration-next">→ ${esc(i.next)}</div>
      <div class="integration-actions">
        <button class="btn btn-secondary btn-sm">Configure</button>
        ${i.mode==='active'?`<button class="btn btn-ghost btn-sm">Test</button>`:''}
      </div>
    </div>`).join('');
  const activeCount = items.filter(i=>i.mode==='active').length;
  return `
    ${renderSectionHeader('Integrations',`${activeCount} active`,`<button class="btn btn-primary btn-sm">+ Add</button>`)}
    <div class="workspace-body"><div class="grid-2">${cards}</div></div>`;
}

// ── Screen 10: Lanes ───────────────────────────────────────────
// Maps backend lane item to the shape renderLanes() expects.
function normalizeLaneItem(lane) {
  const idSuffix = String(lane.id || '').replace(/^lane-/, '');
  const st = String(lane.status || 'ready').toLowerCase();
  const blockers = Array.isArray(lane.blockers) && lane.blockers.length
    ? lane.blockers.map(b => typeof b === 'string' ? b : (b.title || String(b))).join(', ')
    : (typeof lane.blockers === 'string' ? lane.blockers : 'None');
  return {
    id:          lane.id || idSuffix,
    cls:         idSuffix || 'default',
    name:        lane.name || '—',
    branch:      lane.branch || '—',
    status:      lane.status || 'ready',
    statusCls:   st === 'active'   ? 'badge-teal'
               : st === 'blocked'  ? 'badge-red'
               : st === 'thinking' ? 'badge-blue'
               : 'badge-slate',
    currentTask: lane.current || lane.currentTask || '—',
    lastHandoff: lane.lastHandoff || (lane.tasksDone != null ? `${lane.tasksDone}/${lane.tasksTotal || '?'} tasks done` : '—'),
    blockers,
    next:        lane.next || '—',
    owns:        Array.isArray(lane.owns)
                   ? lane.owns
                   : [lane.ownerAgentName || lane.ownerAgentId || '—']
  };
}

function buildLiveLanes() {
  // Priority 1: dedicated /lanes endpoint — returns rich lane data
  if (state.lanes !== null) {
    const items = Array.isArray(state.lanes?.items) ? state.lanes.items : [];
    return items.map(normalizeLaneItem);
  }
  // Priority 2: agents with branch/lane fields (enriched by Hermes)
  if (state.agents?.length) {
    const branchAgents = state.agents.filter(a => a.branch || a.lane);
    if (branchAgents.length) {
      return branchAgents.map(a => ({
        id:          a.id,
        cls:         String(a.id || '').split('-').pop() || 'default',
        name:        a.name,
        branch:      a.branch || a.lane || '—',
        status:      a.state || 'unknown',
        statusCls:   a.state==='active'?'badge-teal':a.state==='blocked'?'badge-red':a.state==='thinking'?'badge-blue':'badge-slate',
        currentTask: a.feedback || '—',
        blockers:    a.blockers || 'None',
        next:        a.nextAction || '—',
        owns:        Array.isArray(a.owns) ? a.owns : [a.role||a.specialty||'—']
      }));
    }
  }
  return isHermesConnected() ? [] : null;
}

function renderLanes() {
  const liveLanes  = buildLiveLanes();
  const hermes     = isHermesConnected();
  const lanes      = liveLanes ?? (hermes ? [] : AGENT_LANES);
  const isMock     = liveLanes === null;
  const cards = lanes.map(l=>`
    <div class="lane-card ${l.cls}">
      <div class="row-between">
        <div><div class="lane-name">${esc(l.name)}</div><div class="lane-branch">${esc(l.branch)}</div></div>
        <span class="badge ${l.statusCls}">${esc(l.status)}</span>
      </div>
      <div class="col gap-4">
        <div class="lane-task"><span style="color:var(--text-tertiary);font-size:10px;font-weight:600;text-transform:uppercase">Current</span><br>${esc(l.currentTask)}</div>
        ${l.blockers && l.blockers!=='None'?`<div style="font-size:11px;color:var(--accent-amber)">⚠ ${esc(l.blockers)}</div>`:''}
        <div style="font-size:11px;color:var(--text-secondary)">Next: ${esc(l.next)}</div>
      </div>
      <div class="lane-owns">${(l.owns||[]).map(o=>`<span class="lane-owns-tag">${esc(o)}</span>`).join('')}</div>
    </div>`).join('');
  return `
    ${renderSectionHeader('Lanes',`${lanes.length} lane${lanes.length!==1?'s':''}${isMock?' · static manifest':' · live'}`)}
    <div class="workspace-body">
      ${isMock ? mockBanner('connect Hermes for live lane state') : ''}
      ${hermes && !state.lanes ? `<div class="waiting-hermes">◎ Hermes connected — waiting on live lane records. No static manifest is shown while Hermes is up.</div>` : ''}
      ${lanes.length ? `<div class="grid-2">${cards}</div>` : `<div class="empty-state"><div class="empty-state-icon">⟂</div><div class="empty-state-title">No live lanes yet</div><div class="empty-state-msg">${hermes ? 'Hermes is connected but has not published lane records yet.' : 'Connect Hermes to load lane records.'}</div></div>`}
    </div>`;
}

// ── Screen 11: Approvals ───────────────────────────────────────
function normalizeApproval(a) {
  const risk   = a.riskLevel || a.risk || 'Low';
  const status = (a.status || 'pending').toLowerCase();
  return {
    ...a,
    id:          a.id || `apr-${Date.now()}-${Math.random()}`,
    title:       a.title || a.actionType || a.action || 'Approval Required',
    description: a.description || a.details || a.reason || a.summary || '—',
    risk,
    status,
    // Field name varies by source:
    // runtime-created: requestedByAgentId (no name) | seed data: requestedAgent
    agentName:    a.requestedAgent || a.requestedByAgentName || a.agentName || a.agent || a.requestedByAgentId || '—',
    requestedAt:  a.requestedAt || a.createdAt || '—',
    decisionAt:   a.decisionAt || a.resolvedAt || null,
    doesNotAutoExecute: !!(a.safeExecutionMode || a.doesNotAutoExecuteProduction)
  };
}

function renderApprovals() {
  const hermes      = isHermesConnected();
  const rawApprovals = state.approvals || (hermes ? [] : MOCK_APPROVALS);
  const isMock       = !state.approvals && !hermes;
  const normalized   = rawApprovals.map(normalizeApproval);
  // Deduplicate: same id appearing multiple times (approval spam) → keep only the latest
  const deduped = [];
  const seenIds = new Set();
  for (const a of normalized) {
    if (!seenIds.has(a.id)) { seenIds.add(a.id); deduped.push(a); }
  }

  const filter       = state.approvalFilter || 'pending';
  const pendingCount = deduped.filter(a => a.status === 'pending').length;

  const filtered = filter === 'all'
    ? deduped.filter(a => a.status !== 'superseded')
    : filter === 'superseded'
      ? deduped.filter(a => a.status === 'superseded')
      : deduped.filter(a => a.status === filter);

  const filterBtns = [
    { id:'pending',   label:`Pending${pendingCount ? ` (${pendingCount})` : ''}` },
    { id:'approved',  label:'Approved' },
    { id:'rejected',  label:'Rejected' },
    { id:'deferred',  label:'Deferred' },
    { id:'all',       label:'All' }
  ];

  const cards = filtered.map(a => {
    const isPending  = a.status === 'pending';
    // Bug fix: normalizeApproval() returns .riskLevel not .risk — read the correct field
    const riskLabel  = a.riskLevel || a.risk || 'Low';
    const riskLower  = riskLabel.toLowerCase();
    const riskBadge  = riskLower==='high'?'badge-red':riskLower==='medium'?'badge-amber':'badge-slate';
    // requestedAt may come from seed data; createdAt from live records
    const reqTime    = a.requestedAt && a.requestedAt !== '—'
      ? fmtTime(a.requestedAt) || a.requestedAt
      : (a.createdAt ? fmtTime(a.createdAt) : '—');
    // Bug fix: safe mode badge reads safeExecutionMode (normalizeApproval output),
    // not doesNotAutoExecute (raw backend field that doesn't survive normalization)
    const isSafe = !!a.safeExecutionMode;
    return `
      <div class="approval-card ${riskLower} ${isPending?'':''+a.status}">
        <div class="row-between mb-4">
          <div class="row gap-8">
            <span class="badge ${riskBadge}">⚠ ${esc(riskLabel)} Risk</span>
            ${!isPending ? `<span class="badge ${a.status==='approved'?'badge-teal':a.status==='rejected'?'badge-red':'badge-slate'}">${esc(a.status)}</span>` : ''}
          </div>
          <span style="font-size:10px;color:var(--text-tertiary)">${esc(reqTime)}</span>
        </div>
        <div class="approval-title">${esc(a.title)}</div>
        <div class="approval-agent">Requested by <strong>${esc(a.agentName)}</strong></div>
        <div style="font-size:11px;color:var(--text-secondary);line-height:1.5;margin-bottom:8px">${esc(a.description)}</div>
        ${isSafe ? `<div class="approval-safe-badge">◉ Safe mode — will not auto-execute production actions</div>` : ''}
        ${isPending ? `
          <div class="approval-actions">
            <button class="btn btn-primary btn-sm" data-approve="${esc(a.id)}">Approve</button>
            <button class="btn btn-danger btn-sm"  data-reject="${esc(a.id)}">Reject</button>
            <button class="btn btn-ghost btn-sm"   data-defer="${esc(a.id)}">Defer</button>
          </div>` : `
          <div class="approval-decision-note">
            ${a.decisionAt ? `Decision: ${fmtTime(a.decisionAt)}` : `Status: ${esc(a.status)}`}
            ${a.decidedBy ? ` · by ${esc(a.decidedBy)}` : ''}
          </div>`}
      </div>`;
  }).join('');

  return `
    ${renderSectionHeader('Approvals',
      `${pendingCount} pending · ${deduped.length} total`,
      `<span class="badge ${pendingCount?'badge-amber':'badge-teal'}">${pendingCount} pending</span>`
    )}
    <div class="workspace-body">
      ${isMock ? mockBanner() : ''}
      ${hermes && !state.approvals ? `<div class="hermes-loading"><div class="loading-dot"></div> Loading approvals from Hermes…</div>` : ''}
      <div class="approval-filter-strip">
        ${filterBtns.map(f=>`<button class="approval-filter-btn ${filter===f.id?'active':''}" data-apprfilter="${f.id}">${f.label}</button>`).join('')}
      </div>
      ${filtered.length ? cards : `
        <div class="empty-state">
          <div class="empty-state-icon">◆</div>
          <div class="empty-state-title" style="color:var(--accent-teal)">
            ${filter==='pending' ? 'No pending approvals' : `No ${filter} approvals`}
          </div>
          <div class="empty-state-msg">
            ${filter==='pending' ? 'All gates clear.' : 'Nothing to show for this filter.'}
          </div>
          ${filter!=='pending' ? `<button class="btn btn-ghost btn-sm" data-apprfilter="pending">← Back to pending</button>` : ''}
        </div>`}
    </div>`;
}

// ── Screen 12: Obsidian Mirror ─────────────────────────────────
function renderObsidian() {
  const hermes     = isHermesConnected();
  const obsData    = state.runtimeCtx?.obsidian || null;
  const vaultConfigured = !!(obsData?.vaultPath || obsData?.configured);
  const lastSync   = obsData?.lastSync || null;
  const folder     = OBSIDIAN_FOLDERS[state.obsidianFolder];

  const tree = OBSIDIAN_FOLDERS.map((f,i)=>`
    <div class="obsidian-folder ${i===state.obsidianFolder?'active':''}" data-obfolder="${i}">
      <span>⬡</span><span style="flex:1">${esc(f.name)}</span><span class="obsidian-count">${f.count}</span>
    </div>`).join('');

  const statusBanner = vaultConfigured
    ? `<div style="background:var(--accent-teal-bg);border-bottom:1px solid rgba(0,201,167,0.25);padding:8px 16px;font-size:11px;color:var(--accent-teal);display:flex;align-items:center;gap:8px">
         ◉ Vault connected${lastSync ? ` · last sync ${fmtTime(lastSync)}` : ''} · Sync available below
       </div>`
    : `<div style="background:var(--accent-amber-bg);border-bottom:1px solid rgba(245,166,35,0.25);padding:8px 16px;font-size:11px;color:var(--accent-amber)">
         ⚠ Vault not configured — set <code>OBSIDIAN_VAULT_PATH</code> in your environment and restart Hermes to enable live sync.
       </div>`;

  const docContent = vaultConfigured
    ? `<h1>${esc(folder.name)}</h1><p>${esc(folder.desc)}</p>
       <h2>Live Sync Status</h2>
       <p>Vault path: <code>${esc(obsData?.vaultPath || 'configured')}</code></p>
       ${lastSync ? `<p>Last sync: ${esc(fmtTime(lastSync))}</p>` : ''}
       <h2>Documents (${folder.count})</h2>
       <p style="color:var(--text-secondary)">Use Sync button to refresh vault mirror.</p>`
    : `<h1>${esc(folder.name)}</h1><p>${esc(folder.desc)}</p>
       <h2>Setup Required</h2>
       <p>Set <code>OBSIDIAN_VAULT_PATH=/path/to/your/vault</code> in your environment and restart Hermes.</p>
       <h2>What will sync</h2>
       <ul style="padding-left:16px;display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--text-secondary)">
         ${OBSIDIAN_FOLDERS.map(f=>`<li><strong>${esc(f.name)}</strong> — ${esc(f.desc)}</li>`).join('')}
       </ul>
       <p style="color:var(--text-tertiary);font-style:italic;margin-top:12px">No vault files will be shown until OBSIDIAN_VAULT_PATH is configured.</p>`;

  return `
    ${renderSectionHeader('Obsidian Mirror','Knowledge base',`
      ${vaultConfigured ? `<button class="btn btn-secondary btn-sm" id="btn-obsidian-sync">Sync Now</button>` : ''}
      <button class="btn btn-ghost btn-sm" ${!vaultConfigured?'disabled title="Configure vault path first"':''}>Open in Obsidian</button>`)}
    <div class="workspace-body" style="padding:0;overflow:hidden">
      ${statusBanner}
      <div class="obsidian-layout" style="padding:16px;height:calc(100% - 40px)">
        <div class="obsidian-tree">${tree}</div>
        <div class="obsidian-doc">${docContent}</div>
      </div>
    </div>`;
}

// ── Screen 13: Design Library ──────────────────────────────────
function renderDesignLib() {
  const tabs    = ['tokens','components','patterns'];
  const tabBtns = tabs.map(t=>`<span class="design-lib-nav-item ${state.designLibTab===t?'active':''}" data-dltab="${t}">${t.charAt(0).toUpperCase()+t.slice(1)}</span>`).join('');
  let content   = '';
  if (state.designLibTab === 'tokens') {
    content = `
      <div class="dl-section-label">Color Tokens</div>
      ${DESIGN_TOKENS.map(t=>`
        <div class="token-swatch">
          <div class="token-color-block" style="background:${esc(t.hex)}"></div>
          <div class="col gap-4" style="flex:1"><span class="token-name">${esc(t.name)}</span><span class="token-hex">${esc(t.hex)}</span></div>
          <span class="token-usage">${esc(t.usage)}</span>
        </div>`).join('')}
      <div class="dl-section-label" style="margin-top:16px">Typography Scale</div>
      ${[{role:'Section title',size:'15px',weight:'600'},{role:'Card title',size:'13px',weight:'600'},{role:'Body / desc',size:'13px',weight:'400'},{role:'Label / nav',size:'12px',weight:'500'},{role:'Badge / status',size:'10px',weight:'700'},{role:'Timestamp',size:'11px',weight:'400'}].map(t=>`
        <div class="token-swatch">
          <div style="font-size:${t.size};font-weight:${t.weight};min-width:140px">Sample text</div>
          <span class="token-name">${esc(t.role)}</span><span class="token-hex">${t.size} / ${t.weight}</span>
        </div>`).join('')}`;
  } else if (state.designLibTab === 'components') {
    content = `
      <div class="dl-section-label">Buttons</div>
      <div class="row gap-8 mb-16"><button class="btn btn-primary">Primary</button><button class="btn btn-secondary">Secondary</button><button class="btn btn-danger">Danger</button><button class="btn btn-ghost">Ghost</button><button class="btn btn-primary" disabled>Disabled</button></div>
      <div class="dl-section-label">Badges</div>
      <div class="row gap-8 mb-16"><span class="badge badge-teal">Active</span><span class="badge badge-blue">Doing</span><span class="badge badge-amber">Warning</span><span class="badge badge-red">Critical</span><span class="badge badge-violet">Council</span><span class="badge badge-slate">Idle</span></div>
      <div class="dl-section-label">Connection States</div>
      <div class="col gap-8">
        ${['Connected','Unauthorized','Vercel Protected','404 / Wrong URL','Failed','Not configured'].map(l=>`
          <div class="conn-result ${connCls(l)}"><div class="conn-result-status">${esc(l)}</div><div class="conn-result-detail">Example detail for ${esc(l)} state.</div></div>`).join('')}
      </div>`;
  } else {
    content = `
      <div class="dl-section-label">Design Patterns</div>
      <div class="col gap-12">
        ${[
          {title:'Setup card',          note:'Shown on Overview when Hermes is offline. Large, prominent, never buried.'},
          {title:'Mock banner',         note:'Orange strip shown on screens using fallback data. Disappears when Hermes connects.'},
          {title:'Command timeline',    note:'SSE-driven stages: received → plan → agent → task → risk → approval → complete.'},
          {title:'Agent drawer',        note:'Slide-in panel on AgentDex click. Shows state, specialty, permissions, recent events.'},
          {title:'Health tile',         note:'Label + metric + sub. Top border: ok=teal, warn=amber, bad=red.'},
          {title:'Connection result',   note:'7 states with color+fix copy. Never shows raw token values.'},
          {title:'Event feed',          note:'Filtered by type. Pause/Follow Live. Mock entries dimmed. SSE entries full-color.'},
          {title:'Kanban card',         note:'Blocked = amber border. High priority = red border. Done = dimmed.'},
          {title:'Approval card',       note:'Risk badge + details + Approve/Reject/Defer always visible.'}
        ].map(p=>`<div class="card card-sm"><div class="card-title mb-4">${esc(p.title)}</div><div style="font-size:11px;color:var(--text-secondary)">${esc(p.note)}</div></div>`).join('')}
      </div>`;
  }
  return `
    ${renderSectionHeader('Design Library','Tokens, components, patterns')}
    <div class="workspace-body" style="padding:0;overflow:hidden">
      <div class="design-lib-layout" style="height:100%">
        <div class="design-lib-nav">${tabBtns}</div>
        <div class="design-lib-content">${content}</div>
      </div>
    </div>`;
}

// ── Modal system ───────────────────────────────────────────────
function renderModal() {
  if (!state.modal) return '';
  const { type, data } = state.modal;

  if (type === 'create-task') {
    return `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">New Task</span>
            <button class="btn btn-ghost btn-sm" id="btn-modal-close">✕</button>
          </div>
          <div class="modal-body">
            <div class="input-group mb-10">
              <label class="input-label" for="m-title">Title</label>
              <input class="input" id="m-title" type="text" placeholder="Task title" />
            </div>
            <div class="row gap-8 mb-10">
              <div class="input-group" style="flex:1">
                <label class="input-label" for="m-project">Project</label>
                <input class="input" id="m-project" type="text" value="NexCall" />
              </div>
              <div class="input-group" style="flex:1">
                <label class="input-label" for="m-agent">Agent</label>
                <input class="input" id="m-agent" type="text" placeholder="Assigned agent" />
              </div>
            </div>
            <div class="row gap-8">
              <div class="input-group" style="flex:1">
                <label class="input-label" for="m-priority">Priority</label>
                <select class="input" id="m-priority">
                  <option>High</option><option selected>Medium</option><option>Low</option>
                </select>
              </div>
              <div class="input-group" style="flex:1">
                <label class="input-label" for="m-status">Status</label>
                <select class="input" id="m-status">
                  <option>Idea</option><option>Doing</option><option>Blocked</option><option>Done</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="btn-modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="btn-modal-confirm">Create Task</button>
          </div>
        </div>
      </div>`;
  }

  if (type === 'assign-task') {
    const agent = data?.agent || {};
    return `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">Assign Task to ${esc(agent.name || 'Agent')}</span>
            <button class="btn btn-ghost btn-sm" id="btn-modal-close">✕</button>
          </div>
          <div class="modal-body">
            <div class="input-group mb-10">
              <label class="input-label" for="m-title">Task Title</label>
              <input class="input" id="m-title" type="text" placeholder="Task title" />
            </div>
            <div class="input-group mb-10">
              <label class="input-label" for="m-project">Project</label>
              <input class="input" id="m-project" type="text" value="NexCall" />
            </div>
            <div class="input-group" style="display:none">
              <input id="m-agent" type="hidden" value="${esc(agent.name || '')}" />
            </div>
            <div class="input-group">
              <label class="input-label" for="m-priority">Priority</label>
              <select class="input" id="m-priority">
                <option>High</option><option selected>Medium</option><option>Low</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="btn-modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="btn-modal-confirm">Assign Task</button>
          </div>
        </div>
      </div>`;
  }

  return '';
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
    case 'integrations': return renderIntegrations();
    case 'lanes':        return renderLanes();
    case 'approvals':    return renderApprovals();
    case 'obsidian':     return renderObsidian();
    case 'designlib':    return renderDesignLib();
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
      <main class="workspace">${renderScreen()}</main>
      ${renderFeed()}
    </div>
    ${renderModal()}
    <div class="toast-container" id="toast-container"></div>`;
  bind();
}

// ── Event Binding ──────────────────────────────────────────────
function bind() {
  // Navigation
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      const t = el.dataset.nav;
      if (t === 'config') { state.configOpen = !state.configOpen; }
      else { state.configOpen = false; state.activeScreen = t; }
      render();
    });
  });

  // Find / Retry Hermes
  const findBtn = document.getElementById('btn-find-hermes') || document.getElementById('btn-retry-hermes');
  if (findBtn) findBtn.addEventListener('click', () => { saveHermesHostPort(); discoverHermes(); });

  // Disconnect Hermes
  document.getElementById('btn-stop-hermes')?.addEventListener('click', () => {
    stopSSE();
    state.hermesState = 'unknown';
    state.hermesHealth = null;
    state.agents = state.tasks = state.approvals = state.logs = state.watchtower = state.sentinel = null;
    render();
    showToast('⬡ Hermes disconnected · start npm run dev to reconnect.', '⬡');
  });

  // Advanced details
  document.getElementById('advanced-details')?.addEventListener('toggle', e => { state.advancedOpen = e.target.open; });

  // Save / Test (preview path)
  document.getElementById('btn-save')?.addEventListener('click', saveConfig);
  document.getElementById('btn-test')?.addEventListener('click', testConnection);

  // Refresh — use loadAllFromHermes (data fetch) not discoverHermes (health probe)
  document.getElementById('btn-refresh')?.addEventListener('click', () => {
    if (isHermesConnected()) { loadAllFromHermes(); showToast('◎ Refreshing live data from Hermes…', '◎'); }
    else { testConnection(); }
  });

  // Clear messages / timeline
  document.getElementById('btn-clear-msgs')?.addEventListener('click', () => { state.messages = []; render(); });
  document.getElementById('btn-clear-timeline')?.addEventListener('click', () => { state.commandTimeline = []; state.activeCommandId = null; render(); });

  // Send command
  const sendBtn  = document.getElementById('btn-send');
  const cmdInput = document.getElementById('cmd-input');
  if (sendBtn && cmdInput) {
    sendBtn.addEventListener('click', () => { sendCommand(cmdInput.value); cmdInput.value = ''; });
    cmdInput.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { sendCommand(cmdInput.value); cmdInput.value = ''; }
    });
  }

  // Quick prompts — always route to Command Center; sendCommand handles not-connected
  document.querySelectorAll('[data-prompt]').forEach(el => {
    el.addEventListener('click', () => {
      state.activeScreen = 'command';
      render();
      sendCommand(el.dataset.prompt);
    });
  });

  // Agent filter
  document.querySelectorAll('[data-filter]').forEach(el => {
    el.addEventListener('click', () => { state.agentFilter = el.dataset.filter; render(); });
  });

  // Agent card click → drawer
  document.querySelectorAll('[data-agent]').forEach(el => {
    el.addEventListener('click', () => {
      const agents = state.agents || (isHermesConnected() ? [] : MOCK_AGENTS);
      const found  = agents.find(a => a.id === el.dataset.agent);
      state.selectedAgent = state.selectedAgent?.id === el.dataset.agent ? null : (found || null);
      render();
    });
  });

  // Close agent drawer
  document.getElementById('btn-close-drawer')?.addEventListener('click', () => { state.selectedAgent = null; render(); });

  // Approval actions — Approve / Reject / Defer
  document.querySelectorAll('[data-approve]').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); resolveApproval(el.dataset.approve, 'approve'); });
  });
  document.querySelectorAll('[data-reject]').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); resolveApproval(el.dataset.reject, 'reject'); });
  });
  document.querySelectorAll('[data-defer]').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); resolveApproval(el.dataset.defer, 'defer'); });
  });

  // Feed filter
  document.querySelectorAll('[data-feedfilter]').forEach(el => {
    el.addEventListener('click', () => { state.feedFilter = el.dataset.feedfilter; refreshFeedUI(); });
  });

  // Feed pause / follow live
  document.getElementById('btn-feed-pause')?.addEventListener('click', () => {
    state.feedPaused = !state.feedPaused;
    if (!state.feedPaused) { state.newWhilePaused = 0; refreshFeedUI(); }
    else { refreshFeedMeta(); }
  });

  // Modal — close / cancel / overlay click
  const closeModal = () => { state.modal = null; render(); };
  document.getElementById('btn-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('btn-modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('modal-overlay')?.addEventListener('click', e => { if (e.target.id === 'modal-overlay') closeModal(); });

  // Modal — confirm (create task or assign task)
  document.getElementById('btn-modal-confirm')?.addEventListener('click', () => {
    const title    = document.getElementById('m-title')?.value?.trim() || '';
    const project  = document.getElementById('m-project')?.value?.trim() || 'NexCall';
    const agent    = document.getElementById('m-agent')?.value?.trim() || '';
    const priority = document.getElementById('m-priority')?.value || 'Medium';
    const status   = document.getElementById('m-status')?.value || 'Idea';
    if (!title) { showToast('⚠ Title is required to create a task.', '⚠'); return; }
    createTask({ title, project, agent, priority, status, risk:'Low', approvalRequired:false });
  });

  // + Add Task button (Kanban / Schedule)
  document.getElementById('btn-add-task')?.addEventListener('click', () => {
    state.modal = { type:'create-task', data:{} };
    render();
  });

  // AgentDex — Assign Task button
  document.getElementById('btn-assign-task')?.addEventListener('click', () => {
    const agent = state.selectedAgent || null;
    state.modal = { type:'assign-task', data:{ agent } };
    render();
  });

  // Kanban inline status cycle
  document.querySelectorAll('[data-task-status]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const id   = el.dataset.taskId;
      const next = el.dataset.taskStatus;
      updateTask(id, { status: next });
    });
  });

  // Kanban inline priority cycle
  document.querySelectorAll('[data-task-priority]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const id   = el.dataset.taskId;
      const next = el.dataset.taskPriority;
      updateTask(id, { priority: next });
    });
  });

  // Kanban card delete
  document.querySelectorAll('[data-task-delete]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      deleteTask(el.dataset.taskId);
    });
  });

  // Sentinel — Scan Now
  // Contract: POST /api/misato/secrets/scan-summary  (not sentinel/scan)
  document.getElementById('btn-scan-now')?.addEventListener('click', async () => {
    if (!isHermesConnected()) { showToast('Hermes not connected — start npm run dev.', '⚠'); return; }
    showToast('◌ Scanning repository for secrets…', '◆');
    try {
      const result = await hermesMutate('POST', 'api/misato/secrets/scan-summary', {});
      if (result) {
        state.sentinel = result;
        render();
        // UX Copy Deck: show severity counts in success toast
        const c = result.critical || 0;
        const h = result.high || 0;
        const w = result.warnings || 0;
        showToast(`✓ Scan complete · ${c} critical · ${h} high · ${w} warnings`, '◉');
      } else {
        loadAllFromHermes();
      }
    } catch (e) {
      const msg = e.url
        ? `Scan failed: ${e.message}\nEndpoint: ${e.url}`
        : e.message;
      showToast(msg, '⚠');
      // Still refresh secrets/status in case partial result available
      loadAllFromHermes();
    }
  });

  // Watchtower / Sentinel refresh via a shared "Refresh data" flow
  document.getElementById('btn-refresh-data')?.addEventListener('click', () => {
    if (isHermesConnected()) { loadAllFromHermes(); showToast('◎ Refreshing…', '◎'); }
  });

  // Schedule view toggle (Day / Agenda / Week)
  document.querySelectorAll('[data-schedview]').forEach(el => {
    el.addEventListener('click', () => { state.scheduleView = el.dataset.schedview; render(); });
  });

  // Approval filter tabs (Pending / Approved / Rejected / Deferred / All)
  document.querySelectorAll('[data-apprfilter]').forEach(el => {
    el.addEventListener('click', () => { state.approvalFilter = el.dataset.apprfilter; render(); });
  });

  // Log severity filter
  document.querySelectorAll('[data-logfilter]').forEach(el => {
    el.addEventListener('click', () => { state.logFilter = el.dataset.logfilter; render(); });
  });

  // Design lib tabs
  document.querySelectorAll('[data-dltab]').forEach(el => {
    el.addEventListener('click', () => { state.designLibTab = el.dataset.dltab; render(); });
  });

  // Obsidian folder
  document.querySelectorAll('[data-obfolder]').forEach(el => {
    el.addEventListener('click', () => { state.obsidianFolder = parseInt(el.dataset.obfolder, 10); render(); });
  });

  // Obsidian — Sync Now
  document.getElementById('btn-obsidian-sync')?.addEventListener('click', async () => {
    if (!isHermesConnected()) { showToast('◎ Hermes offline — start npm run dev to reconnect.', '⚠'); return; }
    showToast('⟳ Syncing to Obsidian vault…', '⬡');
    try {
      const syncResult = await hermesMutate('POST', 'api/misato/obsidian/sync', {});
      // UX Copy Deck: show item count when available
      const filesWritten = syncResult?.filesWritten?.length ?? syncResult?.filesWritten ?? null;
      showToast(filesWritten != null ? `✓ Synced · ${filesWritten} files · Just now` : '✓ Obsidian sync complete.', '◉');
      loadAllFromHermes();
    } catch (e) {
      showToast(e.url ? `✗ Obsidian sync failed: ${e.message}\nEndpoint: ${e.url}` : `✗ Obsidian sync failed: ${e.message}`, '⚠');
    }
  });

  // Auto-scroll cmd messages
  const msgs = document.getElementById('cmd-messages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

// ── Hermes health polling — catch mid-session disconnection ─────
async function hermesHealthPing() {
  if (state.hermesState !== 'connected') return;
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 3000);
    const res  = await fetch(`${hermesBase()}/health`, { method:'GET', signal:ctrl.signal });
    clearTimeout(tid);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        // 200 HTML at /health means the wrong server answered (Next.js page route, proxy, etc.)
        console.warn(`[MISATO] health ping got ${ct.split(';')[0].trim()} — treating as offline`);
        state.hermesState = 'not-running';
        state.hermesHealth = null;
        stopSSE();
        render();
      } else {
        try { state.hermesHealth = await res.json(); } catch {}
        refreshTopBarUI();
      }
    } else {
      // Hermes answered but not OK — treat as offline
      state.hermesState = 'not-running';
      state.hermesHealth = null;
      stopSSE();
      render();
    }
  } catch (e) {
    // Network error — Hermes went away or port is dead
    console.warn(`[MISATO] health ping failed: ${e?.message} (target: ${hermesBase()}/health)`);
    state.hermesState = 'not-running';
    state.hermesHealth = null;
    stopSSE();
    render();
  }
}
setInterval(hermesHealthPing, 30_000); // every 30 s

// ── Auto-reconnect when not-running ───────────────────────────
// When Hermes is known to be offline, silently retry discovery every 60s.
// This catches the common case of: launch MISATO → start Hermes → app connects
// without requiring the user to click Find Hermes.
// Does NOT run when hermesState is 'connected' (health ping handles that) or
// 'finding' (already in-flight). Only retries from the 'not-running' state.
setInterval(() => {
  if (state.hermesState === 'not-running') discoverHermes();
}, 60_000);

// ── Boot ───────────────────────────────────────────────────────
render();            // paint shell immediately
discoverHermes();    // probe 127.0.0.1:3010 (canonical) — silent, non-blocking
