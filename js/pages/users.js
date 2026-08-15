/* ================= USER MANAGEMENT ================= */
function renderUsers(){
  return `
  <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h3 class="text-[28px] md:text-[32px] font-bold text-primary leading-tight">Manajemen User</h3>
      <p class="text-slate-500">Daftarkan user baru &amp; atur hak ubah status/proses dan status disburse per divisi.</p>
    </div>
    <button type="button" data-action="add-user" class="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition-colors active:scale-95 shadow-md">
      ${msi('person_add','text-[20px]')} Tambah User
    </button>
  </div>

  <div class="bg-white rounded-xl soft-lift border border-slate-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-100">
      <h4 class="font-bold text-primary">Daftar User (${state.users.length})</h4>
    </div>
    <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse text-sm">
      <thead><tr class="bg-slate-50 border-b border-slate-200">
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Nama</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">User ID / Email</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Role</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Divisi</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Hak Ubah Status/Proses</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Hak Ubah Disburse</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 text-right">Aksi</th>
      </tr></thead>
      <tbody class="divide-y divide-slate-100">
        ${state.users.map(u=>{
          const roleBadge = u.role==='Super User' ? 'bg-purple-100 text-purple-700' : u.role==='Admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600';
          const perms = u.permissions || {editStatus:false, editDisburse:false};
          const fullAccess = u.role==='Super User';
          const yesNo = (v)=> `<span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${v?'bg-green-100 text-green-700':'bg-red-50 text-red-500'}">${v?'Ya':'Tidak'}</span>`;
          return `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-3.5">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">${initials(u.name)}</div>
              <span class="font-bold text-slate-800">${u.name}</span>
            </div>
          </td>
          <td class="px-6 py-3.5 text-slate-500 font-mono text-xs">${u.email}</td>
          <td class="px-6 py-3.5"><span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${roleBadge}">${u.role}</span></td>
          <td class="px-6 py-3.5 text-slate-600 text-xs">${u.role==='Staff' ? (u.dept || '—') : '<span class="font-bold text-blue-600">Semua Divisi</span>'}</td>
          <td class="px-6 py-3.5">${fullAccess ? yesNo(true) : yesNo(perms.editStatus)}</td>
          <td class="px-6 py-3.5">${fullAccess ? yesNo(true) : yesNo(perms.editDisburse)}</td>
          <td class="px-6 py-3.5 text-right whitespace-nowrap">
            <button type="button" data-edit-user="${u.id}" class="p-1.5 text-slate-400 hover:text-primary" title="Ubah">${msi('edit','text-[18px]')}</button>
            <button type="button" data-del-user="${u.id}" class="p-1.5 text-slate-400 hover:text-red-600" title="Hapus">${msi('delete','text-[18px]')}</button>
          </td>
        </tr>`;}).join('')}
      </tbody>
    </table>
    </div>
  </div>`;
}

function renderUserModal(){
  const {mode, user} = state.userModal;
  const isEdit = mode==='edit';
  const perms = user.permissions || {editStatus:false, editDisburse:false};
  const isSuper = user.role==='Super User';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4';
  wrap.id = 'userModalBg';
  wrap.innerHTML = `
    <div class="bg-white rounded-xl w-full max-w-md modal-shadow fade-in">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 class="text-lg font-bold text-primary">${isEdit?'Ubah User':'Tambah User Baru'}</h3>
        <button type="button" id="userModalCloseBtn" class="text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
      </div>
      <div class="px-6 py-5 space-y-4">
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Nama Lengkap</label>
          <input id="u-name" value="${user.name||''}" placeholder="Nama pengguna" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
        </div>
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">User ID / Email</label>
          <input id="u-email" value="${user.email||''}" placeholder="nama.pengguna" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
        </div>
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Role</label>
          <select id="u-role" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary">
            <option value="Staff" ${user.role==='Staff'?'selected':''}>Staff (dibatasi per divisi)</option>
            <option value="Admin" ${user.role==='Admin'?'selected':''}>Admin (akses semua divisi)</option>
            <option value="Super User" ${user.role==='Super User'?'selected':''}>Super User (akses &amp; hak penuh)</option>
          </select>
        </div>
        <div id="u-dept-wrap" class="${user.role!=='Staff'?'hidden':''}">
          <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Divisi</label>
          <select id="u-dept" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary">
            ${DEPARTMENTS.map(d=>`<option value="${d}" ${user.dept===d?'selected':''}>${d}</option>`).join('')}
          </select>
        </div>
        <div id="u-perms-wrap" class="border border-slate-200 rounded-lg p-3 space-y-2 ${isSuper?'opacity-50':''}">
          <p class="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Hak Akses</p>
          <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" id="u-perm-status" class="rounded border-slate-300 text-primary focus:ring-primary" ${perms.editStatus||isSuper?'checked':''} ${isSuper?'disabled':''}>
            Hak Ubah Status/Proses Dokumen
          </label>
          <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" id="u-perm-disburse" class="rounded border-slate-300 text-primary focus:ring-primary" ${perms.editDisburse||isSuper?'checked':''} ${isSuper?'disabled':''}>
            Hak Ubah Flag Dealer (Disburse)
          </label>
          ${isSuper ? '<p class="text-[11px] text-slate-400">Super User otomatis memiliki semua hak akses.</p>' : ''}
        </div>
      </div>
      <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
        <button type="button" id="userModalCancelBtn" class="px-4 py-2.5 border border-slate-300 rounded-lg font-semibold text-sm text-slate-600 hover:bg-slate-50">Batal</button>
        <button type="button" id="userModalSaveBtn" class="px-5 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:opacity-90">${isEdit?'Simpan Perubahan':'Daftarkan User'}</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  const close = ()=>{ state.userModal=null; wrap.remove(); };
  document.getElementById('userModalCloseBtn').onclick = close;
  document.getElementById('userModalCancelBtn').onclick = close;
  wrap.onclick = (e)=>{ if(e.target===wrap) close(); };
  document.getElementById('u-role').onchange = (e)=>{
    const role = e.target.value;
    document.getElementById('u-dept-wrap').classList.toggle('hidden', role!=='Staff');
    const permsWrap = document.getElementById('u-perms-wrap');
    const statusCb = document.getElementById('u-perm-status');
    const disburseCb = document.getElementById('u-perm-disburse');
    const isSuperNow = role==='Super User';
    permsWrap.classList.toggle('opacity-50', isSuperNow);
    statusCb.disabled = isSuperNow; disburseCb.disabled = isSuperNow;
    if(isSuperNow){ statusCb.checked = true; disburseCb.checked = true; }
  };

  document.getElementById('userModalSaveBtn').onclick = async ()=>{
    const name = document.getElementById('u-name').value.trim();
    const email = document.getElementById('u-email').value.trim();
    if(!name || !email){ showToast('Nama dan User ID/Email wajib diisi','error','error'); return; }
    const role = document.getElementById('u-role').value;
    const dept = role==='Staff' ? document.getElementById('u-dept').value : null;
    const permissions = {
      editStatus: role==='Super User' ? true : document.getElementById('u-perm-status').checked,
      editDisburse: role==='Super User' ? true : document.getElementById('u-perm-disburse').checked,
    };
    if(isEdit){
      const idx = state.users.findIndex(u=>u.id===user.id);
      state.users[idx] = {...state.users[idx], name, email, role, dept, permissions};
      showToast('Data user diperbarui');
    } else {
      state.users.push({id:cryptoId(), name, email, role, dept, permissions});
      showToast('User baru berhasil didaftarkan');
    }
    await persistUsers();
    close();
    render();
  };
}

