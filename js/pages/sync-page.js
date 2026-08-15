/* ================= GOOGLE SHEETS SYNC PAGE ================= */
function renderSync(){
  const arCount = state.documents.filter(d=>d.docType==='AR').length;
  const apCount = state.documents.filter(d=>d.docType==='AP').length;
  const userCount = state.users.length;
  return `
  <div>
    <h3 class="text-[28px] md:text-[32px] font-bold text-primary leading-tight">Sinkronisasi Google Sheets</h3>
    <p class="text-slate-500">Simpan &amp; tarik data dokumen AR/AP serta Manajemen User dari backend Google Sheets Anda sendiri (sheet terpisah per jenis: AR, AP, Users). Sinkronisasi bersifat <strong>additive (upsert)</strong> — data yang cocok ID-nya diperbarui, data baru ditambahkan, data lain tetap aman, tidak ditimpa.</p>
  </div>

  <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex gap-3">
    ${msi('info','text-[20px] flex-shrink-0')}
    <div>
      <p class="font-bold mb-1">Cara mengaktifkan:</p>
      <ol class="list-decimal list-inside space-y-0.5">
        <li>Buka Google Sheet baru, lalu <strong>Extensions → Apps Script</strong>.</li>
        <li>Tempel kode <code>Code.gs</code> yang disediakan (lihat file terpisah), lalu <strong>Deploy → New deployment → Web app</strong>.</li>
        <li>Set akses "Anyone", lalu salin URL Web App yang dihasilkan ke kolom di bawah ini.</li>
      </ol>
    </div>
  </div>

  <div class="bg-white rounded-xl p-6 soft-lift border border-slate-200 space-y-4">
    <div>
      <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">URL Web App Google Apps Script</label>
      <div class="flex gap-3">
        <input id="sheetsUrlInput" value="${state.sheetsUrl}" placeholder="https://script.google.com/macros/s/AKfycb.../exec" class="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary font-mono">
        <button type="button" id="saveSheetsUrlBtn" class="px-4 py-2.5 bg-slate-800 text-white font-bold rounded-lg text-sm hover:opacity-90">Simpan</button>
      </div>
    </div>
    <div class="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
      <div>
        <p class="text-sm font-bold text-slate-700 flex items-center gap-2">${msi('sync','text-[18px]')} Sinkronisasi Otomatis</p>
        <p class="text-xs text-slate-400">Push otomatis ${AUTO_PULL_INTERVAL_MS/1000 - 2.5}&ndash;3 detik setelah ada perubahan (tambah/ubah/hapus). Tarik otomatis tiap ${AUTO_PULL_INTERVAL_MS/1000} detik, termasuk mendeteksi data yang dihapus di Sheets.</p>
      </div>
      <button type="button" id="toggleAutoSyncBtn" class="relative w-12 h-6 rounded-full transition-colors ${state.autoSyncEnabled?'bg-primary':'bg-slate-300'}">
        <span class="absolute top-0.5 ${state.autoSyncEnabled?'left-6':'left-0.5'} w-5 h-5 bg-white rounded-full transition-all shadow"></span>
      </button>
    </div>
    <div class="flex flex-wrap gap-3">
      <button type="button" id="testConnBtn" class="px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold hover:bg-slate-50 flex items-center gap-2">${msi('wifi_tethering','text-[18px]')} Tes Koneksi</button>
      <button type="button" id="pushSheetsBtn" class="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:opacity-90 flex items-center gap-2">${msi('cloud_upload','text-[18px]')} Push Manual (${arCount} AR / ${apCount} AP / ${userCount} User)</button>
      <button type="button" id="pullSheetsBtn" class="px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold hover:opacity-90 flex items-center gap-2">${msi('cloud_download','text-[18px]')} Tarik Manual</button>
    </div>
    <p class="text-xs text-slate-400">Push/Tarik bersifat <strong>additive (upsert by ID)</strong> untuk data baru/berubah. Data yang dihapus di salah satu sisi (SIMONA atau Sheets) akan ikut dihapus di sisi lain saat sinkron berikutnya — pastikan ini memang yang diinginkan.</p>
  </div>

  <div class="bg-white rounded-xl soft-lift border border-slate-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-100"><h4 class="font-bold text-primary">Log Sinkronisasi</h4></div>
    <div class="p-6 space-y-2">
      ${state.syncLog.length ? state.syncLog.map(l=>`
      <div class="flex items-center gap-2.5 text-sm ${l.ok?'text-slate-600':'text-red-600'}">
        ${msi(l.ok?'check_circle':'error', 'text-[16px]')}
        <span>${l.msg}</span>
        <span class="text-[11px] text-slate-400 ml-auto">${fmtDate(l.date)}</span>
      </div>`).join('') : '<p class="text-sm text-slate-400">Belum ada aktivitas sinkronisasi.</p>'}
    </div>
  </div>`;
}

