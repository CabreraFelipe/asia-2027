#!/usr/bin/env node
// Windows-safe installer. Strict staging target; requires offline preflight & D1 backup.
import {existsSync,mkdirSync,statSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline/promises';
import {randomBytes} from 'node:crypto';
const base=dirname(fileURLToPath(import.meta.url));
const root=join(base,'V11.24-STAGING');
const inStage=p=>join(root,p);
const diag=process.argv.includes('--diagnostico');
const offline=process.argv.includes('--solo-preflight');
let deploymentStarted=false;
const fail=m=>{console.error('\nERROR: '+m);if(deploymentStarted)console.error('EL DEPLOY PUDO INICIARSE: NO REPETIR A CIEGAS. Verifica el estado remoto.');process.exitCode=1;};
async function run(command,args,label){
 console.log('\n>>> '+label);
 const name=command==='node'?process.execPath:command;
 return new Promise(resolve=>{
  const child=spawn(name,args,{cwd:root,stdio:'inherit',windowsHide:false,shell:command==='npx.cmd',env:{...process.env,NODE_NO_WARNINGS:'1'}});
  let done=false;const finish=ok=>{if(!done){done=true;resolve(ok);}};
  child.once('error',e=>{console.error('No se pudo ejecutar '+command+': '+e.message);finish(false);});
  child.once('close',(code,signal)=>finish(code===0&&!signal));
 });
}
async function main(){
 console.log('==============================================');
 console.log('ASIA 2027 - V11.24 - INSTALADOR WINDOWS SEGURO');
 console.log('==============================================');
 console.log('Origen obligatorio: V11.21 STAGING. Destino: V11.24 STAGING.');
 console.log('Produccion V10.6: no se modifica; D1: asia-v11-db-staging.');
 console.log('SOLO DATOS FICTICIOS. No usar datos de salud ni respaldo personal.');
 const nodeMajor=Number(process.versions.node.split('.')[0]);
 if(!Number.isFinite(nodeMajor)||nodeMajor<22){fail('Node.js 22 o superior requerido. Actual: '+process.version);return;}
 for(const f of ['scripts/preflight1124.mjs','scripts/precheck1124.mjs','scripts/smoke1124.mjs','wrangler.preview.toml']){
  if(!existsSync(inStage(f))){fail('Falta '+f+'. Extrae el ZIP entero a una carpeta nueva.');return;}
 }
 if(diag){console.log('DIAGNOSTICO OK: Node '+process.version+' y estructura reconocida.');return;}
 if(process.platform!=='win32'&&!offline){fail('Instalacion solo Windows. Modo --solo-preflight funciona en Linux/macOS.');return;}
 if(!await run('node',[join(base,'PREFLIGHT_PORTABLE_V11_24.mjs')],'Preflight aislado: hashes, pruebas y regresiones')){fail('Preflight fallido. Nada enviado a Cloudflare.');return;}
 if(offline){console.log('PREFLIGHT LOCAL OK. Nada enviado a Cloudflare.');return;}
 if(!await run('node',[inStage('scripts/precheck1124.mjs')],'Confirmar V11.21 REAL en staging antes de actualizar')){fail('No se confirmo origen V11.21. No hubo deploy.');return;}
 const rl=createInterface({input:process.stdin,output:process.stdout});let answer='';
 try{answer=(await rl.question('\nRespaldar D1 y desplegar SOLO STAGING? Escribi S para continuar (N cancela): ')).trim().toUpperCase();}
 finally{rl.close();}
 if(answer!=='S'){console.log('Instalacion cancelada. Ningun cambio remoto.');return;}
 const backDir=join(base,'BACKUP_STAGING');mkdirSync(backDir,{recursive:true});
 const backupName='asia-v11-db-staging-pre124-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomBytes(4).toString('hex')+'.sql';
 const backFile=join(backDir,backupName);
 const args=['--yes','wrangler@4.165.0','d1','export','asia-v11-db-staging','--config','wrangler.preview.toml','--remote','--output','../BACKUP_STAGING/'+backupName];
 if(!await run('npx.cmd',args,'Respaldo remoto de D1 de pruebas, obligatorio')){fail('Error exportando respaldo. NO hubo deploy.');return;}
 if(!existsSync(backFile)||statSync(backFile).size===0){fail('El archivo del respaldo no existe o esta vacio. NO hubo deploy.');return;}
 console.log('D1 respaldo comprobado: '+backupName+' ('+statSync(backFile).size+' bytes)');
 if(!await run('node',[join(base,'PREFLIGHT_PORTABLE_V11_24.mjs'),'--solo-integridad'],'Segunda comprobacion SHA-256 antes del deploy')){fail('Archivos alterados: no hubo deploy.');return;}
 deploymentStarted=true;
 if(!await run('npx.cmd',['--yes','wrangler@4.165.0','deploy','--config','wrangler.preview.toml'],'Publicar solo Worker staging')){fail('Deploy fallido o incierto; revisar estado antes de repetir.');return;}
 if(!await run('node',[inStage('scripts/smoke1124.mjs')],'Smoke remoto GET V11.24 + rutas anteriores')){fail('Smoke fallido. No repetir sin comprobar.');return;}
 console.log('\nV11.24 INSTALADA EN STAGING.');
 console.log('URL: https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev/v11.24/');
 console.log('Produccion V10.6: intacta.');
}
try{await main();}catch(e){fail(e?.stack||String(e));}
