/* ================= DASHBOARD METRICS ================= */
function dashboardMetrics(){
  const docs = state.documents;
  const ar = docs.filter(d=>d.docType==='AR');
  const ap = docs.filter(d=>d.docType==='AP');
  const onProc = d => !['Draft','Cair','Bayar'].includes(d.status);
  const arOnProc = ar.filter(onProc).length;
  const apOnProc = ap.filter(onProc).length;
  const arDone = ar.filter(d=>d.status==='Cair').length;
  const apDone = ap.filter(d=>d.status==='Bayar').length;
  const arPct = ar.length ? Math.round(arDone/ar.length*100) : 0;
  const apPct = ap.length ? Math.round(apDone/ap.length*100) : 0;
  return { arTotal:ar.length, apTotal:ap.length, arOnProc, apOnProc, arDone, apDone, arPct, apPct };
}

function dashboardSearchResults(){
  let docs = state.documents;
  if(state.dashSearch){
    const s = state.dashSearch.toLowerCase();
    docs = docs.filter(d=>{
      if(state.dashSearchBy==='nama') return d.title.toLowerCase().includes(s);
      if(state.dashSearchBy==='divisi') return d.relatedDept.toLowerCase().includes(s);
      if(state.dashSearchBy==='noinv') return (d.noInvoice||'').toLowerCase().includes(s);
      return true;
    });
  }
  if(state.dashSettlement!=='all'){
    docs = docs.filter(d=>{
      if(state.dashSettlement==='ar-cair') return d.docType==='AR' && d.status==='Cair';
      if(state.dashSettlement==='ar-belum') return d.docType==='AR' && d.status!=='Cair';
      if(state.dashSettlement==='ap-bayar') return d.docType==='AP' && d.status==='Bayar';
      if(state.dashSettlement==='ap-belum') return d.docType==='AP' && d.status!=='Bayar';
      return true;
    });
  }
  return docs.slice().sort((a,b)=> new Date(b.updatedAt)-new Date(a.updatedAt));
}

/* ================= PAYMENT PLAN (Rencana Bayar/Tagih) ================= */
function paymentPlanList(){
  const today = new Date(); today.setHours(0,0,0,0);
  return state.documents
    .filter(d=> d.tglRencana && !isSettled(d))
    .map(d=>{
      const planDate = new Date(d.tglRencana+'T00:00:00');
      const diffDays = Math.round((planDate-today)/86400000);
      let tag, tagClass;
      if(diffDays < 0){ tag='Terlambat'; tagClass='bg-red-100 text-red-700'; }
      else if(diffDays === 0){ tag='Jatuh Tempo Hari Ini'; tagClass='bg-amber-100 text-amber-700'; }
      else { tag='Terjadwal'; tagClass='bg-blue-100 text-blue-700'; }
      return { doc:d, diffDays, tag, tagClass };
    })
    .sort((a,b)=> a.diffDays - b.diffDays);
}

