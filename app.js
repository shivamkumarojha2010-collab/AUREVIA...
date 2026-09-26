// AUREVIA client — authentication and storage dashboard
let authMode = "login";

const $ = id => document.getElementById(id);
let objectCache = [];

function setAuthMessage(msg){ $("authMessage").textContent = msg || ""; }
function toggleAuthMode(){
  authMode = authMode === "login" ? "signup" : "login";
  $("authTitle").textContent = authMode === "login" ? "Sign in to AUREVIA" : "Create your private vault";
  $("authSubmit").textContent = authMode === "login" ? "Sign In" : "Create Account";
  $("authSwitch").textContent = authMode === "login" ? "New here? Create an account" : "Already have an account? Sign in";
  $("authPassword").value = "";
  setAuthMessage("");
}

async function api(url,opts={}){
  const options={credentials:"same-origin",...opts};
  let r;
  try { r=await fetch(url,options); }
  catch(e){ throw new Error("AUREVIA server is not running. Start RUN_VAULT.bat and open http://127.0.0.1:8000"); }
  const d=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.detail||`Request failed (${r.status})`);
  return d;
}

function showApp(user){
  $("authScreen").classList.add("hidden");
  $("appShell").classList.remove("hidden");
  $("userPill").textContent = user.email;
  refreshAll();
}

async function setupGoogle(){
  try{
    const cfg=await api("/api/auth/config");
    window.__googleClientId=cfg.google_client_id||"";
    if(window.__googleClientId){
      $("googleBtn").disabled=false;
      $("googleBtn").textContent="Continue with Google";
    }else{
      $("googleBtn").disabled=false;
      $("googleBtn").textContent="Continue with Google";
      $("googleBtn").title="Google OAuth setup is required";
    }
  }catch(e){
    $("googleBtn").disabled=false;
  }
}

async function checkAuth(){
  try{
    const user=await api("/api/auth/me");
    showApp(user);
    return;
  }catch(e){
    $("authScreen").classList.remove("hidden");
    $("appShell").classList.add("hidden");
  }
  setupGoogle();
}

$("authForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const email=$("authEmail").value.trim();
  const password=$("authPassword").value;
  if(!email||!password){setAuthMessage("Enter your email and password.");return}
  if(password.length<6){setAuthMessage("Password must be at least 6 characters.");return}
  const btn=$("authSubmit");
  btn.disabled=true;
  setAuthMessage(authMode==="login"?"Signing in...":"Creating your private account...");
  try{
    const d=await api(`/api/auth/${authMode}`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({email,password})
    });
    showApp(d.user);
  }catch(e){setAuthMessage(e.message)}
  finally{btn.disabled=false}
});

function googleSignIn(){
  if(!window.__googleClientId){
    setAuthMessage("Google login needs your Google OAuth Client ID. Email/password login is ready now.");
    return;
  }
  if(!window.google?.accounts?.id){
    setAuthMessage("Google Sign-In is still loading. Please wait a moment and try again.");
    return;
  }
  google.accounts.id.initialize({
    client_id:window.__googleClientId,
    callback:async response=>{
      try{
        const d=await api("/api/auth/google",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({credential:response.credential})
        });
        showApp(d.user);
      }catch(e){setAuthMessage(e.message)}
    }
  });
  google.accounts.id.prompt();
}

async function logout(){
  try{await api("/api/auth/logout",{method:"POST"})}catch(e){}
  location.reload();
}

function fmt(n){
  n=Number(n||0); const u=["B","KB","MB","GB","TB"]; let i=0;
  while(n>=1024&&i<u.length-1){n/=1024;i++}
  return `${n.toFixed(i?1:0)} ${u[i]}`;
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400);}
function showTab(id){
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active-tab"));
  document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));
  $(id).classList.add("active-tab");
  document.querySelector(`.nav[data-tab="${id}"]`)?.classList.add("active");
  refreshAll();
}
function openUpload(){$("uploadModal").classList.remove("hidden")}
function closeUpload(){$("uploadModal").classList.add("hidden");$("uploadMessage").textContent=""}
$("fileInput").onchange=()=>{
  const f=$("fileInput").files[0];
  if(f){$("dropTitle").textContent=f.name;$("dropHint").textContent=fmt(f.size)+" • Ready to upload"}
}
$("dropZone").ondragover=e=>{e.preventDefault();$("dropZone").style.borderColor="#4968e8"}
$("dropZone").ondrop=e=>{e.preventDefault();$("fileInput").files=e.dataTransfer.files;$("fileInput").dispatchEvent(new Event("change"))}

async function uploadFile(){
  const f=$("fileInput").files[0];
  if(!f){$("uploadMessage").textContent="Choose a file first.";return}
  const fd=new FormData();fd.append("file",f);
  $("uploadMessage").textContent="Uploading, hashing and creating replicas...";
  try{
    const d=await api(`/api/upload?replication=${$("replication").value}`,{method:"POST",body:fd});
    $("uploadMessage").textContent=`Saved to laptop: ${d.saved_path} • Replicated to ${d.nodes.join(", ")}`;
    toast("File saved to laptop + replicas created");
    await refreshAll();
    setTimeout(closeUpload,700);
  }catch(e){$("uploadMessage").textContent=e.message}
}

