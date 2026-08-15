/* ================= REPORTS ================= */
/* ================= REPORT ANALYTICS HELPERS ================= */
function availableReportMonths(){
  const set = new Set();
  state.documents.forEach(d=>{ const dt = new Date(d.tglInvoice || d.createdAt); if(!isNaN(dt)) set.add(dt.getMonth()); });
  return Array.from(set).sort((a,b)=>a-b);
}
function availableReportYears(){
  const set = new Set();
  state.documents.forEach(d=>{ const dt = new Date(d.tglInvoice || d.createdAt); if(!isNaN(dt)) set.add(dt.getFullYear()); });
  return Array.from(set).sort((a,b)=>a-b);
}
function filteredDocsForReport(){
  if(state.reportMonths.length===0 && state.reportYears.length===0) return state.documents;
  return state.documents.filter(d=>{
    const dt = new Date(d.tglInvoice || d.createdAt);
    if(isNaN(dt)) return true;
    const monthOk = state.reportMonths.length===0 || state.reportMonths.includes(dt.getMonth());
    const yearOk = state.reportYears.length===0 || state.reportYears.includes(dt.getFullYear());
    return monthOk && yearOk;
  });
}

// Time series bulanan: SLA rata-rata (avg cycle) & DSO/DPO, dihitung dari dokumen yang CAIR/BAYAR pada bulan tsb.
function monthlySeries(docType){
  const terminal = docType==='AR' ? 'Cair' : 'Bayar';
  const settledDocs = filteredDocsForReport().filter(d=>d.docType===docType && d.status===terminal);
  const byMonth = {};
  settledDocs.forEach(d=>{
    const settleDate = new Date(d.updatedAt);
    const key = settleDate.getFullYear()+'-'+String(settleDate.getMonth()+1).padStart(2,'0');
    const cycleDays = (new Date(d.updatedAt) - new Date(d.createdAt)) / 86400000;
    (byMonth[key] = byMonth[key] || []).push(cycleDays);
  });
  const keys = Object.keys(byMonth).sort();
  return keys.map(key=>{
    const [y,m] = key.split('-');
    const arr = byMonth[key];
    const avgDays = arr.reduce((a,b)=>a+b,0)/arr.length;
    return { key, label: new Date(Number(y), Number(m)-1, 1).toLocaleDateString('id-ID',{month:'short',year:'2-digit'}), avgDays: Math.round(avgDays*10)/10, count: arr.length };
  });
}

