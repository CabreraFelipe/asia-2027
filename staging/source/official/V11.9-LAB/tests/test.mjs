import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import api from '../api-staging.mjs';
import rest,{StagingProbe110} from '../rest-staging.mjs';
import {repository,resolveAccount} from '../design/repository-draft.mjs';
const marker='asia-v11-staging-110', key='a'.repeat(43), other='b'.repeat(43);
let count=0;
function eq(a,b){assert.deepEqual(a,b);count++;}
async function reject(fn){await assert.rejects(fn);count++;}
const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON;'+readFileSync(new URL('../migrations/0001_staging.sql',import.meta.url),'utf8'));
function d1(db){return {prepare(q){let args=[];return {bind(...a){args=a;return this;},async all(){return {results:db.prepare(q).all(...args)};},async first(){return db.prepare(q).get(...args)||null;},async run(){return {meta:{changes:Number(db.prepare(q).run(...args).changes)}};}};}};}
const DB=d1(sql),env={STAGING_MODE:marker,STAGING_API_TOKEN:key,STAGING_DB:DB};
const make=(path='/v11/status',method='GET',token=key,headers={},body)=>new Request('https://staging.invalid'+path,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...headers},...(body===undefined?{}:{body})});
async function status(worker,request,e,code){const r=await worker.fetch(request,e);eq(r.status,code);eq(r.headers.get('Cache-Control'),'no-store');eq(r.headers.get('Access-Control-Allow-Origin'),null);return r.json();}
eq((await status(api,make(),env,200)).database,'verified');
await status(api,make(),{},503);await status(api,make(),{...env,STAGING_MODE:'prod'},503);await status(api,make(),{...env,STAGING_API_TOKEN:'weak'},503);
await status(api,make('/v11/status','GET',null),env,401);await status(api,make('/v11/status','GET',other),env,401);
await status(api,make('/v11/status','GET',key,{Origin:'https://cabrerafelipe.github.io'}),env,403);
await status(api,make('/v11/status?token=x'),env,400);await status(api,make('/v11/status','POST',key,{},'{}'),env,400);await status(api,make('/v11/status','POST'),env,405);
for(const route of ['/','/api','/coach','/nutrition','/health','/workouts','/backup','/backup844','/vision84','/v11/accounts','/v11/snapshots'])await status(api,make(route),env,404);
await status(api,make(),{...env,DB},503);await status(api,make(),{...env,STAGING_DB:undefined},503);
const bad=new DatabaseSync(':memory:');await status(api,make(),{...env,STAGING_DB:d1(bad)},503);
sql.exec('CREATE TABLE health_daily(x)');await status(api,make(),env,503);sql.exec('DROP TABLE health_daily');
await status(api,make(),{...env,STAGING_DB:{prepare(){throw Error('private details')}}},503);
const a='acct_'+'a'.repeat(32),b='acct_'+'b'.repeat(32);const t='2026-11-20T00:00:00Z';
for(const [id,sub] of [[a,'synthetic-a'],[b,'synthetic-b']])sql.prepare('INSERT INTO accounts_v11 VALUES(?,?,?,?)').run(id,'https://fictional.invalid',sub,t);
eq(await resolveAccount(DB,{iss:'https://fictional.invalid',sub:'synthetic-a'}),a);await reject(()=>resolveAccount(DB,{iss:'https://fictional.invalid',sub:'unknown'}));
const A=repository(DB,a),B=repository(DB,b);eq(await A.append(0,'synthetic-a-only',t),1);eq(await B.read(1),null);eq((await B.list()).results.length,0);eq(await B.append(0,'synthetic-b-only',t),1);eq((await A.read(1)).envelope,'synthetic-a-only');eq((await B.read(1)).envelope,'synthetic-b-only');await reject(()=>A.append(0,'conflict',t));eq(await A.append(1,'second',t),2);eq(await B.read(2),null);
assert.throws(()=>sql.prepare('INSERT INTO encrypted_snapshots_v11 VALUES(?,?,?,?)').run('acct_'+'c'.repeat(32),1,'x',t));count++;
const device=sql.prepare('INSERT INTO push_devices_v11 VALUES(?,?,?,?,?)');device.run(a,'dev1','https://fictional.invalid/push','{}',t);assert.throws(()=>device.run(b,'dev2','https://fictional.invalid/push','{}',t));count++;assert.throws(()=>sql.prepare('INSERT INTO reminder_queue_v11 VALUES(?,?,?,?,?)').run(b,'dev1','r','weight',1));count++;
let writes=0,lookups=0;const map=new Map(),doEnv={STAGING_MODE:marker};const ctx={storage:{async get(k){return map.get(k);},async put(k,v){writes++;map.set(k,v);}},async blockConcurrencyWhile(fn){return fn();}};
const object=new StagingProbe110(ctx,doEnv);const ns={idFromName(n){eq(n,'asia-v11-staging-probe-110');lookups++;return n;},get(){return {fetch:(url,opts)=>object.fetch(new Request(url,opts))};}};
const e={STAGING_MODE:marker,STAGING_REST_TOKEN:other,STAGING_REST:ns};
await status(rest,make('/v11/probe','POST',key),e,401);eq(lookups,0);
await status(rest,make('/rest','POST',other),e,404);await status(rest,make('/reminders845','POST',other),e,404);await status(rest,make('/v11/probe','GET',other),e,405);
await status(rest,make('/v11/probe','POST',other),{...e,REST:ns},503);eq(lookups,0);
eq((await status(rest,make('/v11/probe','POST',other),e,200)).durableObject,'verified');await status(rest,make('/v11/probe','POST',other),e,200);eq(writes,1);eq(map.size,1);
map.set('staging-marker-v110','wrong');await status(rest,make('/v11/probe','POST',other),e,503);eq(writes,1);
// Regression: Cloudflare may surface an empty POST as a non-null stream.
// Both the public worker and the internal Durable Object must accept it.
map.set('staging-marker-v110',marker);
const stream110 = (bytes=[]) => new ReadableStream({start(c){if(bytes.length)c.enqueue(Uint8Array.from(bytes));c.close();}});
const streamPost110 = (url,token,bytes=[]) => new Request(url,{method:'POST',
 headers:{Authorization:'Bearer '+token},body:stream110(bytes),duplex:'half'});
eq((await status(rest,streamPost110('https://staging.invalid/v11/probe',other),e,200)).durableObject,'verified');
await status(rest,streamPost110('https://staging.invalid/v11/probe',other,[1]),e,400);
eq((await status(object,streamPost110('https://internal/probe',other),doEnv,200)).durableObject,'verified');
await status(object,streamPost110('https://internal/probe',other,[1]),doEnv,404);
console.log(`${count} assertions passed (SQLite real, D1/DO simulated; no network).`);
