// V11.1b live synthetic-key smoke. NEVER use real passwords or personal identities.
// Requires operator STAGING_API_TOKEN in environment. Does not print secrets.
import {randomBytes} from 'node:crypto';
const operator=process.env.STAGING_API_TOKEN;
if(!operator||!/^[A-Za-z0-9_-]{43,128}$/.test(operator)){console.error('Falta STAGING_API_TOKEN en variable de entorno.');process.exit(2);}
const root='https://asia-v11-api-staging.cabrerafelipe2003.workers.dev';
const username='test_smoke_'+randomBytes(5).toString('hex');
let passed=0;
async function request(path,method='GET',{body,session,auth=true}={}){
 const headers={...(auth?{Authorization:'Bearer '+operator}:{}),...(session?{'X-Asia-Session':session}:{}),...(body?{'Content-Type':'application/json'}:{})};
 const res=await fetch(root+path,{method,headers,...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(45000)});
 let j;try{j=await res.json()}catch{throw Error('Respuesta no JSON, HTTP '+res.status);}
 return {code:res.status,json:j};
}
function expect(x,status,label){if(x.code!==status||x.json.ok!==(status>=200&&status<300))throw Error(label+': HTTP '+x.code+' '+JSON.stringify({...x.json,test_key:undefined,session:undefined}));passed++;console.log('OK '+label+' (HTTP '+status+')');}
try{
 expect(await request('/v11/status'),200,'Worker API y D1');
 expect(await request('/v11/auth/session','GET',{auth:false}),401,'ruta protegida');
 const register=await request('/v11/auth/register','POST',{body:{username}});expect(register,201,'alta de cuenta ficticia');
 const key=register.json.test_key;
 if(typeof key!=='string'||!/^aslab_[A-Za-z0-9_-]{43}$/.test(key))throw Error('No llegó clave sintética de 256 bits');
 expect(await request('/v11/auth/login','POST',{body:{username,test_key:'aslab_'+randomBytes(32).toString('base64url')}}),401,'clave sintética incorrecta');
 const login=await request('/v11/auth/login','POST',{body:{username,test_key:key}});expect(login,200,'login con clave sintética');
 if(typeof login.json.session!=='string'||!login.json.session.startsWith('asstg_'))throw Error('Sesión inválida');
 expect(await request('/v11/auth/session','GET',{session:login.json.session}),200,'validación de sesión');
 expect(await request('/v11/auth/logout','POST',{session:login.json.session}),200,'cierre de sesión');
 expect(await request('/v11/auth/session','GET',{session:login.json.session}),401,'revocación confirmada');
 console.log(`VALIDADO: ${passed} pruebas de V11.1b en staging. Sin contraseñas humanas ni datos personales.`);
}catch(e){console.error('NO VALIDADO:',e.message);process.exitCode=1;}