function typeMetrics(docType){
  const docs = filteredDocsForReport().filter(d=>d.docType===docType);
  const terminal = docType==='AR' ? 'Cair' : 'Bayar';
  const total = docs.length;
  const totalNominal = docs.reduce((s,d)=>s+(d.nominal||0),0);
  const settled = docs.filter(d=>d.status===terminal);
  const settledCount = settled.length;
  const settledNominal = settled.reduce((s,d)=>s+(d.nominal||0),0);
  const outstandingNominal = totalNominal - settledNominal;
  const settledPct = total ? Math.round(settledCount/total*100) : 0;

  // Evaluasi disburse (serapan): nominal dengan disburse=Yes dibanding total nominal
  const disburseYes = docs.filter(d=>d.disburse==='Yes');
  const disburseYesNominal = disburseYes.reduce((s,d)=>s+(d.nominal||0),0);
  const disburseYesCount = disburseYes.length;
  const disbursePct = totalNominal ? Math.round(disburseYesNominal/totalNominal*100) : 0;

  const statusCounts = STATUS_LIST.map(s=>({status:s, count:docs.filter(d=>d.status===s).length})).filter(s=>s.count>0);

  const stageDurations = {};
  docs.forEach(d=>{
    statusTimeline(d).forEach(t=>{
      if(!t.ongoing){
        (stageDurations[t.status] = stageDurations[t.status]||[]).push(t.end-t.start);
      }
    });
  });
  const slaByStage = STATUS_LIST.map(s=>{
    const arr = stageDurations[s]||[];
    return { status:s, avgMs: arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0, count:arr.length };
  }).filter(s=>s.count>0);

  const cycleTimes = docs.map(d=> d.status===terminal ? (new Date(d.updatedAt)-new Date(d.createdAt)) : (Date.now()-new Date(d.createdAt).getTime()));
  const avgCycle = cycleTimes.length ? cycleTimes.reduce((a,b)=>a+b,0)/cycleTimes.length : 0;

  const buckets = [
    {label:'0–30 hari', min:0, max:30, count:0, nominal:0},
    {label:'31–60 hari', min:31, max:60, count:0, nominal:0},
    {label:'61–90 hari', min:61, max:90, count:0, nominal:0},
    {label:'> 90 hari', min:91, max:Infinity, count:0, nominal:0},
  ];
  docs.filter(d=>d.status!==terminal).forEach(d=>{
    const base = d.tglInvoice ? new Date(d.tglInvoice) : new Date(d.createdAt);
    const days = Math.max(0, Math.floor((Date.now()-base.getTime())/86400000));
    const b = buckets.find(b=>days>=b.min && days<=b.max) || buckets[buckets.length-1];
    b.count++; b.nominal += (d.nominal||0);
  });

  const deptMap = {};
  docs.forEach(d=>{ deptMap[d.relatedDept] = (deptMap[d.relatedDept]||0) + (d.nominal||0); });
  const topDepts = Object.entries(deptMap).map(([dep,nominal])=>({dep,nominal})).sort((a,b)=>b.nominal-a.nominal).slice(0,5);

  // DSO (AR) / DPO (AP): rata-rata hari siklus dari dokumen yang SUDAH selesai (realized)
  const settledCycleMs = settled.map(d=> new Date(d.updatedAt)-new Date(d.createdAt));
  const dsoAvgDays = settledCycleMs.length ? Math.round((settledCycleMs.reduce((a,b)=>a+b,0)/settledCycleMs.length)/86400000) : null;

  // Pola bayar per Related Dept: rata-rata hari siklus (realized) per departemen, diurutkan tercepat -> terlambat
  const deptCycleMap = {};
  settled.forEach(d=>{
    const ms = new Date(d.updatedAt)-new Date(d.createdAt);
    (deptCycleMap[d.relatedDept] = deptCycleMap[d.relatedDept]||[]).push(ms);
  });
  const polaBayarByDept = Object.entries(deptCycleMap).map(([dep,arr])=>({
    dep, avgDays: Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)/86400000), count:arr.length,
  })).sort((a,b)=>a.avgDays-b.avgDays);

  return { docType, terminal, total, totalNominal, settledCount, settledNominal, outstandingNominal, settledPct, statusCounts, slaByStage, avgCycle, buckets, topDepts, dsoAvgDays, polaBayarByDept, disburseYesNominal, disburseYesCount, disbursePct };
}

function typeInsights(m){
  const lines = [];
  if(m.total===0) return [`Belum ada dokumen ${m.docType} yang tercatat.`];
  lines.push(`Dari ${m.total} dokumen ${m.docType}, ${m.settledCount} dokumen (${m.settledPct}%) sudah berstatus "${m.terminal}" senilai ${fmtIDR(m.settledNominal)}, menyisakan ${fmtIDR(m.outstandingNominal)} yang masih outstanding.`);
  if(m.slaByStage.length){
    const bottleneck = m.slaByStage.slice().sort((a,b)=>b.avgMs-a.avgMs)[0];
    lines.push(`Tahap dengan durasi rata-rata terlama adalah <strong>${bottleneck.status}</strong> (±${fmtDuration(bottleneck.avgMs)}) — kandidat utama bottleneck proses ${m.docType}.`);
  }
  const overdue = m.buckets.find(b=>b.label==='> 90 hari');
  if(overdue && overdue.count>0){
    lines.push(`Terdapat ${overdue.count} dokumen berumur lebih dari 90 hari senilai ${fmtIDR(overdue.nominal)} yang belum ${m.terminal==='Cair'?'cair':'dibayar'} — perlu perhatian khusus.`);
  } else {
    lines.push(`Tidak ada dokumen ${m.docType} yang berumur lebih dari 90 hari — siklus proses relatif terkendali.`);
  }
  const dsoLabel = m.docType==='AR' ? 'DSO (Days Sales Outstanding)' : 'DPO (Days Payable Outstanding)';
  if(m.dsoAvgDays!==null){
    lines.push(`${dsoLabel} saat ini ±${m.dsoAvgDays} hari, dihitung dari dokumen yang sudah benar-benar ${m.terminal.toLowerCase()}.`);
  } else {
    lines.push(`${dsoLabel} belum dapat dihitung karena belum ada dokumen ${m.docType} yang selesai (${m.terminal}).`);
  }
  lines.push(`${m.docType==='AR'?'Penyaluran ke dealer':'Pembebanan ke dealer'}: ${m.disbursePct}% dari total nominal ${m.docType} (${fmtIDR(m.disburseYesNominal)} dari ${fmtIDR(m.totalNominal)}) di-flag "${disburseQuestion(m.docType)}" = Yes.`);
  if(m.polaBayarByDept.length>=2){
    const fastest = m.polaBayarByDept[0], slowest = m.polaBayarByDept[m.polaBayarByDept.length-1];
    lines.push(`Pola bayar tercepat: <strong>${fastest.dep}</strong> (±${fastest.avgDays} hari); terlambat: <strong>${slowest.dep}</strong> (±${slowest.avgDays} hari).`);
  }
  if(m.topDepts.length){
    lines.push(`Kontributor nilai ${m.docType} terbesar adalah <strong>${m.topDepts[0].dep}</strong> (${fmtIDR(m.topDepts[0].nominal)}).`);
  }
  lines.push(`Rata-rata waktu siklus (dari pengajuan hingga ${m.terminal.toLowerCase()}/saat ini) adalah ±${fmtDuration(m.avgCycle)}.`);
  return lines;
}

