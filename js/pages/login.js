/* ================= LOGIN ================= */
const LOGO_URL = 'https://lh3.googleusercontent.com/aida/AP1WRLsjRFUSx5c7Dxt5n-jO8remjuz9hGppqSrjVu7qNYRZpaL2Bw8aBn5QHhIpFxqtjuKXtlvvE4RvbYav1cXb2128GiLunvk1PY51zhYqiefCS3Vo-0V5ERgpGNQystxf6WBRk7oYRELCAvVJxPvVutzLF2ZlZvNydyy6IQ_2NmUeBuhy26e0zDJmyerg-ECsyGKbXl58SG0X7-CGCESo53ugrkL0acJrJclFxCKhgtY7UHVgdLoCsWHxUzv8';

function renderLogin(){
  return `
  <main class="flex-grow flex items-center justify-center px-4 md:px-8 py-12 relative overflow-hidden min-h-screen bg-surface-container-low">
    <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-secondary-fixed opacity-20 blur-3xl rounded-full"></div>
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-fixed opacity-20 blur-3xl rounded-full"></div>
    </div>
    <div class="w-full max-w-[440px] z-10">
      <div class="bg-white soft-lift rounded-xl p-8 md:p-10 border border-slate-200">
        <div class="flex flex-col items-center text-center mb-6">
          <img src="${LOGO_URL}" alt="PT New Ratna Motor Logo" class="h-11 w-auto object-contain mb-6">
          <h1 class="text-[20px] font-bold text-primary mb-1">SIMONA</h1>
          <h2 class="text-[22px] font-bold text-slate-900">Sistem Monitoring ArAp</h2>
          <p class="text-sm text-slate-500 mt-2 px-2">Silakan masuk untuk mengakses sistem pelacakan &amp; validasi dokumen.</p>
        </div>
        ${state.loginError ? `<div class="bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-lg mb-4 border border-red-200">${state.loginError}</div>` : ''}
        <div class="mb-5">
          <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Login cepat sebagai (demo)</label>
          <select id="quickLogin" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary">
            <option value="">— Login manual (akses penuh) —</option>
            ${state.users.map(u=>`<option value="${u.id}">${u.name} — ${u.role}${u.dept?' · '+u.dept:''}</option>`).join('')}
          </select>
        </div>
        <div id="loginForm" class="space-y-5">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">User ID atau Email</label>
            <div class="relative">
              ${msi('person','absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]')}
              <input id="identifier" type="text" value="andi.wijaya" placeholder="Masukkan ID atau email Anda"
                class="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Kata Sandi</label>
            <div class="relative">
              ${msi('lock','absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]')}
              <input id="password" type="${state.showPw?'text':'password'}" value="demo1234" placeholder="Masukkan kata sandi"
                class="w-full pl-10 pr-12 py-3 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
              <button type="button" id="pwToggle" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
                ${msi(state.showPw?'visibility_off':'visibility','text-[20px]')}
              </button>
            </div>
          </div>
          <button type="button" id="loginSubmitBtn" class="w-full py-3.5 bg-primary text-white font-bold rounded-lg hover:opacity-90 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2">
            Masuk ke Sistem ${msi('login','text-[20px]')}
          </button>
        </div>
        <div class="mt-8 pt-6 border-t border-slate-100 text-center flex items-center justify-center gap-2 text-slate-400">
          ${msi('verified_user','text-[16px]')}
          <p class="text-[11px]">Koneksi terenkripsi &middot; mode demo</p>
        </div>
      </div>
    </div>
  </main>`;
}
function bindLogin(){
  document.getElementById('pwToggle').onclick = ()=>{ state.showPw=!state.showPw; render(); };
  const doLogin = async ()=>{
    const idf = document.getElementById('identifier').value.trim();
    const pw = document.getElementById('password').value.trim();
    if(!idf || !pw){ state.loginError='Mohon isi User ID/Email dan kata sandi.'; render(); return; }
    const btn = document.getElementById('loginSubmitBtn');
    btn.disabled = true; btn.innerHTML = 'Memproses...';
    if(!state.loaded) await initStorage();
    const quickId = document.getElementById('quickLogin').value;
    setTimeout(()=>{
      state.loginError='';
      const picked = state.users.find(u=>u.id===quickId);
      if(picked){
        state.user = { name:picked.name, role:picked.role, dept:picked.dept, permissions:picked.permissions||{editStatus:false,editDisburse:false}, initials: initials(picked.name) };
      } else {
        state.user = { name: idf.includes('@')?idf.split('@')[0]:idf.replace('.',' '), role:'Super User', dept:null, permissions:{editStatus:true,editDisburse:true}, initials: idf.slice(0,2).toUpperCase() };
      }
      state.view='dashboard';
      render();
    }, 450);
  };
  document.getElementById('loginSubmitBtn').onclick = doLogin;
  ['identifier','password'].forEach(id=>{
    document.getElementById(id).addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
  });
}

