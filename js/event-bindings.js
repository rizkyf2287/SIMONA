/* ================= EVENT BINDING ================= */
function bindPageEvents(){
  document.querySelectorAll('[data-action="add-doc"]').forEach(btn=>{
    btn.onclick = ()=>{
      const docType = btn.dataset.docType || 'AR';
      state.modal = {mode:'add', doc:{docType, relatedDept:DEPARTMENTS[0], status:'Draft', sumber:'TAM'}};
      renderModal();
    };
  });
  const exportAllBtn = document.querySelector('[data-action="export-all"]');
  if(exportAllBtn) exportAllBtn.onclick = ()=> exportDocumentsToExcel(filteredDocs());

  document.querySelectorAll('[data-open-detail]').forEach(el=>{
    el.onclick = ()=>{ state.detailId = el.dataset.openDetail; state.view='detail'; render(); };
  });
  document.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.onclick = ()=>{ const doc = state.documents.find(d=>d.id===btn.dataset.edit); state.modal={mode:'edit', doc}; renderModal(); };
  });
  document.querySelectorAll('[data-del]').forEach(btn=>{
    btn.onclick = ()=>{
      showConfirm('Dokumen ini akan dihapus permanen dan tidak dapat dikembalikan.', async ()=>{
        await deleteDocWithSync(btn.dataset.del);
        showToast('Dokumen dihapus'); render();
      }, {title:'Hapus Dokumen?'});
    };
  });

  // --- live search with focus preservation ---
  const docSearch = document.getElementById('docSearch');
  if(docSearch){
    docSearch.value = state.search;
    docSearch.oninput = (e)=>{
      const cursor = e.target.selectionStart;
      state.search = e.target.value;
      document.getElementById('mainContent').innerHTML = renderDocuments();
      bindPageEvents();
      const fresh = document.getElementById('docSearch');
      if(fresh){ fresh.focus(); fresh.setSelectionRange(cursor, cursor); }
    };
  }
  const statusFilter = document.getElementById('statusFilter');
  if(statusFilter) statusFilter.onchange = (e)=>{ state.statusFilter=e.target.value; document.getElementById('mainContent').innerHTML = renderDocuments(); bindPageEvents(); };
  const deptFilter = document.getElementById('deptFilter');
  if(deptFilter) deptFilter.onchange = (e)=>{ state.deptFilter=e.target.value; document.getElementById('mainContent').innerHTML = renderDocuments(); bindPageEvents(); };
  const typeFilter = document.getElementById('typeFilter');
  if(typeFilter) typeFilter.onchange = (e)=>{ state.typeFilter=e.target.value; document.getElementById('mainContent').innerHTML = renderDocuments(); bindPageEvents(); };

  // --- dashboard search/filter with focus preservation ---
  const dashSearchInput = document.getElementById('dashSearchInput');
  if(dashSearchInput){
    dashSearchInput.oninput = (e)=>{
      const cursor = e.target.selectionStart;
      state.dashSearch = e.target.value;
      document.getElementById('mainContent').innerHTML = renderDashboard();
      bindPageEvents();
      const fresh = document.getElementById('dashSearchInput');
      if(fresh){ fresh.focus(); fresh.setSelectionRange(cursor, cursor); }
    };
  }
  const dashSearchBy = document.getElementById('dashSearchBy');
  if(dashSearchBy) dashSearchBy.onchange = (e)=>{ state.dashSearchBy=e.target.value; document.getElementById('mainContent').innerHTML = renderDashboard(); bindPageEvents(); };
  const dashSettlement = document.getElementById('dashSettlement');
  if(dashSettlement) dashSettlement.onchange = (e)=>{ state.dashSettlement=e.target.value; document.getElementById('mainContent').innerHTML = renderDashboard(); bindPageEvents(); };

  // --- detail page: status update + comment ---
  const updateStatusBtn = document.querySelector('[data-action="update-status"]');
  if(updateStatusBtn){
    updateStatusBtn.onclick = async ()=>{
      const doc = state.documents.find(d=>d.id===state.detailId);
      if(!canEditStatus(doc)){ showToast('Anda tidak memiliki izin mengubah status dokumen ini', 'lock', 'error'); return; }
      const newStatus = document.getElementById('statusSelect').value;
      const comment = document.getElementById('statusComment').value.trim();
      if(newStatus===doc.status){ showToast('Status tidak berubah', 'info', 'error'); return; }
      const prevStatus = doc.status;
      doc.status = newStatus;
      doc.updatedAt = new Date().toISOString();
      doc.auditTrail.push({author:state.user.name, role:state.user.role, date:doc.updatedAt, type:'status_change', statusFrom:prevStatus, statusTo:newStatus, comment: comment || `Status diperbarui dari ${prevStatus} menjadi ${newStatus}.`});
      await persistDocs(); showToast('Status dokumen diperbarui'); render();
    };
  }
  const commentBtn = document.querySelector('[data-action="add-comment"]');
  if(commentBtn){
    commentBtn.onclick = async ()=>{
      const input = document.getElementById('commentInput');
      const text = input.value.trim();
      if(!text) return;
      const doc = state.documents.find(d=>d.id===state.detailId);
      doc.auditTrail.push({author:state.user.name, role:state.user.role, date:new Date().toISOString(), type:'comment', comment:text});
      doc.updatedAt = new Date().toISOString();
      await persistDocs(); showToast('Komentar ditambahkan'); render();
    };
  }
  const updateDisburseBtn = document.querySelector('[data-action="update-disburse"]');
  if(updateDisburseBtn){
    updateDisburseBtn.onclick = async ()=>{
      const doc = state.documents.find(d=>d.id===state.detailId);
      if(!canEditDisburse(doc)){ showToast('Anda tidak memiliki izin mengubah status disburse dokumen ini', 'lock', 'error'); return; }
      const newVal = document.getElementById('disburseSelect').value;
      if(newVal===doc.disburse){ showToast('Status disburse tidak berubah', 'info', 'error'); return; }
      const prevVal = doc.disburse;
      doc.disburse = newVal;
      doc.updatedAt = new Date().toISOString();
      doc.auditTrail.push({author:state.user.name, role:state.user.role, date:doc.updatedAt, type:'comment', comment:`Status disburse diubah dari ${prevVal||'No'} menjadi ${newVal}.`});
      await persistDocs(); showToast('Status disburse diperbarui'); render();
    };
  }
  const replaceFileBtn = document.getElementById('replaceFileBtn');
  if(replaceFileBtn){
    replaceFileBtn.onclick = ()=> document.getElementById('replaceFileInput').click();
    document.getElementById('replaceFileInput').onchange = async (e)=>{
      const file = e.target.files[0];
      if(!file) return;
      if(file.size > 4*1024*1024){ showToast('Ukuran file maksimal 4MB', 'error', 'error'); return; }
      const statusEl = document.getElementById('replaceFileStatus');
      statusEl.textContent = 'Mengunggah...';
      const reader = new FileReader();
      reader.onload = async (ev)=>{
        const doc = state.documents.find(d=>d.id===state.detailId);
        const dataUrl = ev.target.result;
        const fileSizeLabel = (file.size/1024/1024).toFixed(2)+' MB';
        let attached = false;
        if(state.sheetsUrl){
          try{
            // PERBAIKAN CORS & UPLOAD: Gunakan fetch langsung dengan format yang benar
            const res = await fetch(state.sheetsUrl, {
              method: 'POST',
              redirect: 'follow', // INI SANGAT PENTING
              headers: {
                'Content-Type': 'text/plain;charset=utf-8' // JANGAN gunakan application/json
              },
              body: JSON.stringify({
                type: 'file',
                docType: doc.docType,
                docId: doc.docId,
                fileName: file.name,
                mimeType: file.type,
                base64Data: dataUrl // Data Base64 (termasuk awalan 'data:...' yang sudah diatasi di backend)
              })
            });

            if (!res.ok) throw new Error('Koneksi HTTP Gagal (' + res.status + ')');
            
            const driveRes = await res.json();
            
            if (driveRes.ok) {
                doc.attachments = [{ name:driveRes.fileName, size:fileSizeLabel, url:driveRes.url, driveFileId:driveRes.fileId }];
                attached = true;
                showToast('File terunggah ke Google Drive');
            } else {
                throw new Error(driveRes.error || 'Server menolak file.');
            }

          }catch(err){
            // Jika ada error (termasuk failed to fetch), masuk ke sini dan lari ke mode lokal
            console.error('Error Drive:', err);
            showToast('Gagal unggah ke Drive, disimpan lokal: '+err.message, 'error', 'error');
          }
        }
        if(!attached){
          const fileObj = { name:file.name, type:file.type, size:fileSizeLabel, dataUrl };
          const ok = await saveDocFile(doc.id, fileObj);
          if(ok) doc.attachments = [{ name:file.name, size:fileSizeLabel }];
          else { statusEl.textContent = 'Gagal mengunggah file.'; return; }
        }
        doc.updatedAt = new Date().toISOString();
        doc.auditTrail.push({author:state.user.name, role:state.user.role, date:doc.updatedAt, type:'comment', comment:`Lampiran diperbarui: ${file.name}.`});
        await persistDocs();
        render();
      };
      reader.readAsDataURL(file);
    };
  }
  document.querySelectorAll('[data-download-attachment]').forEach(el=>{
    el.onclick = async ()=>{
      const docId = el.dataset.downloadAttachment;
      const doc = state.documents.find(d=>d.id===docId);
      const att = doc && doc.attachments && doc.attachments[0];
      if(att && att.url){
        window.open(att.url, '_blank');
        return;
      }
      const fileObj = await loadDocFile(docId);
      if(!fileObj || !fileObj.dataUrl){ showToast('File tidak ditemukan di penyimpanan (mungkin dokumen contoh/seed).', 'error', 'error'); return; }
      const a = document.createElement('a');
      a.href = fileObj.dataUrl; a.download = fileObj.name || 'lampiran';
      document.body.appendChild(a); a.click(); a.remove();
    };
  });

  // --- laporan: filter bulan & tahun ---
  document.querySelectorAll('[data-report-month]').forEach(btn=>{
    btn.onclick = ()=>{
      const mi = Number(btn.dataset.reportMonth);
      const idx = state.reportMonths.indexOf(mi);
      if(idx>-1) state.reportMonths.splice(idx,1); else state.reportMonths.push(mi);
      document.getElementById('mainContent').innerHTML = renderReports(); bindPageEvents();
    };
  });
  document.querySelectorAll('[data-report-year]').forEach(btn=>{
    btn.onclick = ()=>{
      const y = Number(btn.dataset.reportYear);
      const idx = state.reportYears.indexOf(y);
      if(idx>-1) state.reportYears.splice(idx,1); else state.reportYears.push(y);
      document.getElementById('mainContent').innerHTML = renderReports(); bindPageEvents();
    };
  });
  const clearReportFilter = document.getElementById('clearReportFilter');
  if(clearReportFilter) clearReportFilter.onclick = ()=>{
    state.reportMonths = []; state.reportYears = [];
    document.getElementById('mainContent').innerHTML = renderReports(); bindPageEvents();
  };

  // --- google sheets sync ---
  const saveUrlBtn = document.getElementById('saveSheetsUrlBtn');
  if(saveUrlBtn){
    saveUrlBtn.onclick = async ()=>{
      state.sheetsUrl = document.getElementById('sheetsUrlInput').value.trim();
      await persistSheetsUrl();
      showToast('URL Web App disimpan');
      startAutoSync();
      document.getElementById('mainContent').innerHTML = renderSync(); bindPageEvents();
    };
  }
  const toggleAutoSyncBtn = document.getElementById('toggleAutoSyncBtn');
  if(toggleAutoSyncBtn){
    toggleAutoSyncBtn.onclick = async ()=>{
      state.autoSyncEnabled = !state.autoSyncEnabled;
      await persistAutoSyncEnabled();
      if(state.autoSyncEnabled) startAutoSync(); else stopAutoSync();
      showToast(state.autoSyncEnabled ? 'Sinkronisasi otomatis diaktifkan' : 'Sinkronisasi otomatis dimatikan');
      document.getElementById('mainContent').innerHTML = renderSync(); bindPageEvents();
    };
  }
  const testConnBtn = document.getElementById('testConnBtn');
  if(testConnBtn){
    testConnBtn.onclick = async ()=>{
      if(!state.sheetsUrl){ showToast('Isi URL Web App terlebih dahulu', 'error', 'error'); return; }
      testConnBtn.disabled = true;
      try{
        const res = await sheetsPing();
        logSync(res.message || 'Koneksi berhasil.', true);
        showToast('Koneksi ke Google Sheets berhasil');
      }catch(err){
        logSync('Gagal terhubung: '+err.message, false);
        showToast('Gagal terhubung ke Google Sheets', 'error', 'error');
      }
      testConnBtn.disabled = false;
      document.getElementById('mainContent').innerHTML = renderSync(); bindPageEvents();
    };
  }
  const pushSheetsBtn = document.getElementById('pushSheetsBtn');
  if(pushSheetsBtn){
    pushSheetsBtn.onclick = async ()=>{
      if(!state.sheetsUrl){ showToast('Isi URL Web App terlebih dahulu', 'error', 'error'); return; }
      pushSheetsBtn.disabled = true;
      await autoPushDocsNow();
      await autoPushUsersNow();
      showToast('Push manual selesai — lihat Log Sinkronisasi untuk detail');
      pushSheetsBtn.disabled = false;
      document.getElementById('mainContent').innerHTML = renderSync(); bindPageEvents();
    };
  }
  const pullSheetsBtn = document.getElementById('pullSheetsBtn');
  if(pullSheetsBtn){
    pullSheetsBtn.onclick = async ()=>{
      if(!state.sheetsUrl){ showToast('Isi URL Web App terlebih dahulu', 'error', 'error'); return; }
      pullSheetsBtn.disabled = true;
      try{ await performPull(); showToast('Tarik manual selesai — lihat Log Sinkronisasi untuk detail'); }
      catch(err){ showToast('Gagal menarik data dari Google Sheets', 'error', 'error'); }
      pullSheetsBtn.disabled = false;
      document.getElementById('mainContent').innerHTML = renderSync(); bindPageEvents();
    };
  }

  // --- user management ---
  const addUserBtn = document.querySelector('[data-action="add-user"]');
  if(addUserBtn) addUserBtn.onclick = ()=>{ state.userModal = {mode:'add', user:{role:'Staff', dept:DEPARTMENTS[0]}}; renderUserModal(); };
  document.querySelectorAll('[data-edit-user]').forEach(btn=>{
    btn.onclick = ()=>{ const user = state.users.find(u=>u.id===btn.dataset.editUser); state.userModal={mode:'edit', user}; renderUserModal(); };
  });
  document.querySelectorAll('[data-del-user]').forEach(btn=>{
    btn.onclick = ()=>{
      showConfirm('User ini akan dihapus dari daftar akses.', async ()=>{
        await deleteUserWithSync(btn.dataset.delUser);
        showToast('User dihapus'); render();
      }, {title:'Hapus User?'});
    };
  });
}
