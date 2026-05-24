const storage = {
  get(k, d=''){ try { return localStorage.getItem(k) || d; } catch { return d; } },
  set(k,v){ try { localStorage.setItem(k,v); } catch {} }
};

const injectedBase = (window.__MISATO_API_BASE_URL__ || '').trim();
const state = {
  baseUrl: storage.get('misato_api_base_url', injectedBase),
  token: storage.get('misato_desktop_auth_token', ''),
  status: null,
  council: [],
  projects: [],
  tasks: [],
  approvals: [],
  logs: [],
  commandResult: null,
  lastError: ''
};

function headers(){
  const h = {'content-type':'application/json'};
  if (state.token) h['x-misato-desktop-token'] = state.token;
  return h;
}

function endpoint(path){
  const base = state.baseUrl.replace(/\/$/, '');
  return `${base}/${path}`;
}

async function apiGet(path){
  const res = await fetch(endpoint(path), {headers: headers()});
  const data = await res.json().catch(()=>({ok:false,error:'Invalid JSON'}));
  if(!res.ok) throw new Error(data.error || `${res.status}`);
  return data;
}

async function loadAll(){
  if(!state.baseUrl){ render(); return; }
  state.lastError='';
  try {
    state.status = await apiGet('status');
    state.council = (await apiGet('council')).items || [];
    state.projects = (await apiGet('projects')).items || [];
    state.tasks = (await apiGet('tasks')).items || [];
    state.approvals = (await apiGet('approvals')).items || [];
    state.logs = (await apiGet('logs')).items || [];
  } catch (e){ state.lastError = String(e.message || e); }
  render();
}

async function sendCommand(){
  const input = document.getElementById('cmd');
  const command = (input?.value||'').trim();
  if(!command) return;
  try{
    const res = await fetch(endpoint('command'), {method:'POST', headers: headers(), body: JSON.stringify({command})});
    const data = await res.json().catch(()=>({ok:false,error:'Invalid JSON'}));
    if(!res.ok) throw new Error(data.error || `${res.status}`);
    state.commandResult = data.result;
    state.lastError='';
    input.value='';
  }catch(e){ state.lastError=String(e.message||e); }
  render();
}

function saveConfig(){
  state.baseUrl = (document.getElementById('base')?.value || '').trim();
  state.token = (document.getElementById('token')?.value || '').trim();
  storage.set('misato_api_base_url', state.baseUrl);
  storage.set('misato_desktop_auth_token', state.token);
  loadAll();
}

function setupView(){
  return `<div class='card'>
    <div class='title'>MISATO backend not connected</div>
    <p class='muted'>Set MISATO_API_BASE_URL (example: https://your-private-vercel-url/api/misato). No secrets embedded. No auth bypass.</p>
    <div class='stack'>
      <input id='base' placeholder='https://nexcall.one/api/misato' value='${state.baseUrl||''}' />
      <input id='token' placeholder='MISATO_DESKTOP_AUTH_TOKEN (local only)' value='${state.token||''}' />
      <div class='row'><button id='save'>Connect MISATO backend</button></div>
    </div>
  </div>`;
}

function list(items, mapper){ return `<ul>${items.map(mapper).join('')}</ul>`; }

function appView(){
  const connected = !!state.status?.ok;
  return `<div class='wrap'>
    <div class='card top'>
      <div class='title'>MISATO Mission Control</div>
      <span class='small ${connected?'ok':'bad'}'>${connected?'Connected':'Disconnected'}</span>
      <span class='small muted'>API: ${state.baseUrl||'not set'}</span>
      <button id='reload'>Refresh</button>
      <button id='reconfig'>Config</button>
    </div>

    ${state.lastError?`<div class='card bad'>Error: ${state.lastError}</div>`:''}

    <div class='grid'>
      <div class='stack'>
        <div class='card'>
          <div class='title'>MISATO Core command input</div>
          <textarea id='cmd' placeholder='What needs attention today?'></textarea>
          <div class='row'><button id='run'>Run command</button></div>
          ${state.commandResult?`<p class='small muted'>${state.commandResult.missionSummary||''}</p>`:''}
        </div>

        <div class='card'><div class='title'>Council activity</div>${list(state.council.slice(0,8),a=>`<li>${a.name} — <span class='muted'>${a.status}</span></li>`)}</div>
        <div class='card'><div class='title'>Projects</div>${list(state.projects.slice(0,6),p=>`<li>${p.name} — ${p.status} (${p.priority})</li>`)}</div>
        <div class='card'><div class='title'>Kanban / Tasks</div>${list(state.tasks.slice(0,8),t=>`<li>${t.title} — ${t.status}</li>`)}</div>
      </div>
      <div class='stack'>
        <div class='card'><div class='title'>Approvals</div>${list(state.approvals.slice(0,6),a=>`<li>${a.actionType} — <span class='warn'>${a.status}</span></li>`)}</div>
        <div class='card'><div class='title'>Logs</div>${list(state.logs.slice(0,8),l=>`<li>${l.timestamp} — ${l.action}</li>`)}</div>
        <div class='card'><div class='title'>Status</div>
          <p class='small muted'>Owner/auth required server-side. Live automations disabled in v1.</p>
          <p class='small muted'>Memory/Obsidian + Discord endpoints available in mock mode.</p>
        </div>
      </div>
    </div>
  </div>`;
}

function bind(){
  document.getElementById('save')?.addEventListener('click', saveConfig);
  document.getElementById('reload')?.addEventListener('click', loadAll);
  document.getElementById('reconfig')?.addEventListener('click', ()=>{ state.status=null; render(); });
  document.getElementById('run')?.addEventListener('click', sendCommand);
}

function render(){
  const root = document.getElementById('app');
  const showSetup = !state.baseUrl || (!state.status && !state.council.length && !state.projects.length && !state.lastError);
  root.innerHTML = showSetup ? setupView() : appView();
  bind();
}

render();
if(state.baseUrl) loadAll();