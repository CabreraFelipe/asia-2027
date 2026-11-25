// Browser test harness only. A synthetic, freshly-created localhost origin.
(()=>{if(location.hostname!=='127.0.0.1'||parent===window||!parent.__asiaFixture)throw Error('Fixture no autorizada');
 const f=parent.__asiaFixture;
 for(const [key,value] of Object.entries({localStorage:f.storage,sessionStorage:f.sessionStorage,indexedDB:f.indexedDB}))
  Object.defineProperty(window,key,{value,writable:false,configurable:false});
 window.__asiaOriginalMounted=true;
})();