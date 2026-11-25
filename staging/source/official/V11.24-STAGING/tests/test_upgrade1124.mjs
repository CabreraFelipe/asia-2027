// Offline precheck mock, no network, plus explicit Windows ESM URL regression.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const script=join(root,'scripts/precheck1124.mjs');
const scriptURL=pathToFileURL(script).href;
let n=0;
assert.equal(new URL(scriptURL).protocol,'file:');n++;
assert.equal(fileURLToPath(scriptURL),script);n++;
const fakeWindows='file:///C:/Users/Feliy/OneDrive/Asia%202027/scripts/precheck1124.mjs';
assert.match(fakeWindows,/^file:\/\/\/[A-Za-z]:\//);n++;
if(process.platform==='win32'){assert.match(scriptURL,/^file:\/\/\/[A-Za-z]:\//);n++;}
const cases=[
 ['11.21','true','true','false',true],
 ['11.21','false','true','false',false],
 ['11.21','true','false','false',false],
 ['11.21','true','true','true',false],
 ['11.17','true','true','false',false],
 ['11.18','true','true','false',false],
 ['11.24','true','true','false',false],
 ['10.6','true','true','false',false],
];
for(const [version,configured,routeOK,production,expected] of cases){
 const source=`globalThis.fetch=async url=>{const path=new URL(url).pathname;
 if(path==='/v11.11/status')return new Response(JSON.stringify({ok:true,version:process.env.TEST_VERSION,configured:process.env.TEST_CONFIGURED==='true',production:process.env.TEST_PRODUCTION==='true',health:false,publicRegistration:false}),{status:200});
 if(path==='/v11.21/'&&process.env.TEST_ROUTE==='true')return new Response('V11.21 · STAGING',{status:200});
 return new Response('Not found',{status:404});}; await import(${JSON.stringify(scriptURL)});`;
 const p=spawnSync(process.execPath,['--input-type=module','-e',source],{encoding:'utf8',timeout:16000,env:{...process.env,TEST_VERSION:version,TEST_CONFIGURED:configured,TEST_ROUTE:routeOK,TEST_PRODUCTION:production}});
 assert.equal(p.status===0,expected,'Unexpected precheck result '+version+' '+configured+' '+routeOK+' '+production+' output='+(p.stdout||'')+(p.stderr||''));n++;
}
const bat=readFileSync(resolve(root,'../INSTALAR_V11_24.cmd'));
assert.ok(bat.includes(Buffer.from('\r\n')),'CMD needs Windows CRLF');n++;
const text=bat.toString();assert.ok(text.includes('INSTALADOR_SEGURO_V11_24.mjs')&&text.includes('pause'),'CMD must keep window open');n++;
assert.ok(!text.includes('echo ERROR: Falta Node.js ('),'No CMD block unsafe parens');n++;
console.log('V11.24 upgrade: '+n+' pruebas de origen 11.21, URLs Windows y lanzador CMD.');
