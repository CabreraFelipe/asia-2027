// Simulates the deployment smoke against the real API module and SQLite; NO network.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import api from '../api-staging.mjs';
const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON;');
for(const name of ['0001_staging.sql','0002_auth_staging.sql','0003_auth_test_keys.sql'])sql.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
const db={prepare(q){let args=[];return {q,get args(){return args;},bind(...values){args=values;return this;},async first(){return sql.prepare(q).get(...args)||null;},async all(){return {results:sql.prepare(q).all(...args)};},async run(){return {meta:{changes:Number(sql.prepare(q).run(...args).changes)}};}};},async batch(xs){sql.exec('BEGIN IMMEDIATE');try{const results=xs.map(x=>sql.prepare(x.q).run(...x.args));sql.exec('COMMIT');return results.map(x=>({meta:{changes:Number(x.changes)}}));}catch(e){sql.exec('ROLLBACK');throw e;}}};
const token='o'.repeat(43);
const env={STAGING_API_TOKEN:token,STAGING_MODE:'asia-v11-staging-110',STAGING_DB:db,AUTH_PEPPER_V111:randomBytes(32).toString('base64url')};
process.env.STAGING_API_TOKEN=token;
globalThis.fetch=async(url,options)=>api.fetch(new Request(url,options),env);
await import('../scripts/smoke112.mjs');
if(process.exitCode)throw Error('El simulacro de staging falló');
console.log('Smoke de V11.2: todos los pasos del script real superados sin red.');
