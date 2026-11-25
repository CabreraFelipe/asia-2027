// CI only. The production shell must use an authenticated asset package instead of this fixture.
export function candidateMount({doc=document,anchor=doc.body}={}){
 return async fixture=>{
  if(location.hostname!=='127.0.0.1'||globalThis.__asiaCandidateFixture)throw Error('Montaje no autorizado');
  globalThis.__asiaCandidateFixture=fixture;
  const frame=doc.createElement('iframe');frame.title='Diario Asia V10.6';frame.style.cssText='width:100%;height:80vh;border:0';
  const remove=()=>{frame.remove();delete globalThis.__asiaCandidateFixture};
  const loaded=new Promise(r=>frame.addEventListener('load',r,{once:true}));
  frame.src='/staging/source/V11.29-INTEGRACION/tests/candidate/index.html';anchor.append(frame);
  try{await loaded;for(let i=0;i<150;i++){if(frame.contentWindow.asiaGym84Ready===true)return {frame,remove,hide(){frame.hidden=true}};await new Promise(r=>setTimeout(r,100))}throw Error('Diario no inicializado')}catch(e){remove();throw e}
 };
}
