// Read-only LOCAL preflight, no network. Never pass your passphrase as an argument.
import {statSync,readFileSync} from 'node:fs';
import {stdin,stdout,argv} from 'node:process';
import readline from 'node:readline';
import {preflight113} from '../migration113.mjs';

async function hiddenPhrase(){
 if(!stdin.isTTY||typeof stdin.setRawMode!=='function')throw Error('REQUIRES_INTERACTIVE_TERMINAL');
 readline.emitKeypressEvents(stdin);
 stdout.write('Frase de cifrado (no se mostrará): ');
 stdin.setRawMode(true);stdin.resume();
 return await new Promise((resolve,reject)=>{
  let phrase='';
  function cleanup(){stdin.removeListener('keypress',key);stdin.setRawMode(false);stdin.pause();stdout.write('\n');}
  function key(s,k){
   if(k?.ctrl&&k.name==='c'){cleanup();reject(Error('CANCELLED'));return;}
   if(k?.name==='return'||k?.name==='enter'){cleanup();resolve(phrase);return;}
   if(k?.name==='backspace'){phrase=phrase.slice(0,-1);return;}
   if(s&&s.codePointAt(0)>=32&&s!=='\x7f'&&phrase.length<200)phrase+=s;
  }
  stdin.on('keypress',key);
 });
}
const path=argv[2];
if(!path||argv.length!==3){console.error('Uso: node scripts/preflight113.mjs "RUTA_AL_RESPALDO_CIFRADO.json"');process.exitCode=2;}
else {
 try{
  if(statSync(path).size>42_000_000)throw Error('FILE_TOO_LARGE');
  const envelope=JSON.parse(readFileSync(path,'utf8'));
  let password=await hiddenPhrase();
  try{
   const result=await preflight113(envelope,password);
   console.log('\nPREFLIGHT LOCAL V11.3 — VALIDADO');
   console.log('Archivo íntegro y compatible con respaldo integral V10.6.');
   console.log('Tamaño cifrado (bytes):',result.envelopeBytes);
   console.log('SHA-256 del sobre cifrado (JSON normalizado):',result.archiveSha256);
   console.log('Conteos por sección (sin contenido):',JSON.stringify(result.counters));
   console.log('Compatible con el límite del laboratorio:',result.withinCurrentStagingRequestLimit?'Sí (NO AUTORIZA subir datos reales)':'No');
   console.log('Sin importación ni modificación de datos.');
  }finally{password='';}
 }catch(e){
  // Never echo user content, internal field paths, secret/passphrase or file JSON.
  console.error('PREFLIGHT NO VALIDADO:',e.message==='CANCELLED'?'Cancelado':'Archivo/frase/formato no verificable. No se modificó nada.');process.exitCode=1;
 }
}
