(() => {
  'use strict';
  const endpoint = 'https://asia-2027-ai.cabrerafelipe2003.workers.dev/api';
  const tokenKey = 'asia-ai-access-v1';
  let token = '', busy = false, chat = [], pending = null;
  // One inference flight across legacy chat, Coach, OCR, nutrition and visual analysis. No queue or automatic retries.
  let inference874=false;
  async function singleInference874(fn){
    if(inference874)throw Error('Ya hay una consulta de IA en curso. Esperá a que termine; no se envió otra.');
    inference874=true;try{return await fn();}finally{inference874=false;}
  }
  try { const saved=JSON.parse(localStorage.getItem('asia-chat-v4')||'[]'); if(Array.isArray(saved)) chat=saved.filter(x=>['user','assistant'].includes(x.role)&&typeof x.text==='string').slice(-12); }catch{}
  function saveChat(){try{localStorage.setItem('asia-chat-v4',JSON.stringify(chat))}catch{}}
  try { window.asiaWeeklyAI=JSON.parse(localStorage.getItem('asia-weekly-ai-v4')||'null'); }catch{}
  try { token = localStorage.getItem(tokenKey) || ''; } catch {}
  $('aiRemember').checked = Boolean(token);
  const status = (id, text) => { $(id).textContent = text; };
  status('aiConnection', token ? 'Clave guardada en este dispositivo. Podés probar la conexión.' : 'IA sin configurar.');
  const buttons = ['healthAnalyze','aiScan','aiDiet','aiWeekly','aiTraining','aiAsk','aiConnect','aiDisconnect','aiClearChat'];
  function setBusy(v) { busy = v; buttons.forEach(id => $(id).disabled = v); }
  function getToken() {
    if (!/^[a-fA-F0-9]{64}$/.test(token)) {
      if(window.asiaOpenSettings)window.asiaOpenSettings();else $('aiSettings').scrollIntoView({behavior:'smooth'});
      throw Error('Primero configurá tu clave APP_ACCESS_TOKEN en Conexión con IA.');
    }
    return token;
  }
  async function call(kind, payload, route=endpoint) {
    return singleInference874(()=>callTransport874(kind,payload,route));
  }
  async function callTransport874(kind,payload,route) {
    const access = getToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000);
    let diagnosticHTTP=false;
    try {
      const response = await fetch(route, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+access},
        body:JSON.stringify(kind==='coach'?payload:{kind,...payload}), signal:controller.signal, redirect:'error', cache:'no-store', credentials:'omit'
      });
      let body; try { body = await response.json(); } catch { throw Error('Respuesta no válida del servidor.'); }
      if (!response.ok || body?.ok !== true) {
        diagnosticHTTP=true;const upstream=Number.isInteger(body?.upstream_status)&&body.upstream_status>=100&&body.upstream_status<=599?body.upstream_status:null;
        window.asiaDiagEvent56?.('openai', 'error', response.status, upstream);
        const code=' (HTTP '+response.status+(upstream?'; OpenAI HTTP '+upstream:'')+')';
        const message=response.status===429?'Límite de consultas alcanzado. Revisá el cupo del servicio':response.status===401||response.status===403?'Acceso rechazado. Revisá la clave personal':response.status===503?'Servicio temporalmente no disponible':'No se pudo completar la consulta';
        throw Error(message+code);
      }
      window.asiaDiagEvent56?.('openai', 'ok');
      return body;
    } catch(e) { if(!diagnosticHTTP)window.asiaDiagEvent56?.('openai','error');if(e.name === 'AbortError') throw Error('Tiempo de espera agotado. No se reenvió automáticamente la consulta.'); if(e instanceof TypeError)throw Error('No se pudo conectar a la IA. Revisá la conexión.'); throw e; }
    finally { clearTimeout(timer); }
  }
  async function task(id, message, fn) {
    if (busy) return;
    setBusy(true); status(id,message);
    try { await fn(); } catch(e) { status(id, 'No se pudo completar: '+e.message); }
    finally { setBusy(false); }
  }
  const suffix = r => '\n\n'+r.model+' · '+r.remaining+' solicitudes de este tipo disponibles hoy (UTC).';
  $('aiConnect').onclick = () => task('aiConnection','Probando conexión…',async()=>{
    if(inference874)throw Error('Hay una consulta de IA en curso. No se cambió la clave.');
    const candidate = $('aiToken').value.trim() || token;
    if(!/^[a-fA-F0-9]{64}$/.test(candidate)) throw Error('La clave debe contener 64 caracteres hexadecimales.');
    const old = token; token = candidate;
    try {
      const r = await call('chat',{data:{question:'Respondé solamente: Conexión correcta. Prueba sin datos personales.'}});
      if(old!==token){window.asiaHealthReset?.();window.asiaBackupReset42?.();window.asiaWatchReset43?.();window.asiaCoachReset50?.();}
      try { if ($('aiRemember').checked) localStorage.setItem(tokenKey, token); else localStorage.removeItem(tokenKey); }
      catch { status('aiConnection','Conexión correcta. No se pudo guardar la clave; se usará durante esta sesión.'); $('aiToken').value=''; return; }
      $('aiToken').value=''; status('aiConnection','Conexión correcta. '+r.model+' · '+r.remaining+' consultas de chat disponibles hoy.');
    } catch(e) { token = old; throw e; }
  });
  $('aiDisconnect').onclick=()=>{ if(inference874||busy){status('aiConnection','Hay una consulta en curso. Esperá a que termine antes de olvidar la clave.');return;} window.asiaHealthReset?.(); window.asiaBackupReset42?.(); window.asiaWatchReset43?.();window.asiaCoachReset50?.(); token=''; $('aiToken').value=''; $('aiRemember').checked=false; try{localStorage.removeItem(tokenKey)}catch{}; status('aiConnection','Clave olvidada en este dispositivo.'); };
  // Solo se transfieren datos numéricos/estados de registros recientes; no fotos guardadas ni notas libres.
  const ordered = (obj, n) => Object.entries(obj||{}).sort(([a],[b])=>a.localeCompare(b)).slice(-n);
  function bodySummary(n=42) { return ordered(data.body,n).map(([d,b])=>({date:d,...Object.fromEntries(fields.filter(([k])=>!k.endsWith('896')).map(([k])=>[k,b[k]]).filter(([,v])=>valid(v)))})); }
  function dietSummary(n=42) { return ordered(data.diet,n).map(([d,b])=>({date:d,vacation_day:d>='2026-12-26'&&d<='2027-01-07',adherence:['yes','partial','no','vac'].includes(b.ad)?b.ad:null,steps:b.steps!==''&&Number.isFinite(+b.steps)?+b.steps:null,energy:b.energy!==''&&Number.isFinite(+b.energy)?+b.energy:null,intake_kcal:typeof b.intakeKcal==='number'?b.intakeKcal:null,protein_g:typeof b.proteinG==='number'?b.proteinG:null,intake_complete:b.intakeComplete===true,sleep_hours:b.sleep!=null&&b.sleep!==''&&Number.isFinite(+b.sleep)?+b.sleep:null,recovery:b.recovery!=null&&b.recovery!==''&&Number.isFinite(+b.recovery)?+b.recovery:null})); }
  function workSummary(n=16) { return ordered(data.work,n).map(([k,w])=>({date:k.slice(0,10),routine:routines[+k.split('_')[1]]?.name,cardio_minutes:Number(w.cardioMin)||0,cardio_speed:Number(w.cardioSpeed)||null,cardio_incline:Number(w.cardioIncline)||0,cardio_rpe:Number(w.cardioRPE)||null,exercises:Object.fromEntries(Object.entries(w.ex||{}).map(([name,sets])=>[name,sets.filter(s=>s.done&&valid(s.kg)&&valid(s.reps)).map(s=>[s.kg,s.reps])]).filter(([,sets])=>sets.length))})); }
  function summary(includeWork=true){
    let p={today:date(),baseline_kg:data.settings?.baseline??null,height_m:data.settings?.height??null,body:bodySummary(),diet:dietSummary(),diet_codes:{yes:'cumplido',partial:'parcial',no:'no cumplido',vac:'vacaciones'},exercise_sets_format:'[kg externos, repeticiones]; unilateral por pierna; 0 kg puede ser peso corporal',workouts:includeWork?workSummary():[],plan:{meals:'Diario flexible de cuatro comidas; el usuario no decide qué se cocina. No imponer menú ni asumir qué comió. Sugerir cantidades orientativas de los platos disponibles; registrar solo ingesta real.',workout:routines.map(r=>({name:r.name,cardio:r.cardio,ex:r.ex.map(e=>e.slice(0,4))})),limits:'150 min maximo por sesion, 1–3 RIR; peso objetivo 72 kg, 70 aspiracional.'}};
    p.current_goals=window.asiaGoals50?.();p.vacation_mode=window.asiaVacationContext44?.();
    const health = window.asiaHealthSummary?.(); if(health?.daily?.length)p.apple_health=health;
    while(JSON.stringify(p).length>20500&&p.workouts.length>1)p.workouts.shift();
    while(JSON.stringify(p).length>20500&&p.body.length>1)p.body.shift();
    while(JSON.stringify(p).length>20500&&p.apple_health?.daily?.length>1)p.apple_health.daily.shift();
    return p;
  }
  function sendAnalysis(kind,id,selected=false){
    if(!confirm('Se enviará a OpenAI un resumen de tus registros recientes (incluida Salud si activaste esa opción), sin fotos ni notas libres. ¿Continuar?'))return;
    task(id,'Analizando los registros…',async()=>{
      if(kind==='training'&&!Object.keys(data.work||{}).length)throw Error('Guardá al menos una sesión antes de analizar.');
      if(kind!=='training'&&!Object.keys(data.body||{}).length&&!Object.keys(data.diet||{}).length&&!Object.keys(data.work||{}).length)throw Error('Guardá registros antes de pedir un análisis.');
      const p=summary(); if(kind==='weekly'){const d=date(),dow=new Date(d+'T12:00:00').getDay();p.weekly_control_date=shift(d,-((dow+6)%7));p.weekly_period={start:shift(p.weekly_control_date,-7),end:shift(p.weekly_control_date,-1)};} if(selected)p.selected_exercise=$('exercisePick').value;
      const r=await call(kind,{data:p}); renderFormatted($(id),String(r.result)+suffix(r)); if(kind==='weekly'){let d=date(),dow=new Date(d+'T12:00:00').getDay();window.asiaWeeklyAI={control:shift(d,-((dow+6)%7)),at:d,text:String(r.result)};try{localStorage.setItem('asia-weekly-ai-v4',JSON.stringify(window.asiaWeeklyAI))}catch{};window.refreshWeeklyV4?.();}
    });
  }
  $('aiDiet').onclick=()=>sendAnalysis('diet','aiDietResult');
  $('aiWeekly').onclick=()=>sendAnalysis('weekly','aiDietResult');
  $('aiTraining').onclick=()=>sendAnalysis('training','aiTrainingResult',true);
  // Minimal safe Markdown renderer: creates DOM text and elements, never interprets arbitrary HTML.
  function inline(el,t){const re=/(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g;let i=0;for(const m of t.matchAll(re)){el.append(document.createTextNode(t.slice(i,m.index)));let v=m[0],n=document.createElement(v.startsWith('**')?'strong':v.startsWith('`')?'code':'em');n.textContent=v.slice(v.startsWith('**')?2:1,v.startsWith('**')?-2:-1);el.append(n);i=m.index+v.length}el.append(document.createTextNode(t.slice(i)));}
  function renderFormatted(el,t){el.replaceChildren();let list=null,table=null;for(let line of String(t).split('\n')){line=line.trim();if(!line){list=null;table=null;continue}if(/^\|.*\|$/.test(line)){list=null;let cells=line.slice(1,-1).split('|').map(x=>x.trim());if(cells.every(x=>/^:?-+:?$/.test(x)))continue;if(!table){let wrap=document.createElement('div');wrap.className='ai-table';table=document.createElement('table');wrap.append(table);el.append(wrap)}let row=table.insertRow();for(const cell of cells)inline(row.insertCell(),cell);continue}table=null;let h=line.match(/^#{1,6}\s+(.*)$/),b=line.match(/^[-*]\s+(.*)$/),o=line.match(/^\d+[.)]\s+(.*)$/);if(b||o){let tag=b?'UL':'OL';if(!list||list.tagName!==tag){list=document.createElement(tag.toLowerCase());el.append(list)}let li=document.createElement('li');inline(li,(b||o)[1]);list.append(li);continue}list=null;let p=document.createElement(h?'h3':'p');inline(p,h?h[1]:line);el.append(p)}}
  // V5.6 diagnostic routes: no personal information leaves the device for the optional AI test.
  window.asiaDiagAIHasAccess56=()=>/^[a-fA-F0-9]{64}$/.test(token);
  window.asiaDiagAIRead56=async(kind)=>{
    const routes={cloud:'/',health:'/health',workouts:'/workouts',backup:'/backup'};
    if(!Object.hasOwn(routes,kind))throw Error('Invalid diagnostic route');
    if(kind!=='cloud'&&!window.asiaDiagAIHasAccess56())return {configured:false};
    const c=new AbortController(),t=setTimeout(()=>c.abort(),12000);
    try{
      const r=await fetch(new URL(routes[kind],endpoint),{cache:'no-store',redirect:'error',credentials:'omit',signal:c.signal,headers:kind==='cloud'?{}:{Authorization:'Bearer '+token}});
      if(!r.ok)return {http:r.status};
      if(kind==='cloud')return {http:r.status,ok:true};
      const x=await r.json();
      if(x.ok!==true)return {http:r.status,invalid:true};
      const list=kind==='health'?x.records:kind==='workouts'?x.workouts:x.versions;
      if(!Array.isArray(list))return {http:r.status,invalid:true};
      const latest=list.reduce((v,row)=>{const n=Date.parse(kind==='backup'?row?.created_at:row?.updated_at);return Number.isFinite(n)?Math.max(v,n):v},0);
      return {ok:true,http:r.status,count:list.length,latest};
    }finally{clearTimeout(t)}
  };
  window.asiaDiagAITest56=async()=>{
    if(!window.asiaDiagAIHasAccess56())return {configured:false};
    if(busy||inference874)return {busy:true};
    setBusy(true);try{await call('chat',{data:{question:'Respondé solamente OK. Prueba técnica sin datos personales.'}});return {ok:true};}finally{setBusy(false)}
  };
  window.asiaCoachRequest50=payload=>call('coach',payload,endpoint.replace(/\/api$/,'/coach'));
  window.asiaBackupRequest844=async(method='GET',payload=null,id=null)=>{const access=getToken(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);try{const url=endpoint.replace(/\/api$/,'/backup844')+(id===null?'':'?id='+encodeURIComponent(id));const response=await fetch(url,{method,headers:{Authorization:'Bearer '+access,...(payload?{'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined,signal:controller.signal,cache:'no-store',redirect:'error',credentials:'omit'});let r;try{r=await response.json()}catch{throw Error('Respuesta no válida (HTTP '+response.status+').')}if(!response.ok||r.ok!==true){let e=Error(r.error||'HTTP '+response.status);e.status=response.status;throw e}return r}finally{clearTimeout(timer)}};
  window.asiaBackupRequest42=async(method='GET',payload=null,id=null)=>{const access=getToken(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);try{const url=endpoint.replace(/\/api$/,'/backup')+(id===null?'':'?id='+encodeURIComponent(id));const response=await fetch(url,{method,headers:{Authorization:'Bearer '+access,...(payload?{'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined,signal:controller.signal,cache:'no-store',redirect:'error',credentials:'omit'});let r;try{r=await response.json()}catch{throw Error('Respuesta no válida (HTTP '+response.status+').')}if(!response.ok||r.ok!==true){let e=Error(r.error||'HTTP '+response.status);e.status=response.status;throw e}return r}finally{clearTimeout(timer)}};
  window.asiaHealthHasAccess=()=>/^[a-fA-F0-9]{64}$/.test(token);
  window.asiaHealthGet=async()=>{
    const access=getToken(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
    try{const response=await fetch(endpoint.replace(/\/api$/,'/health'),{method:'GET',headers:{Authorization:'Bearer '+access},signal:controller.signal,cache:'no-store',redirect:'error',credentials:'omit'});let body;try{body=await response.json()}catch{throw Error('Respuesta no válida (HTTP '+response.status+').')}if(!response.ok||body.ok!==true||!Array.isArray(body.records))throw Error('No se pudieron leer los datos (HTTP '+response.status+').');return body.records;}
    finally{clearTimeout(timer)}
  };
  window.asiaWorkoutsGet43=async()=>{const access=getToken(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);try{const res=await fetch(endpoint.replace(/\/api$/,'/workouts'),{headers:{Authorization:'Bearer '+access},signal:controller.signal,cache:'no-store',redirect:'error',credentials:'omit'});let x;try{x=await res.json()}catch{throw Error('Respuesta inválida (HTTP '+res.status+')')}if(!res.ok||x.ok!==true||!Array.isArray(x.workouts))throw Error(x.error||'HTTP '+res.status);return x.workouts}finally{clearTimeout(timer)}};
  window.asiaHealthAnalyze=health=>task('healthAnalysis','Analizando actividad…',async()=>{
    const r=await call('chat',{data:{question:'Analizá mis indicadores de Apple Salud: actividad, tendencias, recuperación y gasto energético estimado. Señalá cobertura, datos faltantes y días parciales; no diagnostiques ni recomiendes ajustar calorías solo por el reloj.',apple_health:health}});renderFormatted($('healthAnalysis'),String(r.result)+suffix(r));
  });
  const classicStatus8813=document.createElement('p');classicStatus8813.id='classicStatus8813';classicStatus8813.className='meta';classicStatus8813.setAttribute('role','status');$('aiChatResult').after(classicStatus8813);
  function renderChat(){const el=$('aiChatResult');el.replaceChildren();for(const item of chat){const a=document.createElement('article');a.className=item.role;const b=document.createElement('strong');b.textContent=item.role==='user'?'Vos':'Entrenador IA';const p=document.createElement('div');if(item.role==='assistant')renderFormatted(p,item.text);else p.textContent=item.text;a.append(b,p);el.append(a);}}
  $('aiClearChat').onclick=()=>{if(!confirm('¿Borrar solo las conversaciones del chat clásico? El chat principal y su memoria se conservan.'))return;chat=[];saveChat();renderChat();classicStatus8813.textContent='Chat clásico eliminado.';};
  $('aiAsk').onclick=()=>{
    const question=$('aiQuestion').value.trim(); if(!question)return;
    const share=$('healthShare').checked;
    const history=chat.filter(x=>x.shared===false||(share&&x.shared===true)).slice(-6).map(x=>({role:x.role,text:x.text.slice(0,850)}));
    if(!confirm('Se enviará a Cloudflare y OpenAI tu consulta, el resumen de registros'+(share?' (con Salud si hay datos disponibles)':' (sin datos importados de Salud)')+' y hasta '+history.length+' mensajes anteriores compatibles con el permiso actual. Los mensajes antiguos sin permiso identificado no se reenvían. ¿Continuar?'))return;
    task('classicStatus8813','Consultando en modo clásico…',async()=>{
      const p=summary(); if(!share)delete p.apple_health; p.question=question;p.conversation=history;
      while(JSON.stringify(p).length>24500&&p.conversation.length)p.conversation.shift();
      if(JSON.stringify(p).length>24500)throw Error('Resumen demasiado extenso. Reducí la pregunta o revisá los registros.');
      const r=await call('chat',{data:p});chat.push({role:'user',text:question,shared:share},{role:'assistant',text:String(r.result)+suffix(r),shared:share});chat=chat.slice(-12);saveChat();if($('aiQuestion').value.trim()===question)$('aiQuestion').value='';renderChat();classicStatus8813.textContent='Respuesta recibida.';const last=$('aiChatResult').lastElementChild;if(last?.getClientRects().length)last.scrollIntoView({block:'start',behavior:'auto'});
    });
  };
  renderChat(); window.refreshWeeklyV4?.();
  const mapping={weight_kg:'weight',bmi:'bmi',body_fat_pct:'fat',fat_mass_kg:'fatMass',muscle_mass_kg:'muscle',skeletal_muscle_kg:'skeletal',visceral_fat:'visceral',water_pct:'water',protein_pct:'protein',bone_mass_kg:'bone',basal_metabolism_kcal:'bmr',body_age:'bodyAge',body_score:'bodyScore'};
  function resetReview(){pending=null;$('aiReview').hidden=true;$('aiReview').replaceChildren();}
  $('report').addEventListener('change',()=>{resetReview();status('aiScanStatus','');});
  $('measureDay').addEventListener('change',()=>{resetReview();status('aiScanStatus','');});
  async function imageForAI(file){
    if(!file||!file.type.startsWith('image/'))throw Error('Seleccioná una captura PNG o JPEG del informe.');
    if(file.size>25000000)throw Error('La captura supera 25 MB. Recortala o reducí su tamaño.');
    const url=URL.createObjectURL(file);
    try {
      const im=new Image(); await new Promise((res,rej)=>{im.onload=res;im.onerror=()=>rej(Error('No se pudo abrir esa imagen. Probá con PNG o JPEG.'));im.src=url;});
      const c=document.createElement('canvas'),scale=Math.min(1,1900/Math.max(im.width,im.height));c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(im,0,0,c.width,c.height);let result=c.toDataURL('image/jpeg',0.86);if(result.length>3500000)result=c.toDataURL('image/jpeg',0.65);if(result.length>3500000)throw Error('La imagen sigue siendo demasiado grande.');return result;
    } finally{URL.revokeObjectURL(url);}
  }
  window.asiaVisionRequest84=async(mode,question,images)=>singleInference874(async()=>{const access=getToken();const {requestVision84}=await import('./vision84.mjs');return requestVision84(endpoint.replace(/\/api$/,'/vision84'),access,mode,question,images);});
  window.asiaNutritionScan52=async(mode,file,stillAuthorized)=>singleInference874(async()=>{getToken();if(!['meal','label'].includes(mode))throw Error('Modo inválido');const image=await imageForAI(file);if(typeof stillAuthorized!=='function'||!stillAuthorized())throw Error('Cambió la selección o el permiso. No se envió la imagen.');return callTransport874('nutrition52',{mode,image},endpoint.replace(/\/api$/,'/nutrition'));});
  function showReview(r,file,chosenDate){
    if($('report').files[0]!==file||$('measureDay').value!==chosenDate)throw Error('La captura o fecha cambió durante el análisis. Volvé a escanear.');
    const v=r.result;if(!v||typeof v!=='object')throw Error('El servidor no devolvió datos estructurados.');
    const panel=$('aiReview');panel.replaceChildren(); const head=document.createElement('h3');head.textContent='Revisá la extracción';panel.append(head);
    const note=document.createElement('p');note.className='meta';note.textContent='Fecha detectada: '+(typeof v.date==='string'?v.date:'no visible')+' · Fecha de registro seleccionada: '+chosenDate+'. Si no coincide, elegí la fecha correcta antes de aplicar los valores o volvé a escanear con la fecha correcta.';panel.append(note);
    const table=document.createElement('table');let vals={};
    for(const [source,k] of Object.entries(mapping)){
      const field=fields.find(f=>f[0]===k);if(!field)continue;const [,label,unit,step,min,max]=field;const value=v[source];const good=valid(value)&&value>=min&&value<=max;
      if(good)vals[k]=+(Math.round(value/step)*step).toFixed(2);
      const row=table.insertRow();row.insertCell().textContent=label;row.insertCell().textContent=good?`${fmt(vals[k],step===1?0:1)} ${unit}`:value===null||value===undefined?'No leído':'Revisar manualmente';
    }
    panel.append(table);const notes=document.createElement('p');notes.className='tiny';notes.textContent=(typeof v.notes==='string'?v.notes:'')+' No se guardó ninguna medición todavía.';panel.append(notes);
    const useDate=document.createElement('input');useDate.type='checkbox';useDate.style.width='auto'; const detected=typeof v.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.date)&&!Number.isNaN(Date.parse(v.date))&&new Date(v.date).toISOString().slice(0,10)===v.date?v.date:null; if(detected&&detected!==chosenDate){const label=document.createElement('label');label.append(useDate,document.createTextNode(' Usar la fecha detectada: '+detected));panel.append(label);} const apply=document.createElement('button');apply.type='button';apply.textContent='Completar campos detectados';apply.disabled=!Object.keys(vals).length;
    pending={vals,file,chosenDate};apply.onclick=()=>{if(!pending||$('report').files[0]!==pending.file||$('measureDay').value!==pending.chosenDate)return;if(useDate.checked&&detected){$('measureDay').value=detected;const existing=data.body[detected]||{};for(const [k] of fields)$('b_'+k).value=existing[k]??'';}for(const [k,value] of Object.entries(pending.vals))$('b_'+k).value=value;status('aiScanStatus','Campos completados. Revisá y corregí los valores y la fecha; después pulsá Guardar medición.');resetReview();};panel.append(apply);panel.hidden=false;status('aiScanStatus','Extracción lista para revisar. '+r.remaining+' escaneos disponibles hoy (UTC).');
  }
  $('aiScan').onclick=()=>{
    const file=$('report').files[0],chosenDate=$('measureDay').value;
    if(!file){status('aiScanStatus','Primero seleccioná una captura del informe Xiaomi.');return;}
    if(!confirm('La captura seleccionada se enviará a OpenAI. Verificá que no muestre nombres ni otros identificadores. ¿Continuar?'))return;
    resetReview();task('aiScanStatus','Leyendo el informe Xiaomi…',async()=>{getToken();const image=await imageForAI(file);if($('report').files[0]!==file||$('measureDay').value!==chosenDate)throw Error('Cambió la captura o fecha. No se envió la imagen.');const r=await call('scan',{image,data:{report:'Xiaomi S400',expected_units:'kg, %, kcal, nivel',request:'La fecha debe ser YYYY-MM-DD si es legible. No inferir ningún dato que no esté visible.'}});showReview(r,file,chosenDate);});
  };
  $('bodyForm').addEventListener('submit',()=>{resetReview();status('aiScanStatus','');});
})();
