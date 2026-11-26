import assert from 'node:assert/strict';
import {generateAccountSecret,importWrappingKey,wrapAccountSecret,unwrapAccountSecret} from '../src/account-key1150.mjs';
import {encrypt84,decrypt84} from '../../../../model84.mjs';
const A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32),kekId='test-v1';
const secret=generateAccountSecret(),b=generateAccountSecret(),key=await importWrappingKey(generateAccountSecret()),wrong=await importWrappingKey(generateAccountSecret());
assert.notEqual(secret,b);assert.equal(key.extractable,false);
const options={accountId:A,kekId,key,secret};
const envelope=await wrapAccountSecret(options),second=await wrapAccountSecret(options);
assert.notEqual(envelope.iv,second.iv);assert.notEqual(envelope.cipher,second.cipher);assert.ok(!JSON.stringify(envelope).includes(secret));
const restored=await unwrapAccountSecret({...options,envelope});assert.equal(restored,secret);
const payload={body:{'2026-11-26':{weight:80}},settings:{goals101:{version:2,primary:'',items:[]}}};
const encrypted=await encrypt84(payload,secret);
assert.deepEqual(await decrypt84(encrypted,restored),payload);await assert.rejects(decrypt84(encrypted,b));
await assert.rejects(unwrapAccountSecret({...options,accountId:B,envelope}));
await assert.rejects(unwrapAccountSecret({...options,key:wrong,envelope}));
await assert.rejects(unwrapAccountSecret({...options,kekId:'test-v2',envelope}));
await assert.rejects(unwrapAccountSecret({...options,kekId:'test-v2',envelope:{...envelope,kekId:'test-v2'}}));
await assert.rejects(unwrapAccountSecret({...options,envelope:{...envelope,cipher:(envelope.cipher[0]==='A'?'B':'A')+envelope.cipher.slice(1)}}));
await assert.rejects(unwrapAccountSecret({...options,envelope:{...envelope,extra:'invalid'}}));
await assert.rejects(importWrappingKey('not-a-key'));await assert.rejects(wrapAccountSecret({...options,secret:'short'}));
// Re-wrap under a new server key without re-encrypting the user's payload.
const rotated=await importWrappingKey(generateAccountSecret()),nextId='test-v2',next=await wrapAccountSecret({accountId:A,kekId:nextId,key:rotated,secret:restored});
assert.deepEqual(await decrypt84(encrypted,await unwrapAccountSecret({accountId:A,kekId:nextId,key:rotated,envelope:next})),payload);
// A legacy phrase does not become the new account key automatically.
const legacyPhrase='frase sintética anterior',legacy=await encrypt84(payload,legacyPhrase);
await assert.rejects(decrypt84(legacy,restored));assert.deepEqual(await decrypt84(legacy,legacyPhrase),payload);
console.log('Managed-key foundation: isolation, tamper rejection, KEK rotation, legacy compatibility boundaries and encrypted round trip PASS.');
