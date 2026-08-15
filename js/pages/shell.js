/* ================= SHELL ================= */
function renderShell(){
  const nav = [
    {id:'dashboard', label:'Dashboard', icon:'dashboard'},
    {id:'documents', label:'Daftar Dokumen', icon:'description'},
    {id:'reports', label:'Laporan', icon:'analytics'},
    {id:'users', label:'Manajemen User', icon:'manage_accounts'},
    {id:'sync', label:'Sinkronisasi Sheets', icon:'cloud_sync'},
  ];
  return `
  <div class="flex min-h-screen bg-surface-container-low">
    <aside class="hidden md:flex flex-col h-screen py-6 px-4 gap-2 border-r border-slate-200 bg-white docked left-0 w-72 fixed z-40">
      <div class="mb-6 px-2 flex items-center justify-center py-2">
        <img src="${LOGO_URL}" alt="PT New Ratna Motor Logo" class="h-9 object-contain">
      </div>
      <div class="px-2 pb-4 mb-2 border-b border-slate-100">
        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">SIMONA</p>
        <p class="text-xs text-slate-500">Sistem Monitoring ArAp — PT New Ratna Motor</p>
      </div>
      <nav class="flex-1 flex flex-col gap-1">
        ${nav.map(n=>`
        <button type="button" data-nav="${n.id}" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 text-left
          ${state.view===n.id ? 'bg-secondary-container text-on-secondary-container' : 'text-slate-600 hover:bg-slate-100'}">
          ${msi(n.icon)}<span>${n.label}</span>
        </button>`).join('')}
      </nav>
      <div class="mt-auto flex flex-col gap-1 pt-4 border-t border-slate-100">
        <div class="flex items-center gap-3 px-3 py-2.5">
          <div class="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">${state.user.initials}</div>
          <div class="min-w-0">
            <p class="text-sm font-bold truncate">${state.user.name}</p>
            <p class="text-[11px] text-slate-400 uppercase tracking-wide truncate">${state.user.role}${state.user.dept?' · '+state.user.dept:''}</p>
          </div>
        </div>
        <button type="button" id="logoutBtn" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-all">
          ${msi('logout')}<span>Keluar</span>
        </button>
      </div>
    </aside>

    <div class="flex-1 flex flex-col md:ml-72 min-w-0">
      <header class="flex justify-between items-center px-4 md:px-8 h-16 w-full z-30 bg-white shadow-sm sticky top-0">
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <div class="hidden md:flex items-center relative w-full max-w-sm">
            ${msi('search','absolute left-3 text-slate-400 text-[20px]')}
            <input id="globalSearch" placeholder="Cari ID dokumen, judul, atau no. invoice..."
              class="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm w-full focus:ring-2 focus:ring-primary transition-all outline-none">
          </div>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">${msi('notifications')}</button>
          <div class="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">${state.user.initials}</div>
            <div class="text-right hidden sm:block">
              <p class="text-sm font-bold leading-tight">${state.user.name}</p>
              <p class="text-[10px] text-slate-400 uppercase tracking-wider">${state.user.role}</p>
            </div>
          </div>
        </div>
      </header>
      <main id="mainContent" class="p-4 md:p-8 space-y-6 max-w-[1440px] w-full mx-auto"></main>
    </div>
  </div>`;
}

function bindShell(){
  const main = document.getElementById('mainContent');
  if(state.view==='dashboard') main.innerHTML = renderDashboard();
  if(state.view==='documents') main.innerHTML = renderDocuments();
  if(state.view==='detail') main.innerHTML = renderDetail();
  if(state.view==='reports') main.innerHTML = renderReports();
  if(state.view==='users') main.innerHTML = renderUsers();
  if(state.view==='sync') main.innerHTML = renderSync();

  document.querySelectorAll('[data-nav]').forEach(el=>{
    el.onclick = ()=>{ state.view = el.dataset.nav; state.modal=null; state.userModal=null; state.detailId=null; render(); };
  });
  document.getElementById('logoutBtn').onclick = ()=>{ state.user=null; state.view='login'; state.loginError=''; render(); };
  const gs = document.getElementById('globalSearch');
  if(gs){
    gs.value = state.search;
    gs.oninput = (e)=>{ state.search=e.target.value; state.view='documents'; render(); };
  }

  bindPageEvents();
  if(state.modal) renderModal();
  if(state.userModal) renderUserModal();
}

