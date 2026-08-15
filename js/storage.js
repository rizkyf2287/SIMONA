/* ================= FILE STORAGE (per-dokumen, terpisah dari blob utama) ================= */
function fileKey(docId){ return 'simona:file:'+docId; }
async function saveDocFile(docId, fileObj){
  try{ await simonaStorage.set(fileKey(docId), JSON.stringify(fileObj), false); return true; }
  catch(e){ console.error('Gagal menyimpan file', e); return false; }
}
async function loadDocFile(docId){
  try{ const r = await simonaStorage.get(fileKey(docId), false); return r && r.value ? JSON.parse(r.value) : null; }
  catch(e){ return null; }
}

// Upload file ke Google Drive lewat backend Apps Script (jika URL Sheets sudah dikonfigurasi).
// dataUrl format: "data:<mime>;base64,<data>"
async function uploadFileToDriveBackend(docId, docType, fileName, mimeType, dataUrl){
  const base64Data = dataUrl.split(',')[1];
  const res = await fetch(state.sheetsUrl, {
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body: JSON.stringify({ type:'file', docId, docType, fileName, mimeType, base64Data }),
  });
  if(!res.ok) throw new Error('HTTP '+res.status);
  const json = await res.json();
  if(!json.ok) throw new Error(json.error || 'Gagal mengunggah ke Drive');
  return json; // {ok, fileId, url, fileName, folderPath}
}
