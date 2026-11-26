// Account-wide exclusive lease for cooperating tabs on the same origin.
// Native browser lock lifetime is tied to the page. No persisted token,
// timeout takeover, localStorage race, or release on pagehide.
export async function acquireAccountWriter1171(accountId,locks=globalThis.navigator?.locks){
 if(!/^acct_[a-f0-9]{32}$/.test(accountId||'')||typeof locks?.request!=='function'){
  const e=Error('Este navegador no permite coordinar la edición entre pestañas.');e.code='WRITER_UNAVAILABLE';throw e;
 }
 let settle,finish,closed=false;
 const acquired=new Promise(resolve=>{settle=resolve});
 const hold=new Promise(resolve=>{finish=resolve});
 const task=locks.request('asia-v1142-writer:'+accountId,{mode:'exclusive',ifAvailable:true},async lock=>{
  settle(!!lock);if(lock)await hold;
 });
 task.catch(()=>settle(false));
 if(!await acquired){const e=Error('La cuenta está abierta en otra pestaña. Cerrala y reintentá.');e.code='WRITER_BUSY';throw e}
 return Object.freeze({async release(){if(!closed){closed=true;finish()}await task}});
}
