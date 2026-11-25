// Offline tests of V11.17/V11.18 -> V11.21 precheck (no network access).
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const script=join(root,'scripts/precheck1121.mjs');
// Node's ESM loader rejects bare Windows absolute paths (C:\...) as 'c:' URL schemes.
// Always import an RFC 8089 file URL, independent of OS or folder names.
const scriptURL=pathToFileURL(script).href;
let n=0;
assert.equal(new URL(scriptURL).protocol,'file:','Precheck must be imported through file:// rather than a Windows drive-letter path');n++;
assert.equal(fileURLToPath(scriptURL),script,'ESM file URL must round-trip even when the installation folder contains spaces');n++;
const cases=[
 ['11.17','true','true',true],
 ['11.18','true','true',true],
 ['11.16','true','true',false],
 ['11.21','true','true',false],
 ['11.17','false','true',false],
 ['11.18','true','false',false]
];
for(const [version,configured,routeOK,expected] of cases){
 const source=`
 globalThis.fetch=async url=>{
   const path=new URL(url).pathname;
   if(path==='/v11.11/status')return new Response(JSON.stringify({ok:true,version:process.env.TEST_VERSION,configured:process.env.TEST_CONFIGURED==='true',production:false,health:false,publicRegistration:false}),{status:200});
   if(path==='/v'+process.env.TEST_VERSION+'/'&&process.env.TEST_ROUTE==='true')return new Response('V'+process.env.TEST_VERSION+' · STAGING',{status:200});
   return new Response('Not found',{status:404});
 };
 await import(${JSON.stringify(scriptURL)});
 `;
 const r=spawnSync(process.execPath,['--input-type=module','-e',source],{encoding:'utf8',timeout:16000,env:{...process.env,TEST_VERSION:version,TEST_CONFIGURED:configured,TEST_ROUTE:routeOK}});
 assert.equal(r.status===0,expected,'Precheck '+version+' configured='+configured+' route='+routeOK+' output='+(r.stdout||'')+(r.stderr||''));n++;
}
// This assertion runs on every OS, so a broken Windows URL expectation cannot
// pass unnoticed in Linux CI. Windows file URLs require *three* slashes.
const syntheticWindowsURL = new URL('file:///C:/Users/Feliy/OneDrive/Asia%202027/scripts/precheck1121.mjs').href;
assert.match(syntheticWindowsURL,/^file:\/\/\/[A-Za-z]:\//,'Windows file URLs use file:///C:/ (three slashes)');n++;
if(process.platform==='win32'){
 assert.match(scriptURL,/^file:\/\/\/[A-Za-z]:\//,'Windows drive paths must have file:///C:/ format');n++;
}
const bat=readFileSync(resolve(root,'../INSTALAR_V11_21.cmd'));
assert.ok(bat.includes(Buffer.from('\r\n'))&&!bat.includes(Buffer.from('\n\n')),'Windows installer must use CRLF');n++;
assert.ok(bat.toString().includes('INSTALADOR_SEGURO_V11_21.mjs')&&bat.toString().includes('pause'),'Windows installer launches safe Node entry point and stays open');n++;
console.log('V11.21 upgrade: '+n+' pruebas de precheck 11.17/11.18, seguridad y lanzador Windows.');
