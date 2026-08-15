/* ================= GOOGLE SHEETS SYNC ================= */
function logSync(msg, ok=true){
  state.syncLog.unshift({ msg, ok, date:new Date().toISOString() });
  state.syncLog = state.syncLog.slice(0,8);
}

// JSONP: memuat data lewat tag <script> alih-alih fetch(). Ini menghindari masalah CORS/"Failed to
// fetch" yang muncul saat SIMONA dibuka langsung dari file (origin "null") memanggil Apps Script.
function jsonpRequest(url, params={}, timeoutMs=15000){
  return new Promise((resolve, reject)=>{
    const cbName = 'simonaJsonp_' + Math.random().toString(36).slice(2);
    const qs = new URLSearchParams({...params, callback:cbName}).toString();
    const script = document.createElement('script');
    let settled = false;
    const cleanup = ()=>{
      delete window[cbName];
      script.remove();
      clearTimeout(timer);
    };
    const timer = setTimeout(()=>{
      if(settled) return; settled = true;
      cleanup();
      reject(new Error('Waktu koneksi habis (kemungkinan URL salah atau backend tidak merespons).'));
    }, timeoutMs);
    window[cbName] = (data)=>{
      if(settled) return; settled = true;
      cleanup();
      resolve(data);
    };
    script.onerror = ()=>{
      if(settled) return; settled = true;
      cleanup();
      reject(new Error('Gagal memuat URL Web App (periksa URL &amp; koneksi internet).'));
    };
    script.src = url + (url.includes('?') ? '&' : '?') + qs;
    document.head.appendChild(script);
  });
}
async function sheetsPing(){
  return jsonpRequest(state.sheetsUrl, { action:'ping' });
}
async function sheetsPush(docType, docs){
  const res = await fetch(state.sheetsUrl, {
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body: JSON.stringify({ type:docType, documents:docs }),
  });
  if(!res.ok) throw new Error('HTTP '+res.status);
  return res.json();
}
async function sheetsPushUsers(users){
  const res = await fetch(state.sheetsUrl, {
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body: JSON.stringify({ type:'Users', users }),
  });
  if(!res.ok) throw new Error('HTTP '+res.status);
  return res.json();
}
async function sheetsPull(){
  return jsonpRequest(state.sheetsUrl, {});
}
async function sheetsDelete(target, ids){
  const res = await fetch(state.sheetsUrl, {
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body: JSON.stringify({ type:'delete', target, ids }),
  });
  if(!res.ok) throw new Error('HTTP '+res.status);
  return res.json();
}
function normalizeSheetDoc(d, docType){
  return {
    id: d.id || cryptoId(), docId: d.docId || nextDocId(), title: d.title||'(Tanpa judul)',
    relatedDept: DEPARTMENTS.includes(d.relatedDept) ? d.relatedDept : DEPARTMENTS[0],
    docType, noInvoice: d.noInvoice||'', tglInvoice: d.tglInvoice||'', tglTerima: d.tglTerima||'', tglRencana: d.tglRencana||'',
    nominal: Number(d.nominal)||0, status: STATUS_LIST.includes(d.status) ? d.status : 'Draft',
    disburse: d.disburse==='Yes' ? 'Yes' : 'No',
    sumber: SUMBER.includes(d.sumber) ? d.sumber : 'Lainnya',
    fileSize: d.fileSize||'—', description: d.description||'', submittedBy: d.submittedBy||'—',
    createdAt: d.createdAt || new Date().toISOString(), updatedAt: d.updatedAt || new Date().toISOString(),
    attachments: d.attachments||[], auditTrail: Array.isArray(d.auditTrail) ? d.auditTrail : [],
  };
}
function normalizeSheetUser(u){
  const role = ['Super User','Admin','Staff'].includes(u.role) ? u.role : 'Staff';
  const toBool = (v)=> v===true || v==='true' || v==='TRUE' || v===1 || v==='1';
  return {
    id: u.id || cryptoId(), name: u.name||'(Tanpa nama)', email: u.email||'',
    role,
    dept: role==='Staff' ? (DEPARTMENTS.includes(u.dept) ? u.dept : DEPARTMENTS[0]) : null,
    permissions: {
      editStatus: role==='Super User' ? true : toBool(u.editStatus),
      editDisburse: role==='Super User' ? true : toBool(u.editDisburse),
    },
  };
}
// Upsert-merge: baris dari sumber lain (Sheets) memperbarui/menambah data lokal berdasarkan id,
// data lokal yang tidak ada di sumber TETAP dipertahankan (additive, tidak menimpa/menghapus).
function mergeById(localArr, incomingArr){
  const map = new Map(localArr.map(item=>[item.id, item]));
  incomingArr.forEach(item=>{ map.set(item.id, item); });
  return Array.from(map.values());
}

