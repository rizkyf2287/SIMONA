/* ================= MODAL: ADD / EDIT DOCUMENT ================= */
function renderModal(){
  const {mode, doc} = state.modal;
  const isEdit = mode==='edit';
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4';
  wrap.id = 'modalBg';
  wrap.innerHTML = `
    <div class="bg-white rounded-xl w-full max-w-lg modal-shadow max-h-[90vh] overflow-y-auto fade-in">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
        <h3 class="text-lg font-bold text-primary">${isEdit?'Ubah Dokumen':'Pengajuan Dokumen Baru'} <span class="px-2 py-0.5 rounded text-[10px] font-black align-middle ${TYPE_BADGE[doc.docType]}">${doc.docType}</span></h3>
        <button type="button" id="modalCloseBtn" class="text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
      </div>

      ${!isEdit ? `
      <div class="px-6 pt-4">
        <div class="flex border border-slate-200 rounded-lg overflow-hidden text-sm font-bold">
          <button type="button" id="tabManual" data-tab="manual" class="flex-1 py-2.5 bg-primary text-white">Input Manual</button>
          <button type="button" id="tabExcel" data-tab="excel" class="flex-1 py-2.5 bg-white text-slate-500">Impor Massal via Excel</button>
        </div>
      </div>` : ''}

      <div id="manualPane" class="px-6 py-5 space-y-4">
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Judul Dokumen</label>
          <input id="f-title" value="${doc.title||''}" placeholder="Contoh: Invoice Jasa Konsultasi Q3" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Related Dept</label>
            <select id="f-department" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary">
              ${DEPARTMENTS.map(d=>`<option value="${d}" ${doc.relatedDept===d?'selected':''}>${d}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Jenis Dokumen</label>
            <select id="f-doctype" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary">
              ${DOC_TYPES.map(t=>`<option value="${t}" ${doc.docType===t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">No. Invoice</label>
            <input id="f-noinv" value="${doc.noInvoice||''}" placeholder="INV-2026-001" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Nominal (Rp)</label>
            <input id="f-nominal" type="number" min="0" value="${doc.nominal||''}" placeholder="0" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Tgl Terima</label>
            <input id="f-tglterima" type="date" value="${doc.tglTerima||''}" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Tgl Invoice</label>
            <input id="f-tglinvoice" type="date" value="${doc.tglInvoice||''}" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
          </div>
        </div>
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Rencana ${doc.docType==='AP'?'Bayar':'Cair/Tagih'} (Payment Plan)</label>
          <input id="f-tglrencana" type="date" value="${doc.tglRencana||''}" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
          <p class="text-[11px] text-slate-400 mt-1">Digunakan untuk memantau jatuh tempo di panel Rencana Pembayaran &amp; Penagihan.</p>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Status</label>
            <select id="f-status" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary">
              ${STATUS_LIST.map(s=>`<option value="${s}" ${doc.status===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Sumber</label>
            <select id="f-sumber" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary">
              ${SUMBER.map(c=>`<option value="${c}" ${doc.sumber===c?'selected':''}>${c}</option>`).join('')}
            </select>
          </div>
        </div>
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Flag Dealer: ${disburseQuestion(doc.docType)}</label>
          <select id="f-disburse" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary">
            <option value="No" ${doc.disburse!=='Yes'?'selected':''}>No</option>
            <option value="Yes" ${doc.disburse==='Yes'?'selected':''}>Yes</option>
          </select>
          <p class="text-[11px] text-slate-400 mt-1">${doc.docType==='AP' ? 'Flag ini menandai sejak awal apakah dana pembayaran AP ini dibebankan ke dealer.' : 'Flag ini menandai sejak awal apakah dana pencairan AR ini akan disalurkan ke dealer.'}</p>
        </div>
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Dokumen Pendukung</label>
          <div id="docFileDropzone" class="border-2 border-dashed border-slate-300 rounded-lg py-6 text-center cursor-pointer hover:border-primary transition-colors">
            ${msi('cloud_upload','text-[26px] text-slate-400 block mx-auto mb-1')}
            <p class="text-xs text-slate-500">Klik atau tarik file (PDF/JPG/PNG, maks. 4MB) ke sini</p>
            <input type="file" id="docFileInput" accept=".pdf,.jpg,.jpeg,.png" class="hidden">
          </div>
          <div id="docFileCurrent" class="mt-2 text-xs text-slate-500 flex items-center gap-2">
            ${doc.attachments && doc.attachments.length ? `${msi('description','text-[16px]')} File saat ini: <strong>${doc.attachments[0].name}</strong>` : '<span class="text-slate-400">Belum ada file terlampir.</span>'}
          </div>
        </div>
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Keterangan</label>
          <textarea id="f-desc" rows="3" placeholder="Ringkasan isi dokumen..." class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none">${doc.description||''}</textarea>
        </div>
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Diajukan Oleh</label>
          <input id="f-submitter" value="${doc.submittedBy||state.user.name||''}" placeholder="Nama pengaju" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
        </div>
      </div>

      ${!isEdit ? `
      <div id="excelPane" class="px-6 py-5 space-y-4 hidden">
        <div class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
          <p class="text-xs text-slate-500">Unduh template Excel untuk jenis dokumen <strong id="excelTypeLabel">${doc.docType}</strong>, isi datanya, lalu unggah kembali.</p>
          <button type="button" id="downloadTemplateBtn" class="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5 flex-shrink-0">${msi('download','text-[16px]')} Unduh Template</button>
        </div>
        <div id="excelDropzone" class="border-2 border-dashed border-slate-300 rounded-lg py-10 text-center cursor-pointer hover:border-primary transition-colors">
          ${msi('cloud_upload','text-[32px] text-slate-400 block mx-auto mb-2')}
          <p class="text-sm text-slate-500">Klik atau tarik file Excel (.xlsx/.xls/.csv) ke sini</p>
          <input type="file" id="excelFileInput" accept=".xlsx,.xls,.csv" class="hidden">
        </div>
        <div id="excelPreview" class="hidden bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center justify-between">
          <span id="excelPreviewText"></span>
          <button type="button" id="excelClearBtn" class="text-green-700 hover:text-green-900">${msi('close','text-[18px]')}</button>
        </div>
        <button type="button" id="excelImportBtn" disabled class="w-full py-2.5 bg-slate-200 text-slate-400 font-bold rounded-lg cursor-not-allowed transition-all text-sm">Pilih file untuk mengimpor</button>
      </div>` : ''}

      <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
        <button type="button" id="modalCancelBtn" class="px-4 py-2.5 border border-slate-300 rounded-lg font-semibold text-sm text-slate-600 hover:bg-slate-50">Batal</button>
        <button type="button" id="modalSaveBtn" class="px-5 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:opacity-90">${isEdit?'Simpan Perubahan':'Ajukan Dokumen'}</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  const close = ()=>{ state.modal=null; wrap.remove(); };
  document.getElementById('modalCloseBtn').onclick = close;
  document.getElementById('modalCancelBtn').onclick = close;
  wrap.onclick = (e)=>{ if(e.target===wrap) close(); };

  const docTypeSelect = document.getElementById('f-doctype');

  // --- Dokumen pendukung: upload / ganti file ---
  let pendingFile = null; // {name, type, size, dataUrl}
  const docFileDropzone = document.getElementById('docFileDropzone');
  const docFileInput = document.getElementById('docFileInput');
  const docFileCurrent = document.getElementById('docFileCurrent');
  const MAX_FILE_BYTES = 4*1024*1024; // 4MB
  if(docFileCurrent && !state.sheetsUrl){
    const hint = document.createElement('p');
    hint.className = 'text-[10.5px] text-amber-600 mt-1';
    hint.innerHTML = `${msi('info','text-[13px] align-middle')} Belum tersambung ke Google Drive (atur di menu Sinkronisasi Sheets) — file akan disimpan lokal di browser saja.`;
    docFileCurrent.after(hint);
  }
  const handleDocFile = (file)=>{
    if(!file) return;
    if(file.size > MAX_FILE_BYTES){
      showToast('Ukuran file maksimal 4MB', 'error', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e)=>{
      pendingFile = { name:file.name, type:file.type, size:(file.size/1024/1024).toFixed(2)+' MB', dataUrl:e.target.result };
      docFileCurrent.innerHTML = `${msi('check_circle','text-[16px] text-green-600')} Siap diunggah: <strong>${pendingFile.name}</strong> (${pendingFile.size})`;
    };
    reader.readAsDataURL(file);
  };
  if(docFileDropzone){
    docFileDropzone.onclick = ()=> docFileInput.click();
    docFileDropzone.ondragover = (e)=>{ e.preventDefault(); docFileDropzone.classList.add('border-primary'); };
    docFileDropzone.ondragleave = ()=> docFileDropzone.classList.remove('border-primary');
    docFileDropzone.ondrop = (e)=>{ e.preventDefault(); docFileDropzone.classList.remove('border-primary'); handleDocFile(e.dataTransfer.files[0]); };
    docFileInput.onchange = (e)=> handleDocFile(e.target.files[0]);
  }

  // Tab switching (add mode only)
  if(!isEdit){
    const tabManual = document.getElementById('tabManual');
    const tabExcel = document.getElementById('tabExcel');
    const manualPane = document.getElementById('manualPane');
    const excelPane = document.getElementById('excelPane');
    const saveBtn = document.getElementById('modalSaveBtn');
    let importedRows = null;

    const setTab = (tab)=>{
      if(tab==='manual'){
        tabManual.className='flex-1 py-2.5 bg-primary text-white';
        tabExcel.className='flex-1 py-2.5 bg-white text-slate-500';
        manualPane.classList.remove('hidden'); excelPane.classList.add('hidden');
        saveBtn.textContent = 'Ajukan Dokumen'; saveBtn.classList.remove('hidden');
      } else {
        tabManual.className='flex-1 py-2.5 bg-white text-slate-500';
        tabExcel.className='flex-1 py-2.5 bg-primary text-white';
        manualPane.classList.add('hidden'); excelPane.classList.remove('hidden');
        saveBtn.classList.add('hidden');
        document.getElementById('excelTypeLabel').textContent = docTypeSelect.value;
      }
    };
    tabManual.onclick = ()=> setTab('manual');
    tabExcel.onclick = ()=> setTab('excel');

    document.getElementById('downloadTemplateBtn').onclick = ()=> downloadExcelTemplate(docTypeSelect.value);
    const dropzone = document.getElementById('excelDropzone');
    const fileInput = document.getElementById('excelFileInput');
    const previewBox = document.getElementById('excelPreview');
    const previewText = document.getElementById('excelPreviewText');
    const importBtn = document.getElementById('excelImportBtn');
    const clearBtn = document.getElementById('excelClearBtn');

    const handleFile = async (file)=>{
      if(!file) return;
      try{
        const rows = await parseExcelFile(file);
        importedRows = rows;
        previewText.textContent = `${file.name} — ${rows.length} baris terdeteksi dan siap diimpor.`;
        previewBox.classList.remove('hidden');
        importBtn.disabled = false;
        importBtn.textContent = `Impor ${rows.length} Dokumen`;
        importBtn.className = 'w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition-all text-sm';
      }catch(err){
        showToast('Gagal membaca file Excel', 'error', 'error');
      }
    };
    dropzone.onclick = ()=> fileInput.click();
    dropzone.ondragover = (e)=>{ e.preventDefault(); dropzone.classList.add('border-primary'); };
    dropzone.ondragleave = ()=> dropzone.classList.remove('border-primary');
    dropzone.ondrop = (e)=>{ e.preventDefault(); dropzone.classList.remove('border-primary'); handleFile(e.dataTransfer.files[0]); };
    fileInput.onchange = (e)=> handleFile(e.target.files[0]);
    clearBtn.onclick = ()=>{
      importedRows = null; fileInput.value = '';
      previewBox.classList.add('hidden');
      importBtn.disabled = true; importBtn.textContent = 'Pilih file untuk mengimpor';
      importBtn.className = 'w-full py-2.5 bg-slate-200 text-slate-400 font-bold rounded-lg cursor-not-allowed transition-all text-sm';
    };
    importBtn.onclick = async ()=>{
      if(!importedRows || !importedRows.length) return;
      const docType = docTypeSelect.value;
      const newDocs = importedRows.map((row,i)=> rowToDocument(row, i, docType));
      state.documents.push(...newDocs);
      await persistDocs();
      showToast(`${newDocs.length} dokumen ${docType} berhasil diimpor`);
      close();
      render();
    };
  }

  document.getElementById('modalSaveBtn').onclick = async ()=>{
    const title = document.getElementById('f-title').value.trim();
    if(!title){ document.getElementById('f-title').classList.add('border-red-500'); return; }
    const submittedBy = document.getElementById('f-submitter').value.trim() || state.user.name;
    const payload = {
      title,
      relatedDept: document.getElementById('f-department').value,
      docType: document.getElementById('f-doctype').value,
      noInvoice: document.getElementById('f-noinv').value.trim(),
      nominal: Number(document.getElementById('f-nominal').value) || 0,
      tglTerima: document.getElementById('f-tglterima').value,
      tglInvoice: document.getElementById('f-tglinvoice').value,
      tglRencana: document.getElementById('f-tglrencana').value,
      status: document.getElementById('f-status').value,
      disburse: document.getElementById('f-disburse').value,
      sumber: document.getElementById('f-sumber').value,
      description: document.getElementById('f-desc').value.trim(),
      submittedBy,
      updatedAt: new Date().toISOString(),
    };
    let targetId;
    if(isEdit){
      targetId = doc.id;
      const idx = state.documents.findIndex(d=>d.id===doc.id);
      const prevStatus = state.documents[idx].status;
      const prevDisburse = state.documents[idx].disburse;
      // Batasi perubahan status/disburse sesuai hak akses user
      if(!canEditStatus(state.documents[idx])) payload.status = prevStatus;
      if(!canEditDisburse(state.documents[idx])) payload.disburse = prevDisburse;
      state.documents[idx] = {...state.documents[idx], ...payload};
      if(prevStatus !== payload.status){
        state.documents[idx].auditTrail.push({author:state.user.name, role:state.user.role, date:new Date().toISOString(), type:'status_change', statusFrom:prevStatus, statusTo:payload.status, comment:'Status diperbarui melalui form ubah dokumen.'});
      }
      if(prevDisburse !== payload.disburse){
        state.documents[idx].auditTrail.push({author:state.user.name, role:state.user.role, date:new Date().toISOString(), type:'comment', comment:`Status disburse diubah dari ${prevDisburse||'No'} menjadi ${payload.disburse}.`});
      }
      showToast('Dokumen berhasil diperbarui');
    } else {
      targetId = cryptoId();
      const now = new Date().toISOString();
      state.documents.push({
        id:targetId, docId:nextDocId(), fileSize:'—', createdAt:now,
        attachments:[], auditTrail:[{author:submittedBy, role:'Pengaju', date:now, type:'submit', statusTo:payload.status, comment:`Dokumen ${payload.docType} diajukan ke dalam sistem.`}],
        ...payload,
      });
      showToast('Dokumen baru berhasil diajukan');
    }
    if(pendingFile){
      const savedDoc = state.documents.find(d=>d.id===targetId);
      let attached = false;
      if(state.sheetsUrl){
        try{
          const driveRes = await uploadFileToDriveBackend(savedDoc.docId, savedDoc.docType, pendingFile.name, pendingFile.type, pendingFile.dataUrl);
          savedDoc.attachments = [{ name:driveRes.fileName, size:pendingFile.size, url:driveRes.url, driveFileId:driveRes.fileId }];
          attached = true;
          showToast('File terunggah ke Google Drive');
        }catch(err){
          showToast('Gagal unggah ke Drive, disimpan lokal: '+err.message, 'error', 'error');
        }
      }
      if(!attached){
        const ok = await saveDocFile(targetId, pendingFile);
        if(ok) savedDoc.attachments = [{ name:pendingFile.name, size:pendingFile.size }];
      }
    }
    await persistDocs();
    close();
    render();
  };
}

