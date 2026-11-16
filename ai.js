(() => {
  'use strict';
  const endpoint = 'https://asia-2027-ai.cabrerafelipe2003.workers.dev/api';
  const tokenKey = 'asia-ai-access-v1';
  let token = '', busy = false, chat = [], pending = null;
  try { token = localStorage.getItem(tokenKey) || ''; } catch {}
  $('aiRemember').checked = Boolean(token);
  const status = (id, text) => { $(id).textContent = text; };
  status('aiConnection', token ? 'Clave guardada en este dispositivo. Podés probar la conexión.' : 'IA sin configurar.');
  const buttons = ['aiScan','aiDiet','aiWeekly','aiTraining','aiAsk','aiConnect','aiDisconnect','aiClearChat'];
  function setBusy(v) { busy = v; buttons.forEach(id => $(id).disabled = v); }
  function getToken() {
    if (!/^[a-fA-F0-9]{64}$/.test(token)) {
      $('aiSettings').scrollIntoView({behavior:'smooth'});
      throw Error('Primero configurá tu clave APP_ACCESS_TOKEN en Conexión con IA.');
    }
    return token;
  }
  async function call(kind, payload) {
    const access = getToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000);
    try {
      const response = await fetch(endpoint, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+access},
        body:JSON.stringify({kind,...payload}), signal:controller.signal, cache:'no-store'
      });
      let body; try { body = await response.json(); } catch { throw Error('Respuesta no válida del servidor.'); }
      if (!response.ok || body.ok !== true) {
        const code = body.upstream_status ? ' (OpenAI HTTP '+body.upstream_status+')' : ' (HTTP '+response.status+')';
        throw Error((body.error || 'No se pudo completar la consulta')+code);
      }
      return body;
    } catch(e) { if(e.name === 'AbortError') throw Error('La solicitud demoró demasiado. Probá nuevamente.'); throw e; }
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
    const candidate = $('aiToken').value.trim() || token;
    if(!/^[a-fA-F0-9]{64}$/.test(candidate)) throw Error('La clave debe contener 64 caracteres hexadecimales.');
    const old = token; token = candidate;
    try {
      const r = await call('chat',{data:{question:'Respondé solamente: Conexión correcta. Prueba sin datos personales.'}});
      try { if ($('aiRemember').checked) localStorage.setItem(tokenKey, token); else localStorage.removeItem(tokenKey); }
      catch { status('aiConnection','Conexión correcta. No se pudo guardar la clave; se usará durante esta sesión.'); $('aiToken').value=''; return; }
      $('aiToken').value=''; status('aiConnection','Conexión correcta. '+r.model+' · '+r.remaining+' consultas de chat disponibles hoy.');
    } catch(e) { token = old; throw e; }
  });
  $('aiDisconnect').onclick=()=>{ token=''; $('aiToken').value=''; $('aiRemember').checked=false; try{localStorage.removeItem(tokenKey)}catch{}; status('aiConnection','Clave olvidada en este dispositivo.'); };
  // Solo se transfieren datos numéricos/estados de registros recientes; no fotos guardadas ni notas libres.
  const ordered = (obj, n) => Object.entries(obj||{}).sort(([a],[b])=>a.localeCompare(b)).slice(-n);
  function bodySummary(n=42) { return ordered(data.body,n).map(([d,b])=>({date:d,...Object.fromEntries(fields.map(([k])=>[k,b[k]]).filter(([,v])=>valid(v)))})); }
  function dietSummary(n=42) { return ordered(data.diet,n).map(([d,b])=>({date:d,adherence:['yes','partial','no','vac'].includes(b.ad)?b.ad:null,steps:b.steps!==''&&Number.isFinite(+b.steps)?+b.steps:null,energy:b.energy!==''&&Number.isFinite(+b.energy)?+b.energy:null})); }
  function workSummary(n=16) { return ordered(data.work,n).map(([k,w])=>({date:k.slice(0,10),routine:routines[+k.split('_')[1]]?.name,cardio_minutes:Number(w.cardioMin)||0,cardio_speed:Number(w.cardioSpeed)||null,cardio_incline:Number(w.cardioIncline)||0,cardio_rpe:Number(w.cardioRPE)||null,exercises:Object.fromEntries(Object.entries(w.ex||{}).map(([name,sets])=>[name,sets.filter(s=>s.done&&valid(s.kg)&&valid(s.reps)).map(s=>[s.kg,s.reps])]).filter(([,sets])=>sets.length))})); }
  function summary(includeWork=true){
    let p={today:date(),baseline_kg:data.settings?.baseline??null,height_m:data.settings?.height??null,body:bodySummary(),diet:dietSummary(),diet_codes:{yes:'cumplido',partial:'parcial',no:'no cumplido',vac:'vacaciones'},exercise_sets_format:'[kg externos, repeticiones]; unilateral por pierna; 0 kg puede ser peso corporal',workouts:includeWork?workSummary():[]};
    while(JSON.stringify(p).length>20500&&p.workouts.length>1)p.workouts.shift();
    while(JSON.stringify(p).length>20500&&p.body.length>1)p.body.shift();
    return p;
  }
  function sendAnalysis(kind,id,selected=false){
    if(!confirm('Se enviará a OpenAI un resumen de tus registros recientes, sin fotos ni notas libres. ¿Continuar?'))return;
    task(id,'Analizando los registros…',async()=>{
      if(kind==='training'&&!Object.keys(data.work||{}).length)throw Error('Guardá al menos una sesión antes de analizar.');
      if(kind!=='training'&&!Object.keys(data.body||{}).length&&!Object.keys(data.diet||{}).length&&!Object.keys(data.work||{}).length)throw Error('Guardá registros antes de pedir un análisis.');
      const p=summary(); if(selected)p.selected_exercise=$('exercisePick').value;
      const r=await call(kind,{data:p}); status(id,String(r.result)+suffix(r));
    });
  }
  $('aiDiet').onclick=()=>sendAnalysis('diet','aiDietResult');
  $('aiWeekly').onclick=()=>sendAnalysis('weekly','aiDietResult');
  $('aiTraining').onclick=()=>sendAnalysis('training','aiTrainingResult',true);
  function renderChat(){const el=$('aiChatResult');el.replaceChildren();for(const item of chat){const a=document.createElement('article');a.className=item.role;const b=document.createElement('strong');b.textContent=item.role==='user'?'Vos':'Entrenador IA';const p=document.createElement('p');p.textContent=item.text;a.append(b,p);el.append(a);}}
  $('aiClearChat').onclick=()=>{chat=[];renderChat();};
  $('aiAsk').onclick=()=>{
    const question=$('aiQuestion').value.trim(); if(!question)return;
    if(!confirm('Se enviará tu consulta, el resumen de registros y las últimas respuestas a OpenAI. ¿Continuar?'))return;
    task('aiChatResult','Consultando al entrenador…',async()=>{
      const p=summary(); p.question=question;p.conversation=chat.slice(-6).map(x=>({role:x.role,text:x.text.slice(0,850)}));
      const r=await call('chat',{data:p});chat.push({role:'user',text:question},{role:'assistant',text:String(r.result)+suffix(r)});chat=chat.slice(-12);$('aiQuestion').value='';renderChat();
    });
  };
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
    resetReview();task('aiScanStatus','Leyendo el informe Xiaomi…',async()=>{getToken();const image=await imageForAI(file);const r=await call('scan',{image,data:{report:'Xiaomi S400',expected_units:'kg, %, kcal, nivel',request:'La fecha debe ser YYYY-MM-DD si es legible. No inferir ningún dato que no esté visible.'}});showReview(r,file,chosenDate);});
  };
  $('bodyForm').addEventListener('submit',()=>{resetReview();status('aiScanStatus','');});
})();
