const storage={get:(k,d="")=>{try{return localStorage.getItem(k)||d}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}};
const injectedBase=(window.__MISATO_API_BASE_URL__||"").trim();
const state={baseUrl:storage.get("misato_api_base_url",injectedBase),token:storage.get("misato_desktop_auth_token",""),bypassToken:storage.get("misato_vercel_bypass_token",""),status:null,council:[],projects:[],tasks:[],approvals:[],logs:[],commandResult:null,lastError:"",commandHistory:[],connTest:{label:"Not tested",httpStatus:null,checkedAt:null,error:"",nextFix:"Click Test Connection after configuring MISATO_API_BASE_URL."}};

const headers=()=>{const h={"content-type":"application/json"}; if(state.token) h["x-misato-desktop-token"]=state.token; if(state.bypassToken) h["x-vercel-protection-bypass"]=state.bypassToken; return h;};
const endpoint=(path)=>`${state.baseUrl.replace(/\/$/,"")}/${path}`;
const isConnected=()=>state.connTest.label==="Connected";
const authModeLabel=()=>`${state.token?"desktop token configured":"no desktop token"}; ${state.bypassToken?"Vercel bypass configured":"no Vercel bypass token"}`;
const statusClass=(label)=>({Connected:"connected",Unauthorized:"unauthorized",Failed:"failed","Not configured":"not-configured","Not tested":"testing"}[label]||"testing");

async function apiGet(path){const res=await fetch(endpoint(path),{headers:headers()}); const data=await res.json().catch(()=>({ok:false,error:"Invalid JSON"})); return {res,data};}

async function testConnection(){
  if(!state.baseUrl){state.connTest={label:"Not configured",httpStatus:null,checkedAt:new Date().toISOString(),error:"MISATO_API_BASE_URL is missing.",nextFix:"Set MISATO_API_BASE_URL to your private MISATO backend."}; return render();}
  try{
    const {res,data}=await apiGet("status"); const checkedAt=new Date().toISOString();
    if(res.ok&&data?.ok){state.status=data; state.connTest={label:"Connected",httpStatus:res.status,checkedAt,error:"",nextFix:"Connected to MISATO backend. Owner/auth check passed."}; await loadAll(false);}
    else if(res.status===401||data?.auth==="invalid"){state.connTest={label:"Unauthorized",httpStatus:res.status,checkedAt,error:data?.error||"unauthorized",nextFix:"Backend reached, but auth failed. Check desktop token/session and bypass token if preview is protected."};}
    else if(res.status===404){state.connTest={label:"Failed",httpStatus:res.status,checkedAt,error:"route not found",nextFix:"Wrong deployment URL. Use misato-full-build preview /api/misato."};}
    else{state.connTest={label:"Failed",httpStatus:res.status,checkedAt,error:data?.error||`HTTP ${res.status}`,nextFix:"Cannot reach usable backend state. Check URL and network."};}
  }catch(e){state.connTest={label:"Failed",httpStatus:null,checkedAt:new Date().toISOString(),error:String(e.message||e),nextFix:"Cannot reach backend. Check URL/network."};}
  render();
}

async function loadAll(triggerRender=true){if(!state.baseUrl){if(triggerRender)render();return;} state.lastError=""; try{const [c,p,t,a,l]=await Promise.all([apiGet("council"),apiGet("projects"),apiGet("tasks"),apiGet("approvals"),apiGet("logs")]); if(c.res.ok)state.council=c.data.items||[]; if(p.res.ok)state.projects=p.data.items||[]; if(t.res.ok)state.tasks=t.data.items||[]; if(a.res.ok)state.approvals=a.data.items||[]; if(l.res.ok)state.logs=l.data.items||[];}catch(e){state.lastError=String(e.message||e);} if(triggerRender)render();}

async function sendCommand(prefill){const input=document.getElementById("cmd"); if(prefill&&input) input.value=prefill; const command=(input?.value||"").trim(); if(!command) return; if(!state.baseUrl){state.lastError="Set MISATO_API_BASE_URL before sending commands."; return render();}
  try{const res=await fetch(endpoint("command"),{method:"POST",headers:headers(),body:JSON.stringify({command})}); const data=await res.json().catch(()=>({ok:false,error:"Invalid JSON"})); if(!res.ok) throw new Error(data.error||`${res.status}`); state.commandResult=data.result; state.commandHistory.unshift({role:"user",text:command,ts:new Date().toISOString()},{role:"core",text:data?.result?.missionSummary||"Command completed.",ts:new Date().toISOString()}); state.commandHistory=state.commandHistory.slice(0,12); state.lastError=""; input.value="";}catch(e){state.lastError=String(e.message||e);} render(); const stream=document.getElementById("stream"); if(stream) stream.scrollTop=0;}

function saveConfig(){state.baseUrl=(document.getElementById("base")?.value||"").trim(); const enteredToken=(document.getElementById("token")?.value||"").trim(); const enteredBypass=(document.getElementById("bypass")?.value||"").trim(); if(enteredToken) state.token=enteredToken; if(enteredBypass) state.bypassToken=enteredBypass; storage.set("misato_api_base_url",state.baseUrl); storage.set("misato_desktop_auth_token",state.token); storage.set("misato_vercel_bypass_token",state.bypassToken); state.connTest={label:"Not tested",httpStatus:null,checkedAt:null,error:"",nextFix:"Click Test Connection to verify backend/auth."}; render();}