let toastTimer=null;
function showToast(msg, icon='check_circle', tone='ok'){
  const old = document.getElementById('toast'); if(old) old.remove();
  const div = document.createElement('div');
  div.id='toast';
  const bg = tone==='error' ? 'bg-red-600' : 'bg-primary';
  div.className=`fixed bottom-6 right-6 ${bg} text-white px-5 py-3 rounded-lg modal-shadow flex items-center gap-2 z-[100] fade-in text-sm font-semibold`;
  div.innerHTML = msi(icon,'text-[18px]') + '<span>'+msg+'</span>';
  document.body.appendChild(div);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>div.remove(), 2600);
}

// Native confirm()/alert() dialogs are blocked inside sandboxed preview iframes,
// so use a custom in-app confirmation modal instead.
function showConfirm(message, onConfirm, opts={}){
  const old = document.getElementById('confirmBg'); if(old) old.remove();
  const wrap = document.createElement('div');
  wrap.id = 'confirmBg';
  wrap.className = 'fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[200] p-4';
  wrap.innerHTML = `
    <div class="bg-white rounded-xl w-full max-w-sm modal-shadow fade-in">
      <div class="px-6 py-5">
        <div class="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">${msi('warning','text-[22px]')}</div>
        <h3 class="text-base font-bold text-slate-900 mb-1">${opts.title||'Konfirmasi'}</h3>
        <p class="text-sm text-slate-500">${message}</p>
      </div>
      <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
        <button type="button" id="confirmCancelBtn" class="px-4 py-2.5 border border-slate-300 rounded-lg font-semibold text-sm text-slate-600 hover:bg-slate-50">Batal</button>
        <button type="button" id="confirmOkBtn" class="px-4 py-2.5 bg-red-600 text-white rounded-lg font-bold text-sm hover:opacity-90">${opts.okLabel||'Hapus'}</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  const close = ()=> wrap.remove();
  document.getElementById('confirmCancelBtn').onclick = close;
  wrap.onclick = (e)=>{ if(e.target===wrap) close(); };
  document.getElementById('confirmOkBtn').onclick = ()=>{ close(); onConfirm(); };
}

function nextDocId(offset=0){ return '#DTS-2026-' + String(state.documents.length+1+offset).padStart(3,'0'); }

/* ================= AUTO-SYNC ENGINE ================= */
// Dua arah, TERMASUK sinkron penghapusan:
//  - Perubahan lokal (tambah/ubah/hapus dokumen atau user) -> otomatis di-push ke Sheets
//    (didebounce beberapa detik supaya tidak spam request saat mengetik cepat).
//  - Sheets berubah (data ditambah/dihapus dari luar SIMONA, mis. diedit manual di Sheets,
//    atau disinkron dari perangkat lain) -> ditarik otomatis secara berkala & digabungkan.
let autoPushDebounce = { docs:null, users:null };
let autoPullInterval = null;
const AUTO_PULL_INTERVAL_MS = 45000; // 45 detik

function scheduleAutoPush(kind){
  if(!state.sheetsUrl || !state.autoSyncEnabled) return;
  clearTimeout(autoPushDebounce[kind]);
  autoPushDebounce[kind] = setTimeout(()=>{
    if(kind==='docs') autoPushDocsNow();
    else autoPushUsersNow();
  }, 2500);
}

async function autoPushDocsNow(){
  if(!state.sheetsUrl || state.syncBusy) return;
  state.syncBusy = true;
  try{
    const ar = state.documents.filter(d=>d.docType==='AR');
    const ap = state.documents.filter(d=>d.docType==='AP');
    const r1 = ar.length ? await sheetsPush('AR', ar) : {added:0,updated:0};
    const r2 = ap.length ? await sheetsPush('AP', ap) : {added:0,updated:0};
    state.documents.forEach(d=>{ if(!state.syncedDocIds.includes(d.id)) state.syncedDocIds.push(d.id); });
    await persistSyncedIds();
    logSync(`Push dokumen — AR: +${r1.added||0}/${r1.updated||0}upd; AP: +${r2.added||0}/${r2.updated||0}upd.`, true);
  }catch(err){
    logSync('Push dokumen gagal: '+err.message, false);
  }
  state.syncBusy = false;
  if(state.view==='sync'){ const mc=document.getElementById('mainContent'); if(mc){ mc.innerHTML = renderSync(); bindPageEvents(); } }
}
async function autoPushUsersNow(){
  if(!state.sheetsUrl || state.syncBusy) return;
  state.syncBusy = true;
  try{
    const r = await sheetsPushUsers(state.users);
    state.users.forEach(u=>{ if(!state.syncedUserIds.includes(u.id)) state.syncedUserIds.push(u.id); });
    await persistSyncedIds();
    logSync(`Push user — +${r.added||0} baru/${r.updated||0} diperbarui.`, true);
  }catch(err){
    logSync('Push user gagal: '+err.message, false);
  }
  state.syncBusy = false;
  if(state.view==='sync'){ const mc=document.getElementById('mainContent'); if(mc){ mc.innerHTML = renderSync(); bindPageEvents(); } }
}

// Hapus lokal + sinkron hapus ke Sheets (dipanggil dari event-bindings.js saat user klik Hapus).
async function deleteDocWithSync(docId){
  const doc = state.documents.find(d=>d.id===docId);
  state.documents = state.documents.filter(d=>d.id!==docId);
  await persistDocs(true); // simpan lokal dulu tanpa memicu auto-push biasa (kita push delete secara eksplisit)
  const wasSynced = state.syncedDocIds.includes(docId);
  state.syncedDocIds = state.syncedDocIds.filter(id=>id!==docId);
  await persistSyncedIds();
  if(wasSynced && state.sheetsUrl && doc){
    try{
      await sheetsDelete(doc.docType, [docId]);
      logSync(`Dokumen ${doc.docId} dihapus &amp; disinkron ke Sheets.`, true);
    }catch(err){
      logSync('Gagal sinkron hapus dokumen ke Sheets: '+err.message, false);
    }
  }
}
async function deleteUserWithSync(userId){
  state.users = state.users.filter(u=>u.id!==userId);
  await persistUsers(true);
  const wasSynced = state.syncedUserIds.includes(userId);
  state.syncedUserIds = state.syncedUserIds.filter(id=>id!==userId);
  await persistSyncedIds();
  if(wasSynced && state.sheetsUrl){
    try{
      await sheetsDelete('Users', [userId]);
      logSync('User dihapus &amp; disinkron ke Sheets.', true);
    }catch(err){
      logSync('Gagal sinkron hapus user ke Sheets: '+err.message, false);
    }
  }
}

// Tarik berkala + deteksi penghapusan eksternal: id yang sebelumnya diketahui tersinkron
// tapi sudah tidak ada lagi di respons Sheets dianggap dihapus dari luar, dan dihapus lokal juga.
// performPull: logika inti tarik + gabung + deteksi hapus. Dipakai baik oleh tombol
// "Tarik Manual" (selalu berjalan, tidak peduli toggle auto-sync) maupun oleh autoPullTick
// (dijadwalkan, dan HANYA berjalan kalau auto-sync sedang aktif).
async function performPull(){
  if(!state.sheetsUrl || state.syncBusy) return;
  state.syncBusy = true;
  try{
    const data = await sheetsPull();
    const ar = (data.AR||[]).map(d=>normalizeSheetDoc(d,'AR'));
    const ap = (data.AP||[]).map(d=>normalizeSheetDoc(d,'AP'));
    const users = (data.users||[]).map(u=>normalizeSheetUser(u));
    const pulledDocIds = new Set([...ar, ...ap].map(d=>d.id));
    const pulledUserIds = new Set(users.map(u=>u.id));

    let changed = false;
    // deteksi dihapus di Sheets -> hapus lokal (hanya utk id yg sebelumnya tersinkron)
    const beforeDocCount = state.documents.length;
    state.documents = state.documents.filter(d=>{
      if(state.syncedDocIds.includes(d.id) && !pulledDocIds.has(d.id)) return false;
      return true;
    });
    if(state.documents.length !== beforeDocCount) changed = true;

    const beforeUserCount = state.users.length;
    if(users.length){
      state.users = state.users.filter(u=>{
        if(state.syncedUserIds.includes(u.id) && !pulledUserIds.has(u.id)) return false;
        return true;
      });
      if(state.users.length !== beforeUserCount) changed = true;
    }

    // gabungkan data baru/diperbarui dari Sheets
    const mergedDocs = mergeById(state.documents, [...ar, ...ap]);
    if(JSON.stringify(mergedDocs.map(d=>d.id+d.updatedAt).sort()) !== JSON.stringify(state.documents.map(d=>d.id+d.updatedAt).sort())) changed = true;
    state.documents = mergedDocs;
    if(users.length){ state.users = mergeById(state.users, users); }

    // update daftar id yang diketahui tersinkron
    state.syncedDocIds = Array.from(new Set([...state.syncedDocIds, ...pulledDocIds]));
    state.syncedUserIds = Array.from(new Set([...state.syncedUserIds, ...pulledUserIds]));

    await persistDocs(true);
    await persistUsers(true);
    await persistSyncedIds();

    logSync(changed ? 'Tarik: perubahan dari Sheets terdeteksi &amp; digabungkan.' : 'Tarik: tidak ada perubahan baru dari Sheets.', true);
    if(changed && ['dashboard','documents','detail','reports','sync'].includes(state.view)) render();
  }catch(err){
    logSync('Tarik gagal: '+err.message, false);
    state.syncBusy = false;
    throw err;
  }
  state.syncBusy = false;
}
async function autoPullTick(){
  if(!state.autoSyncEnabled) return;
  try{ await performPull(); }catch(e){ /* sudah dicatat di log oleh performPull */ }
}

function startAutoSync(){
  stopAutoSync();
  if(!state.sheetsUrl || !state.autoSyncEnabled) return;
  autoPullInterval = setInterval(autoPullTick, AUTO_PULL_INTERVAL_MS);
  // tarik sekali segera saat aktif, jangan tunggu interval pertama
  autoPullTick();
}
function stopAutoSync(){
  if(autoPullInterval){ clearInterval(autoPullInterval); autoPullInterval = null; }
}

