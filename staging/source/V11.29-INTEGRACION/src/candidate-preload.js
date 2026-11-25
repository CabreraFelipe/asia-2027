// Only for the synthetic, localhost candidate. No native browser API is overwritten.
// Lexical bindings are shared by classic scripts and modules in this document.
const asiaCandidateSession=(()=>{
 if(location.hostname!=='127.0.0.1'||parent===window||!parent.__asiaCandidateFixture)throw Error('Candidato CI no autorizado');
 const f=parent.__asiaCandidateFixture;
 if(typeof f.readSession!=='function'||typeof f.passphrase!=='string'||!f.storage||!f.sessionStorage)throw Error('Contexto incompleto');
 return Object.freeze({readSession:f.readSession,passphrase:f.passphrase,storage:f.storage,sessionStorage:f.sessionStorage});
})();
const localStorage=asiaCandidateSession.storage;
const sessionStorage=asiaCandidateSession.sessionStorage;
// The explicit module adapter alone opens its own encrypted IndexedDB repository.
const indexedDB=undefined;