const StatusBar=()=>`<div class='header'><div class='row'><div class='title'>MISATO Mission Control</div><span class='badge'>Preview</span></div><div class='row'><span class='status-chip ${statusClass(state.connTest.label)}'><span class='dot ${isConnected()?"pulse":""}'></span>${state.connTest.label}</span><span class='small mono'>${state.connTest.checkedAt?new Date(state.connTest.checkedAt).toLocaleTimeString():"not checked"}</span></div></div>`;

const ConnectionPanel=()=>`<div class='col'>
  <div class='card'><h3 class='h2'>Backend Connection</h3><div class='stack'>
    <input id='base' placeholder='https://your-preview.vercel.app/api/misato' value='${state.baseUrl||""}' />
    <input id='token' type='password' autocomplete='off' placeholder='MISATO_DESKTOP_AUTH_TOKEN (local only)' value='' />
    <input id='bypass' type='password' autocomplete='off' placeholder='VERCEL_PROTECTION_BYPASS (optional local only)' value='' />
    <div class='row'><button id='save'>Save Config</button><button id='test' class='secondary'>Test Connection</button></div>
  </div></div>
  <div class='card'><h3 class='h2'>Connection Result</h3><div class='kv'>
    <span class='k'>Status</span><span class='v'>${state.connTest.label}</span>
    <span class='k'>HTTP</span><span class='v'>${state.connTest.httpStatus??"n/a"}</span>
    <span class='k'>Checked</span><span class='v'>${state.connTest.checkedAt||"never"}</span>
  </div>${state.connTest.error?`<p class='small bad'>${state.connTest.error}</p>`:""}<p class='small'>${state.connTest.nextFix}</p></div>
  <div class='card'><h3 class='h2'>Auth Mode</h3><p class='small'>${authModeLabel()}</p><p class='small'>Owner/API auth enforced. Secrets never shown.</p></div>
</div>`;

const CommandCenter=()=>{const enabled=!!state.baseUrl&&isConnected(); return `<div class='card'><h3 class='h2'>Command Center</h3>
  <textarea id='cmd' placeholder='What needs attention today?' ${enabled?"":"disabled"}></textarea>
  <div class='row'><button id='run' ${enabled?"":"disabled"}>Run Command</button><button class='secondary quick' data-q='What needs attention today?'>Today</button><button class='secondary quick' data-q='Ask council what to do next'>Ask Council</button><button class='secondary quick' data-q='Show pending approvals'>Approvals</button></div>
  ${!state.baseUrl?"<p class='small warn'>Set API Base URL first.</p>":""}
  ${state.baseUrl&&!isConnected()?"<p class='small warn'>Test Connection until Connected before commands.</p>":""}
  ${state.lastError?`<p class='small bad'>${state.lastError}</p>`:""}
  <div id='stream' class='stream'>
    ${state.commandHistory.map(m=>`<div class='msg ${m.role}'><div class='small mono'>${m.role.toUpperCase()} · ${new Date(m.ts).toLocaleTimeString()}</div><div>${m.text}</div></div>`).join("")}
  </div>
</div>`;};

const CouncilPanel=()=>`<div class='card'><h3 class='h2'>Council Activity</h3><ul class='list'>${state.council.slice(0,8).map(a=>`<li>${a.name} — <span class='small'>${a.status}</span></li>`).join("")||"<li class='small'>No data</li>"}</ul></div>`;
const ApprovalPanel=()=>`<div class='card'><h3 class='h2'>Approvals Queue</h3><ul class='list'>${state.approvals.slice(0,8).map(a=>`<li>${a.actionType} — <span class='warn'>${a.status}</span></li>`).join("")||"<li class='small'>No approvals</li>"}</ul></div>`;
const ProjectsPanel=()=>`<div class='card'><h3 class='h2'>Projects / Kanban</h3><ul class='list'>${state.projects.slice(0,6).map(p=>`<li>${p.name} — ${p.status}</li>`).join("")||"<li class='small'>No projects</li>"}</ul></div>`;
const LogsPanel=()=>`<div class='card'><h3 class='h2'>Logs</h3><ul class='list'>${state.logs.slice(0,8).map(l=>`<li><span class='mono'>${l.timestamp||""}</span> — ${l.action||"event"}</li>`).join("")||"<li class='small'>No logs</li>"}</ul></div>`;
const IntegrationsPanel=()=>`<div class='card'><h3 class='h2'>Integrations</h3><p class='small'>Discord/Obsidian/GitHub/Vercel status only. Live automations disabled.</p></div>`;

const MisatoShell=()=>`<div class='shell'>${StatusBar()}<div class='layout'>${ConnectionPanel()}<div class='col'>${CommandCenter()}${CouncilPanel()}${ProjectsPanel()}</div><div class='col'>${ApprovalPanel()}${LogsPanel()}${IntegrationsPanel()}</div></div></div>`;

function bind(){document.getElementById("save")?.addEventListener("click",saveConfig); document.getElementById("test")?.addEventListener("click",testConnection); document.getElementById("run")?.addEventListener("click",()=>sendCommand()); document.querySelectorAll(".quick").forEach(b=>b.addEventListener("click",()=>sendCommand(b.dataset.q||""))); document.getElementById("cmd")?.addEventListener("keydown",(e)=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();sendCommand();}});}
function render(){document.getElementById("app").innerHTML=MisatoShell(); bind();}

render();