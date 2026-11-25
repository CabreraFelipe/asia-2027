import {createAccountServices} from '../src/service-client.mjs';
import {openUnifiedRepository} from '../../V11.34-INTEGRACION/src/unified-repository.mjs';
import {openDeviceSession} from '../../V11.30-INTEGRACION/src/device-session.mjs';
const check=(x,m)=>{if(!x)throw Error(m)},sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,m){for(let i=0;i<150;i++){if(fn())return;await sleep(100)}throw Error(m)}
async function rejects(fn,p){try{await fn()}catch(e){check(p.test(e.message),e.message);return}throw Error('Se esperaba rechazo')}
function transient(){const m=new Map();return Object.freeze({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i]??null,get length(){return m.size}})}
export async function run(){
 const A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32),policy=globalThis.asiaAccounts106,origin='https://asia-v1111-identity-staging.example.workers.dev',passphrase='frase sintética servicios V11.39';
 let accountId=A,csrf='a',frame,session,services;const readSession=async()=>({accountId,csrf}),calls=[];
 const repository=await openUnifiedRepository();
 const fetcher=async(url,opt)=>{
  const kind=new URL(url).pathname.split('/').pop();check(url.startsWith(origin+'/v11.39/services/')&&opt.credentials==='same-origin'&&!opt.headers.Authorization,'Transporte histórico');
  calls.push({accountId,kind,body:opt.body?JSON.parse(opt.body):null});
  const day=new Date().toISOString().slice(0,10),updated_at=new Date().toISOString(),marker=accountId===A?'A':'B';
  const result=kind==='health'?{records:[{day,metric:'step_count',qty:accountId===A?4321:1234,units:'count',updated_at}]}:kind==='workouts'?{workouts:[{id:'fixture-'+marker,day,name:'Sesión '+marker,duration_sec:900}]}:{model:'fixture-sintético',remaining:0,result:kind==='coach'?{answer:'[SIMULACIÓN] Coach '+marker,proposal:null}:'[SIMULACIÓN] Chat '+marker};
  return new Response(JSON.stringify({ok:true,syntheticOnly:true,...result}));
 };
 async function mount(){
  session=await openDeviceSession({readSession,repository:repository.local,passphrase,policy});services=await createAccountServices({origin,readSession,fetcher});
  globalThis.__asiaCandidateFixture={readSession,passphrase,storage:session.storage,sessionStorage:transient(),services};
  frame=document.createElement('iframe');frame.style.width='390px';frame.style.height='844px';const loaded=new Promise(r=>frame.addEventListener('load',r,{once:true}));frame.src='/staging/source/V11.29-INTEGRACION/tests/candidate/index.html';document.body.append(frame);await loaded;
  const w=frame.contentWindow,d=frame.contentDocument;await until(()=>w.asiaGym84Ready===true,'Gym no disponible');return {w,d,el:id=>d.getElementById(id)};
 }
 async function unmount(){services.close();frame.remove();frame=null;delete globalThis.__asiaCandidateFixture;await session.close()}
 try{
  let {w,el}=await mount();w.confirm=()=>true;
  el('tabHealth').click();el('healthRefresh').click();el('watchRefresh43').click();
  await until(()=>el('healthStatus').textContent.includes('día')&&w.asiaWatchRows84().some(x=>x.id==='fixture-A'),'Salud/Watch no renderizados');
  await session.flush();check(Object.values(JSON.parse(session.storage.getItem('asia2027-v1')).diet).some(x=>x.stepsApple881?.count===4321),'Pasos no persistidos');
  el('healthShare').checked=false;el('coachShare50').checked=false;el('coachMode50').value='chat';el('coachQuestion50').value='Consulta sintética';
  const n=calls.filter(x=>x.kind==='coach').length;w.confirm=()=>false;el('coachAsk50').click();await sleep(100);check(calls.filter(x=>x.kind==='coach').length===n,'Consentimiento ignorado');
  w.confirm=()=>true;el('coachAsk50').click();await until(()=>el('coachStatus50').textContent.includes('Análisis guardado'),'Coach no renderizado: '+el('coachStatus50').textContent);
  await session.flush();check(session.storage.getItem('asia-coach-v50').includes('Coach A'),'Coach no persistido');
  await rejects(()=>w.asiaVisionRequest84('meal','',[]),/no habilitado/);await rejects(()=>w.asiaBackupRequest844(),/deshabilitada/);
  check(w.localStorage.getItem('asia-ai-access-v1')===null,'Credencial nativa escrita');
  const previous=services;await unmount();
  accountId=B;csrf='b';({w,el}=await mount());el('tabHealth').click();el('healthRefresh').click();await until(()=>w.asiaWatchRows84().some(x=>x.id==='fixture-B'),'B no recibe propios entrenamientos');
  check(!w.asiaWatchRows84().some(x=>x.id==='fixture-A')&&!session.storage.getItem('asia-coach-v50')?.includes('Coach A'),'Datos cruzados');
  await rejects(()=>previous.request('health'),/cerrados/);await unmount();
  return {ok:true,checks:'Controles reales V10.6 Salud, Watch, Coach y consentimiento; persistencia cifrada pasos/chat, aislamiento A/B, bloqueo de credenciales y rutas históricas'};
 }finally{frame?.remove();delete globalThis.__asiaCandidateFixture;repository.close()}
}
