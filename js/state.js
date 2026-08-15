/* ================= STATE ================= */
let state = {
  view:'login', user:null, documents:[], users:[], loaded:false,
  search:'', statusFilter:'all', deptFilter:'all', typeFilter:'all',
  dashSearch:'', dashSearchBy:'nama', dashSettlement:'all',
  modal:null, userModal:null, detailId:null, loginError:'', showPw:false,
  sheetsUrl:'', syncLog:[], syncBusy:false,
  reportMonths:[], reportYears:[],
  // Auto-sync: dua arah, termasuk penghapusan (lihat sync-sheets.js)
  autoSyncEnabled:true, syncedDocIds:[], syncedUserIds:[], autoSyncTimer:null,
};

const SYNCED_IDS_KEY = 'simona:synced-ids';
const AUTO_SYNC_KEY = 'simona:autosync-enabled';

async function initStorage(){
  state.documents = seedDocuments();
  state.users = seedUsers();
  try{
    const r = await window.storage.get(DOCS_KEY, false);
    if(r && r.value){ const parsed = JSON.parse(r.value); if(parsed.length) state.documents = parsed; }
  }catch(e){ /* keep seed */ }
  try{
    const r2 = await window.storage.get(USERS_KEY, false);
    if(r2 && r2.value){ const parsed = JSON.parse(r2.value); if(parsed.length) state.users = parsed; }
  }catch(e){ /* keep seed */ }
  try{
    const r3 = await window.storage.get(SHEETS_URL_KEY, false);
    if(r3 && r3.value) state.sheetsUrl = r3.value;
  }catch(e){ /* keep empty */ }
  try{
    const r4 = await window.storage.get(SYNCED_IDS_KEY, false);
    if(r4 && r4.value){ const parsed = JSON.parse(r4.value); state.syncedDocIds = parsed.docIds||[]; state.syncedUserIds = parsed.userIds||[]; }
  }catch(e){ /* keep empty */ }
  try{
    const r5 = await window.storage.get(AUTO_SYNC_KEY, false);
    if(r5 && r5.value!==undefined) state.autoSyncEnabled = r5.value !== 'false';
  }catch(e){ /* keep default true */ }
  state.loaded = true;
  await persistDocs(true); // true = skip auto-push saat inisialisasi awal
  await persistUsers(true);
  if(state.view==='login') render();
  if(typeof startAutoSync === 'function') startAutoSync();
}
async function persistDocs(skipAutoPush){
  try{ await window.storage.set(DOCS_KEY, JSON.stringify(state.documents), false); }
  catch(e){ console.error('Gagal menyimpan dokumen', e); }
  if(!skipAutoPush && typeof scheduleAutoPush === 'function') scheduleAutoPush('docs');
}
async function persistUsers(skipAutoPush){
  try{ await window.storage.set(USERS_KEY, JSON.stringify(state.users), false); }
  catch(e){ console.error('Gagal menyimpan user', e); }
  if(!skipAutoPush && typeof scheduleAutoPush === 'function') scheduleAutoPush('users');
}
async function persistSheetsUrl(){ try{ await window.storage.set(SHEETS_URL_KEY, state.sheetsUrl, false); }catch(e){ console.error('Gagal menyimpan URL Sheets', e); } }
async function persistSyncedIds(){ try{ await window.storage.set(SYNCED_IDS_KEY, JSON.stringify({docIds:state.syncedDocIds, userIds:state.syncedUserIds}), false); }catch(e){ /* noop */ } }
async function persistAutoSyncEnabled(){ try{ await window.storage.set(AUTO_SYNC_KEY, String(state.autoSyncEnabled), false); }catch(e){ /* noop */ } }