async function refreshAll(){
  try{
    const [s,n,o,e,h]=await Promise.all([
      api("/api/stats"),api("/api/nodes"),api("/api/objects"),api("/api/events"),api("/api/health")
    ]);
    objectCache=o;
    $("statObjects").textContent=s.objects;
    $("statLogical").textContent=fmt(s.logical_bytes);
    $("statPhysical").textContent=fmt(s.physical_bytes);
    $("statNodes").textContent=`${h.healthy}/${h.total}`;
    $("systemText").textContent=h.healthy===h.total?"System Online":`${h.healthy}/${h.total} Nodes Healthy`;
    renderHealth(n);renderObjects(o);renderEvents(e);
  }catch(e){$("systemText").textContent="Backend Offline"}
}

function renderHealth(nodes){
  $("healthPreview").innerHTML=nodes.map(n=>`
    <div class="node-line">
      <span class="dot ${n.status}"></span>
      <div class="node-main"><b>${esc(n.label)}</b><small>${n.status.toUpperCase()} • ${fmt(n.used_bytes)}</small></div>
      <div class="mini-bar"><i style="width:${Math.min(100,n.used_bytes?Math.max(7,n.used_bytes/1048576):0)}%"></i></div>
    </div>`).join("");
  $("nodeGrid").innerHTML=nodes.map(n=>`
    <div class="node-card">
      <div class="node-card-head">
        <div><h3>${esc(n.label)}</h3><p>${n.node}</p></div>
        <span class="status-text ${n.status}">● ${n.status.toUpperCase()}</span>
      </div>
      <div class="node-meter"><i style="width:${n.used_bytes?Math.min(100,Math.max(4,n.used_bytes/1048576)):2}%"></i></div>
      <div class="node-meta"><span>Stored data</span><b>${fmt(n.used_bytes)}</b></div>
      <div class="node-meta"><span>Replica records</span><b>${n.objects}</b></div>
      <div class="node-actions">
        ${n.status==="healthy"
          ? `<button class="soft" onclick="failNode('${n.node}')">Simulate Failure</button>`
          : `<button class="primary" onclick="recoverNode('${n.node}')">Recover Node</button>`}
      </div>
    </div>`).join("");
}

function objectRow(o,full=false){
  const state=o.healthy?"ok":"warn";
  const status=o.healthy?"HEALTHY":"DEGRADED";
  return `<div class="object-row">
    <div class="file-icon">FILE</div>
    <div class="obj-info">
      <b title="${esc(o.filename)}">${esc(o.filename)}</b>
      <small>${fmt(o.size)} • ${o.verified_replicas}/${o.replication} verified replicas • SHA-256 ${o.sha256.slice(0,12)}…</small>
    </div>
    <span class="badge ${state}">${status}</span>
    <div class="row-actions">
      <button class="tiny" onclick="downloadObject('${o.object_id}')">Download</button>
      ${full?`<button class="tiny" onclick="corruptObject('${o.object_id}')">Test Integrity</button>`:""}
    </div>
  </div>`;
}
function renderObjects(objs){
  $("recentObjects").innerHTML=objs.length?objs.slice(0,5).map(o=>objectRow(o)).join(""):'<div class="message">No objects yet. Upload your first file.</div>';
  $("allObjects").innerHTML=objs.length?objs.map(o=>objectRow(o,true)).join(""):'<div class="message">No objects yet.</div>';
}
function renderEvents(events){
  $("events").innerHTML=events.length?events.map(e=>`
    <div class="event"><i class="event-dot"></i><div><b>${esc(e.event_type)}</b><p>${esc(e.message)}</p><time>${new Date(e.created_at).toLocaleString()}</time></div></div>`
  ).join(""):'<div class="message">No events yet.</div>';
}
function downloadObject(id){location.href="/api/download/"+id}
async function failNode(n){try{await api(`/api/nodes/${n}/fail`,{method:"POST"});toast("Node failure simulated");refreshAll()}catch(e){toast(e.message)}}
async function recoverNode(n){try{const d=await api(`/api/nodes/${n}/recover`,{method:"POST"});toast(`Recovered • repaired ${d.repaired.length} replica(s)`);refreshAll()}catch(e){toast(e.message)}}
async function repairAll(){try{const d=await api("/api/repair",{method:"POST"});toast(`Repair cycle • ${d.repaired.length} replica(s)`);refreshAll()}catch(e){toast(e.message)}}
async function runDemo(){ $("demoMessage").textContent="Running repair cycle...";await repairAll();$("demoMessage").textContent="Repair cycle completed. Check Activity for the event."; }
async function corruptObject(id){
  const o=objectCache.find(x=>x.object_id===id);
  if(!o||!o.replicas.length)return;
  const target=o.replicas.find(r=>r.status==="healthy");
  if(!target){toast("No healthy replica to test");return}
  try{
    const d=await api(`/api/corrupt/${id}/${target.node}`,{method:"POST"});
    toast(`Corruption detected and ${d.repaired.length} replica repaired`);
    refreshAll();
  }catch(e){toast(e.message)}
}
async function resetDemo(){
  if(!confirm("Reset all demo data and return every node to healthy?"))return;
  await api("/api/reset",{method:"DELETE"});toast("Demo reset");refreshAll();
}
checkAuth();