function renderDonutWithLabel(statusCounts, total, colorMap){
  let acc=0; const stops=[];
  statusCounts.forEach(sc=>{ const pct = total?(sc.count/total*100):0; stops.push(`${colorMap[sc.status]} ${acc}% ${acc+pct}%`); acc+=pct; });
  const gradient = total ? `conic-gradient(${stops.join(',')})` : 'conic-gradient(#e2e8f0 0% 100%)';
  return `
  <div class="relative w-32 h-32 flex-shrink-0">
    <div class="w-32 h-32 rounded-full" style="background:${gradient}"></div>
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="w-[74px] h-[74px] rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
        <span class="text-lg font-bold text-primary leading-none">${total}</span>
        <span class="text-[9px] text-slate-400 mt-0.5">Dokumen</span>
      </div>
    </div>
  </div>`;
}

function renderTypeReportSection(docType){
  const m = typeMetrics(docType);
  const statusColors = {'Draft':'#94a3b8','Proses Tax':'#f59e0b','Proses Acc':'#f97316','Proses Evopay':'#a855f7','Tagih':'#2563eb','Cair':'#16a34a','Bayar':'#0d9488'};
  const accent = docType==='AR' ? 'indigo' : 'rose';
  const maxSla = Math.max(1, ...m.slaByStage.map(s=>s.avgMs));
  const maxBucketNominal = Math.max(1, ...m.buckets.map(b=>b.nominal));
  const maxDeptNominal = Math.max(1, ...m.topDepts.map(d=>d.nominal));
  const series = monthlySeries(docType);
  const maxSeriesDays = Math.max(1, ...series.map(s=>s.avgDays));

  return `
  <div class="bg-white rounded-xl soft-lift border border-slate-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-${accent}-50/40">
      <h4 class="font-bold text-${accent}-700 flex items-center gap-2 text-base">
        <span class="px-2 py-0.5 rounded text-[11px] font-black ${TYPE_BADGE[docType]}">${docType}</span>
        Laporan ${DOC_TYPE_LABEL[docType]}
      </h4>
      <div class="flex items-center gap-4 text-xs text-slate-500">
        <span class="px-2.5 py-1 rounded-full bg-${accent}-100 text-${accent}-700 font-bold">${docType==='AR'?'DSO':'DPO'}: ${m.dsoAvgDays!==null ? m.dsoAvgDays+' hari' : '—'}</span>
        <span>Total: <strong class="text-slate-800">${fmtIDR(m.totalNominal)}</strong></span>
        <span>${m.terminal}: <strong class="text-green-600">${fmtIDR(m.settledNominal)}</strong></span>
        <span>Outstanding: <strong class="text-amber-600">${fmtIDR(m.outstandingNominal)}</strong></span>
      </div>
    </div>

    <div class="px-6 pt-5 pb-1">
      <div class="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-xs text-slate-500 flex items-start gap-2">
        ${msi('info','text-[16px] flex-shrink-0 text-slate-400')}
        <span><strong>${docType==='AR'?'DSO (Days Sales Outstanding)':'DPO (Days Payable Outstanding)'}</strong> — rata-rata jumlah hari dari dokumen diajukan hingga benar-benar ${m.terminal.toLowerCase()}, dihitung dari dokumen yang sudah selesai.</span>
      </div>
    </div>

    <div class="px-6 pt-5">
      <h5 class="text-sm font-bold text-slate-700 mb-1">Time Series SLA &amp; ${docType==='AR'?'DSO':'DPO'} per Bulan (dokumen ${m.terminal})</h5>
      <p class="text-xs text-slate-400 mb-3">Rata-rata hari siklus (pengajuan &rarr; ${m.terminal.toLowerCase()}) dikelompokkan berdasarkan bulan dokumen ${m.terminal.toLowerCase()}.</p>
      ${series.length ? `
      <div class="flex items-end gap-3 h-40 border-b border-slate-100 pb-2">
        ${series.map(s=>`
        <div class="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
          <span class="text-[10px] font-mono font-bold text-${accent}-600">${s.avgDays}h</span>
          <div class="w-full max-w-[30px] bg-${accent}-500 rounded-t" style="height:${(s.avgDays/maxSeriesDays*100).toFixed(0)}%;min-height:4px"></div>
          <span class="text-[10px] text-slate-400 font-semibold">${s.label}</span>
        </div>`).join('')}
      </div>
      <p class="text-[11px] text-slate-400 mt-2">Jumlah dokumen ${m.terminal.toLowerCase()} per bulan: ${series.map(s=>`${s.label} (${s.count})`).join(', ')}.</p>
      ` : `<p class="text-sm text-slate-400 py-6 text-center">Belum ada dokumen ${docType} yang ${m.terminal.toLowerCase()} untuk dianalisis per bulan.</p>`}
    </div>

    <div class="px-6 pt-5">
      <h5 class="text-sm font-bold text-slate-700 mb-1">Evaluasi ${docType==='AR'?'Penyaluran ke Dealer (Serapan)':'Pembebanan ke Dealer'}</h5>
      <p class="text-xs text-slate-400 mb-3">Nominal dokumen ${docType} yang di-flag "${disburseQuestion(docType)}" = Yes, dibandingkan total nominal ${docType}.</p>
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <div class="bg-slate-100 h-4 rounded-full overflow-hidden">
            <div class="bg-${accent}-500 h-full rounded-full flex items-center justify-end pr-2" style="width:${m.disbursePct}%">
              ${m.disbursePct>15?`<span class="text-[10px] text-white font-bold">${m.disbursePct}%</span>`:''}
            </div>
          </div>
          <div class="flex justify-between text-xs text-slate-500 mt-1.5">
            <span>${fmtIDR(m.disburseYesNominal)} (${m.disburseYesCount} dok. ${disburseShortLabel(docType)})</span>
            <span>Total: ${fmtIDR(m.totalNominal)}</span>
          </div>
        </div>
        <div class="text-3xl font-extrabold text-${accent}-600 flex-shrink-0">${m.disbursePct}%</div>
      </div>
    </div>

    <div class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Pie distribusi status -->
      <div>
        <h5 class="text-sm font-bold text-slate-700 mb-3">Distribusi Status (${docType})</h5>
        <div class="flex items-center gap-6">
          ${renderDonutWithLabel(m.statusCounts, m.total, statusColors)}
          <div class="flex-1 space-y-2">
            ${m.statusCounts.map(sc=>`
            <div class="flex items-center gap-2 text-sm">
              <div class="w-2.5 h-2.5 rounded-sm flex-shrink-0" style="background:${statusColors[sc.status]}"></div>
              <span class="text-slate-500 flex-1">${sc.status}</span>
              <span class="font-mono font-bold text-slate-800">${sc.count}</span>
              <span class="text-[10px] text-slate-400 w-10 text-right">${m.total?Math.round(sc.count/m.total*100):0}%</span>
            </div>`).join('') || '<p class="text-sm text-slate-400">Belum ada data.</p>'}
          </div>
        </div>
      </div>

      <!-- SLA per tahap -->
      <div>
        <h5 class="text-sm font-bold text-slate-700 mb-3">SLA Rata-rata per Tahap Proses</h5>
        <div class="space-y-2.5">
          ${m.slaByStage.map(s=>`
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-slate-500">${s.status}</span>
              <span class="font-mono font-bold text-slate-800">${fmtDuration(s.avgMs)}</span>
            </div>
            <div class="bg-slate-100 h-2 rounded-full overflow-hidden">
              <div class="bg-${accent}-500 h-full rounded-full" style="width:${(s.avgMs/maxSla*100).toFixed(0)}%"></div>
            </div>
          </div>`).join('') || '<p class="text-sm text-slate-400">Belum cukup data transisi status.</p>'}
          <div class="pt-2 mt-2 border-t border-slate-100 flex justify-between text-xs">
            <span class="text-slate-500 font-semibold">Rata-rata Siklus Total</span>
            <span class="font-mono font-bold text-primary">${fmtDuration(m.avgCycle)}</span>
          </div>
        </div>
      </div>

      <!-- Aging report -->
      <div>
        <h5 class="text-sm font-bold text-slate-700 mb-3">Aging ${docType==='AR'?'Piutang':'Utang'} Outstanding</h5>
        <div class="space-y-2.5">
          ${m.buckets.map(b=>`
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-slate-500">${b.label}</span>
              <span class="font-mono font-bold text-slate-800">${b.count} dok. &middot; ${fmtIDR(b.nominal)}</span>
            </div>
            <div class="bg-slate-100 h-2 rounded-full overflow-hidden">
              <div class="bg-amber-500 h-full rounded-full" style="width:${(b.nominal/maxBucketNominal*100).toFixed(0)}%"></div>
            </div>
          </div>`).join('')}
        </div>
      </div>

      <!-- Top related dept -->
      <div>
        <h5 class="text-sm font-bold text-slate-700 mb-3">Top Related Dept berdasarkan Nilai ${docType}</h5>
        <div class="space-y-2.5">
          ${m.topDepts.map(d=>`
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-slate-500">${d.dep}</span>
              <span class="font-mono font-bold text-slate-800">${fmtIDR(d.nominal)}</span>
            </div>
            <div class="bg-slate-100 h-2 rounded-full overflow-hidden">
              <div class="bg-${accent}-500 h-full rounded-full" style="width:${(d.nominal/maxDeptNominal*100).toFixed(0)}%"></div>
            </div>
          </div>`).join('') || '<p class="text-sm text-slate-400">Belum ada data.</p>'}
        </div>
      </div>

      <!-- Pola bayar per dept -->
      <div class="lg:col-span-2">
        <h5 class="text-sm font-bold text-slate-700 mb-1">Analisis Pola Bayar per Related Dept (${docType==='AR'?'kecepatan pencairan':'kecepatan pembayaran'})</h5>
        <p class="text-xs text-slate-400 mb-3">Diurutkan dari tercepat ke terlambat, dihitung dari dokumen yang sudah ${m.terminal.toLowerCase()}.</p>
        ${m.polaBayarByDept.length ? `
        <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead><tr class="bg-slate-50 border-b border-slate-200">
            <th class="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Peringkat</th>
            <th class="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Related Dept</th>
            <th class="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Rata-rata Hari</th>
            <th class="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Jumlah Dokumen Selesai</th>
            <th class="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Predikat</th>
          </tr></thead>
          <tbody class="divide-y divide-slate-100">
            ${m.polaBayarByDept.map((d,i)=>`
            <tr>
              <td class="px-4 py-2.5 text-slate-400 font-mono text-xs">#${i+1}</td>
              <td class="px-4 py-2.5 font-semibold text-slate-800">${d.dep}</td>
              <td class="px-4 py-2.5 font-mono font-bold text-slate-800">${d.avgDays} hari</td>
              <td class="px-4 py-2.5 text-slate-500">${d.count}</td>
              <td class="px-4 py-2.5">
                ${i===0 ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-green-100 text-green-700">Tercepat</span>`
                  : i===m.polaBayarByDept.length-1 && m.polaBayarByDept.length>1 ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700">Terlambat</span>`
                  : `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-500">Normal</span>`}
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
        </div>` : '<p class="text-sm text-slate-400">Belum ada dokumen yang selesai untuk dianalisis.</p>'}
      </div>
    </div>

    <div class="px-6 pb-6">
      <div class="bg-${accent}-50 border border-${accent}-100 rounded-lg p-4">
        <h5 class="text-xs font-bold uppercase tracking-wide text-${accent}-700 mb-2 flex items-center gap-1.5">${msi('lightbulb','text-[16px]')} Insight ${docType}</h5>
        <ul class="space-y-1.5 text-sm text-slate-700 list-disc list-inside">
          ${typeInsights(m).map(line=>`<li>${line}</li>`).join('')}
        </ul>
      </div>
    </div>
  </div>`;
}

function renderReports(){
  const docs = filteredDocsForReport();
  const months=[]; const now=new Date();
  for(let i=5;i>=0;i--){ const dt=new Date(now.getFullYear(), now.getMonth()-i, 1); months.push({label:dt.toLocaleDateString('id-ID',{month:'short'}), key:dt.getFullYear()+'-'+dt.getMonth(), ar:0, ap:0}); }
  docs.forEach(d=>{ const dt=new Date(d.createdAt); const key=dt.getFullYear()+'-'+dt.getMonth(); const b=months.find(m=>m.key===key); if(b){ if(d.docType==='AR') b.ar++; else b.ap++; } });
  const maxMonth = Math.max(1, ...months.map(m=>m.ar+m.ap));

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const avMonths = availableReportMonths();
  const avYears = availableReportYears();

  return `
  <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h3 class="text-[28px] md:text-[32px] font-bold text-primary leading-tight">Laporan</h3>
      <p class="text-slate-500">Analitik terpisah untuk dokumen AR (Account Receivable) &amp; AP (Account Payable).</p>
    </div>
  </div>

  <section class="bg-white rounded-xl p-5 soft-lift border border-slate-200">
    <h4 class="font-bold text-primary mb-3 flex items-center gap-2 text-sm">${msi('filter_alt','text-[18px]')} Filter Bulan &amp; Tahun Dokumen</h4>
    <div class="flex flex-wrap gap-4">
      <div class="flex-1 min-w-[240px]">
        <p class="text-[10.5px] font-bold uppercase tracking-wide text-slate-400 mb-2">Bulan</p>
        <div class="flex flex-wrap gap-1.5">
          ${avMonths.map(mi=>`<button type="button" data-report-month="${mi}" class="px-2.5 py-1 rounded text-xs font-bold border ${state.reportMonths.includes(mi)?'bg-primary text-white border-primary':'bg-white text-slate-500 border-slate-200 hover:border-primary'}">${MONTH_NAMES[mi]}</button>`).join('')}
        </div>
      </div>
      <div class="flex-1 min-w-[160px]">
        <p class="text-[10.5px] font-bold uppercase tracking-wide text-slate-400 mb-2">Tahun</p>
        <div class="flex flex-wrap gap-1.5">
          ${avYears.map(y=>`<button type="button" data-report-year="${y}" class="px-2.5 py-1 rounded text-xs font-bold border ${state.reportYears.includes(y)?'bg-primary text-white border-primary':'bg-white text-slate-500 border-slate-200 hover:border-primary'}">${y}</button>`).join('')}
        </div>
      </div>
      ${(state.reportMonths.length || state.reportYears.length) ? `<button type="button" id="clearReportFilter" class="self-end px-3 py-1.5 rounded text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50">Reset Filter</button>` : ''}
    </div>
  </section>

  <div class="bg-white rounded-xl p-6 soft-lift border border-slate-200">
    <h4 class="font-bold text-primary mb-4">Volume Pengajuan per Bulan (AR vs AP)</h4>
    <div class="flex items-end gap-3 h-44">
      ${months.map(m=>`
      <div class="flex-1 flex flex-col items-center justify-end gap-2 h-full">
        <div class="w-full max-w-[36px] flex flex-col-reverse rounded-t overflow-hidden relative" style="height:${((m.ar+m.ap)/maxMonth*100).toFixed(0)}%;min-height:${(m.ar+m.ap)>0?'4px':'0'}">
          <div class="bg-indigo-600 w-full flex items-start justify-center" style="height:${m.ar+m.ap>0 ? (m.ar/(m.ar+m.ap)*100).toFixed(0):0}%">${m.ar>0?`<span class="text-[9px] text-white font-bold pt-0.5">${m.ar}</span>`:''}</div>
          <div class="bg-rose-500 w-full flex items-start justify-center" style="height:${m.ar+m.ap>0 ? (m.ap/(m.ar+m.ap)*100).toFixed(0):0}%">${m.ap>0?`<span class="text-[9px] text-white font-bold pt-0.5">${m.ap}</span>`:''}</div>
        </div>
        <span class="text-[10.5px] text-slate-400 font-semibold">${m.label}</span>
      </div>`).join('')}
    </div>
    <div class="flex items-center gap-4 mt-3 text-[11px] text-slate-500">
      <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block"></span>AR</span>
      <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>AP</span>
    </div>
  </div>

  ${renderTypeReportSection('AR')}
  ${renderTypeReportSection('AP')}
  `;
}

