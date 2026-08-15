/* ================= EXCEL EXPORT ================= */
function exportDocumentsToExcel(docs){
  if(typeof XLSX==='undefined'){ showToast('Pustaka Excel gagal dimuat', 'error', 'error'); return; }
  const rows = docs.map(d=>({
    'ID Dokumen': d.docId, 'Judul': d.title, 'Jenis Dokumen': d.docType, 'Related Dept': d.relatedDept,
    'No. Invoice': d.noInvoice, 'Tgl Invoice': fmtDateShort(d.tglInvoice), 'Tgl Terima': fmtDateShort(d.tglTerima),
    'Nominal': d.nominal, 'Status': d.status, 'Sumber': d.sumber,
    'Diajukan Oleh': d.submittedBy, 'Terakhir Diperbarui': fmtDate(d.updatedAt),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{wch:14},{wch:32},{wch:12},{wch:20},{wch:16},{wch:14},{wch:14},{wch:14},{wch:14},{wch:12},{wch:18},{wch:20}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Daftar Dokumen');
  XLSX.writeFile(wb, `daftar-dokumen-${new Date().toISOString().slice(0,10)}.xlsx`);
  showToast(`${docs.length} dokumen berhasil diekspor`);
}

const EXCEL_TEMPLATE_HEADERS = ['Tgl Terima','No Invoice','Tgl Invoice','Nominal','Keterangan','Divisi'];
function downloadExcelTemplate(docType){
  if(typeof XLSX==='undefined'){ showToast('Pustaka Excel gagal dimuat', 'error', 'error'); return; }
  const example = [{'Tgl Terima':'2026-07-01','No Invoice':(docType==='AP'?'PO-2026-010':'INV-2026-010'),'Tgl Invoice':'2026-06-28','Nominal':5000000,'Keterangan':'Contoh keterangan dokumen','Divisi':DEPARTMENTS[0]}];
  const ws = XLSX.utils.json_to_sheet(example, {header:EXCEL_TEMPLATE_HEADERS});
  ws['!cols'] = [{wch:14},{wch:16},{wch:14},{wch:14},{wch:36},{wch:20}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Impor '+docType);
  XLSX.writeFile(wb, `template-impor-${docType}.xlsx`);
  showToast('Template Excel diunduh');
}

function parseExcelFile(file){
  return new Promise((resolve, reject)=>{
    if(typeof XLSX==='undefined'){ reject(new Error('Pustaka Excel gagal dimuat')); return; }
    const reader = new FileReader();
    reader.onload = (e)=>{
      try{
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, {type:'array'});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(sheet, {defval:''}));
      }catch(err){ reject(err); }
    };
    reader.onerror = ()=> reject(new Error('Gagal membaca file'));
    reader.readAsArrayBuffer(file);
  });
}

function normalizeDate(v){
  if(v===undefined || v===null || v==='') return '';
  if(typeof v === 'number' && window.XLSX && XLSX.SSF){
    const d = XLSX.SSF.parse_date_code(v);
    if(d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
  }
  return String(v).trim();
}

function rowToDocument(row, idx, docType){
  const get = (...keys)=>{ for(const k of keys){ if(row[k]!==undefined && row[k]!=='') return row[k]; } return ''; };
  const noInvoice = String(get('No Invoice','no invoice','NoInvoice')||'').trim();
  const tglInvoice = normalizeDate(get('Tgl Invoice','tgl invoice'));
  const tglTerima = normalizeDate(get('Tgl Terima','tgl terima'));
  const nominal = Number(get('Nominal','nominal')) || 0;
  const keterangan = String(get('Keterangan','keterangan')||'').trim();
  const divisiRaw = String(get('Divisi','divisi')||'').trim();
  const relatedDept = DEPARTMENTS.find(d=>d.toLowerCase()===divisiRaw.toLowerCase()) || DEPARTMENTS[0];
  const now = new Date().toISOString();
  const title = keterangan ? keterangan.slice(0,70) : (noInvoice ? `${docType} ${noInvoice}` : `Dokumen Impor ${idx+1}`);
  const termDays = docType==='AR' ? 30 : 21;
  const tglRencana = tglInvoice && !isNaN(new Date(tglInvoice)) ? new Date(new Date(tglInvoice).getTime() + termDays*86400000).toISOString().slice(0,10) : '';
  return {
    id:cryptoId(), docId: nextDocId(idx), title, docType, relatedDept, status:'Draft', sumber:'Lainnya', disburse:'No',
    fileSize:'—', noInvoice, tglInvoice, tglTerima, tglRencana, nominal, description:keterangan,
    submittedBy: state.user.name, createdAt:now, updatedAt:now, attachments:[],
    auditTrail:[{author:state.user.name, role:state.user.role, date:now, type:'submit', statusTo:'Draft', comment:`Dokumen ${docType} diimpor secara massal melalui Excel.`}],
  };
}

