/* ================= DETAIL PAGE ================= */
function renderDetail(){
  const doc = state.documents.find(d=>d.id===state.detailId);
  if(!doc) return `<div class="text-center py-20 text-slate-400">Dokumen tidak ditemukan.</div>`;
  const timeline = statusTimeline(doc);
  const permitted = canEditStatus(doc);
  const permittedDisburse = canEditDisburse(doc);
  const settled = isSettled(doc);

  return `
  <nav class="flex text-slate-400 text-xs gap-2 items-center mb-1">
    <button type="button" data-nav="documents" class="hover:text-primary font-semibold">Daftar Dokumen</button>
    ${msi('chevron_right','text-[14px]')}
    <span class="font-bold text-primary">${doc.docId}</span>
  </nav>

  <section class="bg-white rounded-xl p-6 soft-lift border border-slate-200">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h3 class="text-lg font-bold text-primary flex items-center gap-2">Status &amp; Riwayat SLA <span class="px-2 py-0.5 rounded text-[10px] font-black ${TYPE_BADGE[doc.docType]}">${doc.docType}</span></h3>
        <p class="text-slate-500 text-sm">Waktu yang dihabiskan dokumen ini pada setiap tahap status.</p>
      </div>
      <span class="px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[doc.status]}">${doc.status.toUpperCase()}</span>
    </div>
    <div class="space-y-2">
      ${timeline.map(t=>`
      <div class="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg ${t.ongoing?'bg-blue-50 border border-blue-100':'bg-slate-50 border border-slate-100'}">
        <div class="flex items-center gap-3">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_BADGE[t.status]}">${t.status}</span>
          <span class="text-xs text-slate-500">${fmtDate(t.start)} ${t.ongoing?'— sekarang':'→ '+fmtDate(t.end)}</span>
        </div>
        <span class="text-xs font-bold ${t.ongoing?'text-blue-600':'text-slate-600'}">${fmtDuration(t.end-t.start)}${t.ongoing?' (berjalan)':''}</span>
      </div>`).join('')}
    </div>
  </section>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    <div class="lg:col-span-7 space-y-6">
      <div class="bg-white rounded-xl p-6 soft-lift border border-slate-200">
        <div class="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
          <div class="p-3 bg-secondary-container rounded-lg text-primary">${msi('description','text-[28px]')}</div>
          <div>
            <h4 class="text-base font-bold text-primary">${doc.title}</h4>
            <p class="text-slate-400 text-xs">Ref: ${doc.docId}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-y-5 gap-x-8 text-sm">
          <div><span class="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Related Dept</span><p class="font-semibold text-slate-800">${doc.relatedDept}</p></div>
          <div><span class="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Jenis Dokumen</span><p class="font-semibold text-slate-800">${DOC_TYPE_LABEL[doc.docType]}</p></div>
          <div><span class="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">No. Invoice</span><p class="font-semibold text-slate-800 font-mono">${doc.noInvoice||'—'}</p></div>
          <div><span class="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Nominal</span><p class="font-semibold text-slate-800">${fmtIDR(doc.nominal)}</p></div>
          <div><span class="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Tgl Invoice</span><p class="font-semibold text-slate-800">${fmtDateShort(doc.tglInvoice)}</p></div>
          <div><span class="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Tgl Terima</span><p class="font-semibold text-slate-800">${fmtDateShort(doc.tglTerima)}</p></div>
          <div><span class="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Sumber</span><p class="font-semibold text-slate-800">${doc.sumber||'Lainnya'}</p></div>
          <div><span class="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Diajukan Oleh</span><p class="font-semibold text-slate-800">${doc.submittedBy}</p></div>
          <div class="col-span-2"><span class="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Keterangan</span><p class="text-slate-600 leading-relaxed">${doc.description||'—'}</p></div>
        </div>
        <div class="mt-6">
          <h5 class="text-xs font-bold uppercase tracking-wide text-primary mb-3 flex items-center gap-1.5">${msi('attachment','text-[16px]')} Lampiran (${doc.attachments.length})</h5>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${doc.attachments.map(a=>`
            <div class="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-primary transition-colors cursor-pointer group" data-download-attachment="${doc.id}">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 bg-slate-100 rounded flex items-center justify-center text-red-500 flex-shrink-0">${msi('picture_as_pdf')}</div>
                <div class="min-w-0"><p class="text-sm font-medium truncate">${a.name}</p><p class="text-[10px] text-slate-400">${a.size}${a.url?' &middot; <span class="text-green-600 font-semibold">Google Drive</span>':''}</p></div>
              </div>
              ${a.url ? msi('open_in_new','text-slate-400 group-hover:text-primary flex-shrink-0') : msi('download','text-slate-400 group-hover:text-primary flex-shrink-0')}
            </div>`).join('') || '<p class="text-xs text-slate-400">Tidak ada lampiran.</p>'}
          </div>
          <div class="mt-3 flex items-center gap-3">
            <input type="file" id="replaceFileInput" accept=".pdf,.jpg,.jpeg,.png" class="hidden">
            <button type="button" id="replaceFileBtn" class="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5">${msi('upload_file','text-[16px]')} ${doc.attachments.length?'Ganti File':'Unggah File'}</button>
            <span id="replaceFileStatus" class="text-xs text-slate-400"></span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-6 soft-lift border border-slate-200">
        <h4 class="text-base font-bold text-primary mb-1 flex items-center gap-2">${msi('paid','text-[20px]')} Flag Dealer (Disburse)</h4>
        ${permittedDisburse ? `
        <p class="text-slate-500 text-sm mb-4">${doc.docType==='AP' ? 'Apakah dana yang dibayarkan pada dokumen ini dibebankan ke dealer?' : 'Apakah dana pencairan dokumen ini akan disalurkan ke dealer?'}</p>
        <div class="flex flex-wrap gap-3 items-center">
          <label class="text-xs font-bold text-slate-500">${disburseQuestion(doc.docType)}</label>
          <select id="disburseSelect" class="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary">
            <option value="No" ${doc.disburse!=='Yes'?'selected':''}>No</option>
            <option value="Yes" ${doc.disburse==='Yes'?'selected':''}>Yes</option>
          </select>
          <button type="button" data-action="update-disburse" data-id="${doc.id}" class="px-5 py-2.5 bg-teal-600 text-white font-bold rounded-lg hover:opacity-90 transition-colors active:scale-95">Simpan</button>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${doc.disburse==='Yes'?'bg-green-100 text-green-700':'bg-slate-100 text-slate-500'}">Saat ini: ${doc.disburse==='Yes'?'Yes':'No'}</span>
        </div>
        ` : `
        <div class="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          ${msi('lock','text-[18px]')} Anda tidak memiliki hak untuk mengubah flag dealer (disburse) dokumen ini.
        </div>`}
      </div>

      <div class="bg-white rounded-xl p-6 soft-lift border border-slate-200">
        <h4 class="text-base font-bold text-primary mb-1 flex items-center gap-2">${msi('sync_alt','text-[20px]')} Ubah Status Dokumen</h4>
        ${permitted ? `
        <p class="text-slate-500 text-sm mb-4">Anda memiliki izin mengubah status untuk dokumen di <strong>${doc.relatedDept}</strong>.</p>
        <div class="flex flex-wrap gap-3 items-center">
          <select id="statusSelect" class="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary">
            ${STATUS_LIST.map(s=>`<option value="${s}" ${doc.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <input id="statusComment" placeholder="Catatan perubahan status (opsional)" class="flex-1 min-w-[220px] border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
          <button type="button" data-action="update-status" data-id="${doc.id}" class="px-5 py-2.5 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition-colors active:scale-95">Update Status</button>
        </div>
        ` : `
        <div class="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          ${msi('lock','text-[18px]')} Anda tidak memiliki hak untuk mengubah status/proses dokumen ini.
        </div>`}
      </div>
    </div>

    <div class="lg:col-span-5 space-y-6">
      <div class="bg-white rounded-xl p-6 soft-lift border border-slate-200">
        <h4 class="text-base font-bold text-primary mb-5 flex items-center gap-2">${msi('forum','text-[20px]')} Riwayat &amp; Komentar Audit</h4>
        <div class="space-y-5 max-h-[420px] overflow-y-auto pr-1">
          ${doc.auditTrail.slice().reverse().map(t=>`
          <div class="flex gap-3">
            <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white
              ${t.type==='status_change'?'bg-blue-600':t.type==='submit'?'bg-slate-400':'bg-primary'}">${initials(t.author)}</div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-bold text-slate-800">${t.author}</p>
                <span class="text-[10px] text-slate-400">${t.role}</span>
                ${t.type==='status_change' ? `<span class="text-[10px] font-bold text-blue-600">${t.statusFrom} → ${t.statusTo}</span>` : ''}
              </div>
              <p class="text-[11px] text-slate-400 mb-1">${fmtDate(t.date)}</p>
              <p class="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">${t.comment}</p>
            </div>
          </div>`).join('')}
        </div>
        <div class="mt-5 pt-5 border-t border-slate-100">
          <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Tambah Komentar</label>
          <textarea id="commentInput" rows="3" placeholder="Tulis catatan atau komentar audit..." class="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"></textarea>
          <button type="button" data-action="add-comment" data-id="${doc.id}" class="mt-3 w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition-all text-sm">Kirim Komentar</button>
        </div>
      </div>
    </div>
  </div>`;
}

