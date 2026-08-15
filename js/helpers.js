/* ================= SLA TIMELINE ================= */
function statusTimeline(doc){
  const events = [{status: doc.auditTrail[0] ? (doc.auditTrail[0].statusTo || 'Draft') : 'Draft', date: doc.createdAt}];
  doc.auditTrail.forEach(t=>{ if(t.type==='status_change') events.push({status:t.statusTo, date:t.date}); });
  const out = [];
  for(let i=0;i<events.length;i++){
    const start = new Date(events[i].date);
    const end = events[i+1] ? new Date(events[i+1].date) : new Date();
    out.push({status:events[i].status, start, end, ongoing: !events[i+1]});
  }
  return out;
}