function renderPaymentPlanPanel(){
  const plan = paymentPlanList();
  const overdue = plan.filter(p=>p.diffDays<0);
  const dueToday = plan.filter(p=>p.diffDays===0);
  const overdueNominal = overdue.reduce((s,p)=>s+(p.doc.nominal||0),0);

  return `
  <section class="bg-white rounded-xl soft-lift border border-slate-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
      <h4 class="font-bold text-primary flex items-center gap-2">${msi('event_upcoming','text-[20px]')} Rencana Pembayaran &amp; Penagihan</h4>
      <div class="flex items-center gap-3 text-xs">
        <span class="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-bold">${overdue.length} Terlambat &middot; ${fmtIDR(overdueNominal)}</span>
        <span class="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-bold">${dueToday.length} Jatuh Tempo Hari Ini</span>
      </div>
    </div>
    ${plan.length ? `
    <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse text-sm">
      <thead><tr class="bg-slate-50 border-b border-slate-200">
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">ID Dokumen</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Judul</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Jenis</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Related Dept</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Nominal</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Tgl Rencana</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Status Jadwal</th>
      </tr></thead>
      <tbody class="divide-y divide-slate-100">
        ${plan.slice(0,8).map(p=>`
        <tr class="hover:bg-slate-50 cursor-pointer" data-open-detail="${p.doc.id}">
          <td class="px-6 py-3 font-mono text-xs font-bold text-primary">${p.doc.docId}</td>
          <td class="px-6 py-3 font-semibold text-slate-800 max-w-[220px] truncate">${p.doc.title}</td>
          <td class="px-6 py-3"><span class="px-2 py-0.5 rounded text-[10px] font-black ${TYPE_BADGE[p.doc.docType]}">${p.doc.docType}</span></td>
          <td class="px-6 py-3 text-slate-500 text-xs">${p.doc.relatedDept}</td>
          <td class="px-6 py-3 font-mono text-xs">${fmtIDR(p.doc.nominal)}</td>
          <td class="px-6 py-3 text-xs text-slate-600">${fmtDateShort(p.doc.tglRencana)}</td>
          <td class="px-6 py-3"><span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${p.tagClass}">${p.tag}${p.diffDays<0?` (${Math.abs(p.diffDays)}h)`:''}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>` : `<div class="py-10 text-center text-slate-400 text-sm">Belum ada dokumen dengan rencana pembayaran/penagihan yang diset.</div>`}
  </section>`;
}

/* ================= DASHBOARD ================= */
function scoreCard(label, arVal, apVal, tone){
  return `
  <div class="bg-white p-6 rounded-xl soft-lift border border-slate-200">
    <p class="text-[11px] text-slate-400 uppercase font-bold tracking-widest mb-3">${label}</p>
    <div class="flex items-end gap-5">
      <div><span class="block text-[10px] font-bold text-indigo-500 mb-0.5">AR</span><span class="text-2xl font-bold ${tone||'text-primary'}">${arVal}</span></div>
      <div class="h-8 w-px bg-slate-100"></div>
      <div><span class="block text-[10px] font-bold text-rose-500 mb-0.5">AP</span><span class="text-2xl font-bold ${tone||'text-primary'}">${apVal}</span></div>
    </div>
  </div>`;
}

function renderDashboard(){
  const m = dashboardMetrics();
  const results = dashboardSearchResults();
  const recent = results.slice(0,6);
  const showingSearch = !!state.dashSearch || state.dashSettlement!=='all';

  return `
  <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h3 class="text-[28px] md:text-[32px] font-bold text-primary leading-tight">Dashboard</h3>
      <p class="text-slate-500">Ringkasan status &amp; alur validasi dokumen AR/AP secara real-time.</p>
    </div>
    <div class="flex gap-3">
      <button type="button" data-action="add-doc" data-doc-type="AR" class="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:opacity-90 transition-colors active:scale-95 shadow-md">
        ${msi('add','text-[20px]')} Pengajuan AR
      </button>
      <button type="button" data-action="add-doc" data-doc-type="AP" class="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white font-bold rounded-lg hover:opacity-90 transition-colors active:scale-95 shadow-md">
        ${msi('add','text-[20px]')} Pengajuan AP
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
    ${scoreCard('Total Dokumen', m.arTotal, m.apTotal)}
    ${scoreCard('On Proses', m.arOnProc, m.apOnProc, 'text-amber-600')}
    ${scoreCard('Cair / Bayar', m.arDone, m.apDone, 'text-green-600')}
    ${scoreCard('% Cair / Bayar', m.arPct+'%', m.apPct+'%', 'text-teal-600')}
  </div>

  <section class="bg-white p-5 rounded-xl soft-lift border border-slate-200">
    <h4 class="font-bold text-primary mb-4 flex items-center gap-2">${msi('manage_search','text-[20px]')} Pencarian &amp; Filter Dokumen</h4>
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 flex-1 min-w-[220px]">
        ${msi('search','text-slate-400')}
        <input id="dashSearchInput" value="${state.dashSearch}" placeholder="Ketik kata kunci pencarian..." class="w-full bg-transparent border-none p-0 text-sm focus:ring-0 outline-none">
      </div>
      <select id="dashSearchBy" class="bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100 text-sm font-semibold outline-none cursor-pointer">
        <option value="nama" ${state.dashSearchBy==='nama'?'selected':''}>By Nama Dokumen</option>
        <option value="divisi" ${state.dashSearchBy==='divisi'?'selected':''}>By Divisi</option>
        <option value="noinv" ${state.dashSearchBy==='noinv'?'selected':''}>By No. Invoice</option>
      </select>
      <select id="dashSettlement" class="bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100 text-sm font-semibold outline-none cursor-pointer">
        <option value="all" ${state.dashSettlement==='all'?'selected':''}>Semua Dokumen</option>
        <option value="ar-cair" ${state.dashSettlement==='ar-cair'?'selected':''}>AR — Sudah Cair</option>
        <option value="ar-belum" ${state.dashSettlement==='ar-belum'?'selected':''}>AR — Belum Cair</option>
        <option value="ap-bayar" ${state.dashSettlement==='ap-bayar'?'selected':''}>AP — Sudah Bayar</option>
        <option value="ap-belum" ${state.dashSettlement==='ap-belum'?'selected':''}>AP — Belum Bayar</option>
      </select>
    </div>
    ${showingSearch ? `
    <div class="mt-4 border-t border-slate-100 pt-4">
      <p class="text-xs text-slate-400 mb-2">${results.length} dokumen ditemukan</p>
      ${results.length ? `
      <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-sm">
        <thead><tr class="bg-slate-50 border-b border-slate-200">
          <th class="px-4 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">ID</th>
          <th class="px-4 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Judul</th>
          <th class="px-4 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Divisi</th>
          <th class="px-4 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Jenis</th>
          <th class="px-4 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Status</th>
        </tr></thead>
        <tbody class="divide-y divide-slate-100">
          ${results.slice(0,10).map(d=>`
          <tr class="hover:bg-slate-50 cursor-pointer" data-open-detail="${d.id}">
            <td class="px-4 py-2.5 font-mono text-xs font-bold text-primary">${d.docId}</td>
            <td class="px-4 py-2.5 font-semibold text-slate-800">${d.title}</td>
            <td class="px-4 py-2.5 text-slate-500 text-xs">${d.relatedDept}</td>
            <td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-black ${TYPE_BADGE[d.docType]}">${d.docType}</span></td>
            <td class="px-4 py-2.5"><span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_BADGE[d.status]}">${d.status}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
      </div>` : emptyState('Tidak ada dokumen yang cocok.')}
    </div>` : ''}
  </section>

  ${renderPaymentPlanPanel()}

  <div class="bg-white rounded-xl soft-lift border border-slate-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
      <h4 class="font-bold text-primary">Aktivitas Dokumen Terbaru</h4>
      <button type="button" data-nav="documents" class="text-xs font-bold text-primary hover:underline">Lihat semua</button>
    </div>
    ${recent.length ? `
    <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse text-sm">
      <thead><tr class="bg-slate-50 border-b border-slate-200">
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">ID Dokumen</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Judul</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Related Dept</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Status</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Disburse</th>
        <th class="px-6 py-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Update Terakhir</th>
      </tr></thead>
      <tbody class="divide-y divide-slate-100">
        ${recent.map(d=>`
        <tr class="hover:bg-slate-50 transition-colors cursor-pointer" data-open-detail="${d.id}" title="Klik untuk melihat riwayat status &amp; SLA">
          <td class="px-6 py-3.5 font-mono text-xs font-bold text-primary">${d.docId}</td>
          <td class="px-6 py-3.5 font-semibold text-slate-800 max-w-[240px] truncate">${d.title}</td>
          <td class="px-6 py-3.5 text-slate-500">${d.relatedDept}</td>
          <td class="px-6 py-3.5"><span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_BADGE[d.status]}">${d.status}</span></td>
          <td class="px-6 py-3.5"><span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${d.disburse==='Yes'?'bg-green-100 text-green-700':'bg-slate-100 text-slate-500'}">${d.disburse==='Yes'?'Yes':'No'}</span></td>
          <td class="px-6 py-3.5 text-slate-400 text-xs" title="${fmtDate(d.updatedAt)}">${timeAgo(d.updatedAt)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>` : emptyState('Belum ada dokumen tercatat.')}
  </div>`;
}

function emptyState(text){
  return `<div class="py-16 text-center text-slate-400">${msi('description','text-[40px] block mx-auto mb-2')}<p class="text-sm">${text}</p></div>`;
}

