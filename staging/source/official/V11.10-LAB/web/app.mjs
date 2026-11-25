// V11.10: no access credentials in JS, localStorage or IndexedDB. Cookie is HttpOnly.
const app=document.querySelector('#app');
const text=(parent,tag,value,cls='')=>{const n=document.createElement(tag);n.textContent=value;if(cls)n.className=cls;parent.append(n);return n;};
let account=null,csrf=null;
const request=async(path,options)=>{const r=await fetch(path,{cache:'no-store',credentials:'same-origin',...options});const data=await r.json().catch(()=>({ok:false}));if(!r.ok)throw Error(`HTTP ${r.status}`);return data;};
const protectedPost=async(path,value)=>request(path,{method:'POST',headers:{'Content-Type':'application/json','X-Asia-CSRF':csrf},body:JSON.stringify(value)});
const card=()=>{const c=document.createElement('section');c.className='card stack';return c;};
const btn=(label,cb,cls='btn primary')=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.addEventListener('click',cb);return b;};
const message=(value,bad=false)=>{const prev=document.querySelector('#status1110');prev?.remove();const n=text(app,'div',value,'status'+(bad?' error':''));n.id='status1110';app.prepend(n);};
async function refresh(){app.replaceChildren();account=null;csrf=null;
 try{const me=await request('/auth/me');account=me.account;csrf=me.csrf;}catch{}
 if(!account){
  const hero=document.createElement('section');hero.className='hero';const h=document.createElement('div');text(h,'div','Etapa 11.10 · Identidad de usuarios','eyebrow');text(h,'h1','Entrar sin recordar contraseñas');text(h,'p','En esta versión probamos una identidad delegada: el servidor valida un token firmado y crea una sesión. Las passkeys reales dependerán del proveedor definitivo.','muted');hero.append(h);text(hero,'span','Demo local · OIDC simulado','pill');app.append(hero);
  const grid=document.createElement('div');grid.className='grid two';const a=card();text(a,'h2','Acceso de prueba sin contraseña');text(a,'p','Vas a elegir Persona A o Persona B en un proveedor ficticio. No se solicita ninguna contraseña ni frase de 16 caracteres.','note');a.append(btn('Continuar con proveedor ficticio',()=>location.assign('/auth/start')));grid.append(a);
  const b=card();text(b,'h2','¿Qué protege este laboratorio?');for(const line of ['PKCE S256, state y nonce de un solo uso','Validación de firma RS256, emisor y audiencia','Cookie de sesión HttpOnly y cierre revocable','Aislamiento de los datos ficticios por identidad verificada'])text(b,'p','✓ '+line,'note');grid.append(b);app.append(grid);
  const c=card();c.style.marginTop='18px';text(c,'h2','Sobre tu Asia 2027');text(c,'p','La interfaz y los datos personales V10.6 permanecen intactos. La frase de 16 caracteres de los laboratorios V11.7–V11.9 servía únicamente para cifrar bóvedas locales; no es una política de contraseñas para usuarios reales.','note');app.append(c);return;
 }
 const hero=document.createElement('section');hero.className='hero';const h=document.createElement('div');text(h,'div','Identidad firmada y verificada · Demo','eyebrow');text(h,'h1','Sesión de '+account.label);text(h,'p','El servidor derivó tu cuenta de un token verificado. Cambiá de identidad desde otro perfil de navegador para comprobar el aislamiento.','muted');hero.append(h);text(hero,'span','Sesión de servidor','pill');app.append(hero);
 const grid=document.createElement('div');grid.className='grid two';const a=card();text(a,'h2','Cuenta de laboratorio');text(a,'p',account.label,'accent');text(a,'p',`Identificador: ${account.id}`,'note');
 const actions=document.createElement('div');actions.className='actions';actions.append(btn('Cerrar sesión',async()=>{try{await protectedPost('/auth/logout',{});await refresh();}catch{message('No se pudo cerrar sesión.',true);}},'btn ghost'));actions.append(btn('Cerrar todas mis sesiones',async()=>{try{await protectedPost('/auth/logout-all',{});await refresh();}catch{message('No se pudieron revocar las sesiones.',true);}},'btn danger'));a.append(actions);grid.append(a);
 const b=card();text(b,'h2','Dato ficticio aislado por cuenta');text(b,'p','Podés guardar una nota breve. Vive solo en memoria del servidor local; al detenerlo desaparece.','note');
 const field=document.createElement('div');field.className='field';const lbl=text(field,'label','Nota de prueba (sin datos reales)');lbl.htmlFor='note1110';const input=document.createElement('input');input.id='note1110';input.maxLength=160;input.placeholder='Ej.: prueba de cuenta A';field.append(input);b.append(field);
 const result=text(b,'p','Cargando nota…','note');
 const load=async()=>{try{const data=await request('/auth/data');result.textContent=data.note?'Nota guardada: '+data.note:'No hay ninguna nota en esta cuenta.';}catch{result.textContent='No se pudo recuperar la nota.';}};
 b.append(btn('Guardar nota de prueba',async()=>{try{await protectedPost('/auth/note',{note:input.value});await load();message('Nota guardada exclusivamente en esta identidad.');}catch{message('Error al guardar la nota de prueba.',true);}}));grid.append(b);app.append(grid);await load();
}
refresh().catch(()=>{app.replaceChildren();text(app,'div','No se pudo iniciar la interfaz local.','status error');});
