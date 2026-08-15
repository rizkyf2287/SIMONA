/* ================= ROOT RENDER ================= */
function render(){
  const app = document.getElementById('app');
  if(state.view==='login'){ app.innerHTML = renderLogin(); bindLogin(); return; }
  app.innerHTML = renderShell();
  bindShell();
}


/* ================= INIT ================= */
state.documents = seedDocuments();
state.users = seedUsers();
render();
initStorage();
