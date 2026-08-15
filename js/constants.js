/* ================= PENYIMPANAN TERPADU ================= */
// window.storage hanya tersedia saat SIMONA dijalankan di dalam Claude Artifacts.
// Saat di-hosting sendiri (GitHub Pages, Netlify, server kantor, dll), window.storage
// TIDAK ADA — jadi di sini otomatis jatuh ke localStorage bawaan browser, yang tersimpan
// permanen per-domain selama browser/cache tidak dibersihkan pengguna.
const simonaStorage = {
  async get(key, shared){
    if(window.storage && typeof window.storage.get === 'function'){
      try{ const r = await window.storage.get(key, shared); if(r) return r; }
      catch(e){ /* window.storage ada tapi gagal (mis. key belum pernah diset) -> coba localStorage */ }
    }
    try{
      const val = localStorage.getItem(key);
      return val !== null ? { key, value: val, shared: !!shared } : null;
    }catch(e){ return null; }
  },
  async set(key, value, shared){
    if(window.storage && typeof window.storage.set === 'function'){
      try{ const r = await window.storage.set(key, value, shared); if(r) return r; }
      catch(e){ /* fallback ke localStorage di bawah */ }
    }
    try{
      localStorage.setItem(key, value);
      return { key, value, shared: !!shared };
    }catch(e){ return null; }
  },
};
 
/* ================= ICONS ================= */
const msi = (name, extra='') => `<span class="material-symbols-outlined ${extra}">${name}</span>`;
 
/* ================= CONSTANTS ================= */
const DEPARTMENTS = ['FPA Dept.','VSD Dept.','Acc & Tax Dept.','RB Dept.','Aftersales Dept.','LNK Dept.','Audit Internal Dept.','HC Dept.','GA & Legal Dept.','Corporate Strategy Dept.','Fleet & GSO Dept.','Direksi Dept.'];
const DOC_TYPES = ['AR','AP'];
const DOC_TYPE_LABEL = {AR:'AR (Account Receivable)', AP:'AP (Account Payable)'};
// "Disburse" adalah flag yang ditentukan di AWAL pengajuan dokumen, menandai apakah dana ini
// terkait dealer: untuk AR = akan disalurkan ke dealer; untuk AP = dibebankan ke dealer.
function disburseQuestion(docType){ return docType==='AP' ? 'Dibebankan ke Dealer?' : 'Disalurkan ke Dealer?'; }
function disburseShortLabel(docType){ return docType==='AP' ? 'Dibebankan Dealer' : 'Disalurkan Dealer'; }
const STATUS_LIST = ['Draft','Proses Tax','Proses Acc','Proses Evopay','Tagih','Cair','Bayar'];
const SUMBER = ['TAM','Affiliasi','Main Dealer','Lainnya'];
const DOCS_KEY = 'doctrack:documents:v2';
const USERS_KEY = 'doctrack:users:v2';
const SHEETS_URL_KEY = 'doctrack:sheets-url';
 
const STATUS_BADGE = {
  'Draft': 'bg-slate-100 text-slate-600',
  'Proses Tax': 'bg-amber-100 text-amber-700',
  'Proses Acc': 'bg-orange-100 text-orange-700',
  'Proses Evopay': 'bg-purple-100 text-purple-700',
  'Tagih': 'bg-blue-100 text-blue-700',
  'Cair': 'bg-green-100 text-green-700',
  'Bayar': 'bg-teal-100 text-teal-700',
};
const TYPE_BADGE = { AR:'bg-indigo-100 text-indigo-700', AP:'bg-rose-100 text-rose-700' };
 
function cryptoId(){ return 'id-' + Math.random().toString(36).slice(2,10) + Date.now().toString(36); }
function initials(name){ return (name||'').split(' ').map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase(); }
function fmtDate(iso){
  if(!iso) return '—';
  const d = new Date(iso);
  if(isNaN(d)) return String(iso);
  return d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) + ', ' + d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
}
function fmtDateShort(iso){
  if(!iso) return '—';
  const d = new Date(iso);
  if(isNaN(d)) return String(iso);
  return d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
}
function fmtIDR(n){ return 'Rp' + Number(n||0).toLocaleString('id-ID'); }
function timeAgo(iso){
  const diffMs = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diffMs/3600000);
  if(h < 1) return 'Baru saja';
  if(h < 24) return h+' jam lalu';
  const d = Math.floor(h/24);
  if(d===1) return 'Kemarin';
  if(d<7) return d+' hari lalu';
  return new Date(iso).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
}
function fmtDuration(ms){
  if(ms<0) ms=0;
  const h = Math.floor(ms/3600000);
  if(h < 1) return '< 1 jam';
  if(h < 24) return h+' jam';
  const d = Math.floor(h/24), rh = h%24;
  return d+' hari'+(rh>0?' '+rh+' jam':'');
}
function isSettled(doc){ return (doc.docType==='AR' && doc.status==='Cair') || (doc.docType==='AP' && doc.status==='Bayar'); }
function hasDeptAccess(doc){
  if(!state.user) return false;
  if(state.user.role==='Super User' || state.user.role==='Admin') return true;
  return state.user.dept === doc.relatedDept;
}
function canEditStatus(doc){
  if(!state.user) return false;
  if(state.user.role==='Super User') return true;
  if(!hasDeptAccess(doc)) return false;
  return !!(state.user.permissions && state.user.permissions.editStatus);
}
function canEditDisburse(doc){
  if(!state.user) return false;
  if(state.user.role==='Super User') return true;
  if(!hasDeptAccess(doc)) return false;
  return !!(state.user.permissions && state.user.permissions.editDisburse);
}
 
 
