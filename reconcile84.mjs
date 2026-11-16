import {validate84,empty84,library89Key} from './model84.mjs';
import {validateGym,seedGym} from './gym84.mjs';
import {clonePayload} from './store84.mjs';
import {historyKey810,memoryKey810} from './history810-schema.mjs';
// Conservative three-way reconciliation. All revisions must descend from a common
// snapshot explicitly supplied by the operator. Never resolve conflicting edits by timestamp.
const missing=Symbol('missing');
function canonical(v){if(v===missing)return 'missing';if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v)}
const same=(a,b)=>canonical(a)===canonical(b);
const clone=v=>v===missing?missing:structuredClone(v);
const areas=['foods','library','wellness','measurements','plans','threads','strategies','reminders','reviews'];
function checked(x){clonePayload(x.preferences);clonePayload(x.gym);validate84(x.preferences);validateGym(x.gym);if(x.gym.active)throw Error('Terminá la sesión activa antes de conciliar.');return x}
export function normalizePair84(pair){return checked({preferences:pair.preferences.revision?pair.preferences.payload:empty84(),gym:pair.gym.revision?pair.gym.payload:seedGym()})}
export function reconcile84(base,local,remote){for(const x of [base,local,remote])checked(x);const conflicts=[],changed={local:0,remote:0,both:0};
 function pick(b,l,r,path){if(same(l,r)){if(!same(l,b))changed.both++;return clone(l)}if(same(l,b)){changed.remote++;return clone(r)}if(same(r,b)){changed.local++;return clone(l)}conflicts.push(path);return clone(b)}
 function records(b,l,r,path,key=x=>x.id){const maps=[b,l,r].map(a=>{const m=new Map();for(const item of a){const k=key(item);if(m.has(k))throw Error('Identificador duplicado en '+path);m.set(k,item)}return m});const ids=new Set([...maps[0].keys(),...maps[1].keys(),...maps[2].keys()]);return [...ids].map(id=>pick(...maps.map(m=>m.has(id)?m.get(id):missing),path+'/'+id)).filter(x=>x!==missing)}
 const b=base.preferences,l=local.preferences,r=remote.preferences;const preferences={...structuredClone(b)};for(const a of areas)preferences[a]=records(b[a],l[a],r[a],'PRO/'+a);
 // Trash uses the record identity, not deletion time. Two divergent deletes/restores are reviewed.
 const trashKey=t=>t.area+':'+t.item.id;preferences.trash=records(b.trash,l.trash,r.trash,'Papelera',trashKey);
 // Audit is non-authoritative and may have identical timestamps; keep unique events within documented retention.
 preferences.audit=[...new Map([...b.audit,...l.audit,...r.audit].map(a=>[canonical(a),a])).values()].sort((a,b)=>a.at-b.at).slice(-200);
 for(const k of Object.keys(b.prefs))preferences.prefs[k]=pick(b.prefs[k],l.prefs[k],r.prefs[k],'Preferencias/'+k);
 // Imported snapshots are immutable apart from the archived flag; merge disjoint IDs.
 if([b,l,r].some(x=>Object.hasOwn(x,'legacyLibrary89'))){preferences.legacyLibrary89=records(b.legacyLibrary89||[],l.legacyLibrary89||[],r.legacyLibrary89||[],'Biblioteca V6');const keys=new Set();for(const e of preferences.legacyLibrary89){const key=library89Key(e);if(keys.has(key))conflicts.push('Biblioteca V6/fichas incompatibles/'+key);keys.add(key)}}
 for(const [k,key] of [['legacyHistory810',historyKey810],['reviewedMemory810',e=>e.id]])if([b,l,r].some(x=>Object.hasOwn(x,k)))preferences[k]=records(b[k]||[],l[k]||[],r[k]||[],'Histórico/'+k,key);
 // Preserve unknown extensions conservatively rather than dropping them.
 for(const k of new Set([...Object.keys(b),...Object.keys(l),...Object.keys(r)])){if(['schema','prefs','trash','audit','legacyLibrary89','legacyHistory810','reviewedMemory810',...areas].includes(k))continue;const v=pick(...[b,l,r].map(o=>Object.hasOwn(o,k)?o[k]:missing),'PRO/'+k);if(v===missing)delete preferences[k];else preferences[k]=v}
 for(const k of new Set([...Object.keys(b.prefs),...Object.keys(l.prefs),...Object.keys(r.prefs)])){if(Object.hasOwn(b.prefs,k))continue;const v=pick(missing,...[l,r].map(o=>Object.hasOwn(o.prefs,k)?o.prefs[k]:missing),'Preferencias/'+k);if(v!==missing)preferences.prefs[k]=v}
 const gym={...structuredClone(base.gym)};for(const a of ['library','routines','sessions','planned'])gym[a]=records(base.gym[a],local.gym[a],remote.gym[a],'Gym/'+a);
 for(const k of new Set([...Object.keys(base.gym),...Object.keys(local.gym),...Object.keys(remote.gym)])){if(['schema','active','rest','library','routines','sessions','planned'].includes(k))continue;const v=pick(...[base.gym,local.gym,remote.gym].map(o=>Object.hasOwn(o,k)?o[k]:missing),'Gym/'+k);if(v===missing)delete gym[k];else gym[k]=v}
 // Prevent semantic duplicates: one wellness record per day, imported legacy food IDs are deterministic,
 // and no record may appear both in active data and the trash.
 const semantic=(a,key,path)=>{const seen=new Set();for(const v of a){const k=key(v);if(seen.has(k))conflicts.push(path+'/'+k);seen.add(k)}};
 semantic(preferences.reviewedMemory810||[],memoryKey810,'Memoria/clasificación incompatible');
 semantic(preferences.wellness,x=>x.day,'Bienestar/fecha');semantic(preferences.measurements,x=>x.day+'-'+x.kind,'Medidas/fecha y tipo');
 for(const t of preferences.trash)if(preferences[t.area].some(x=>x.id===t.item.id))conflicts.push('Papelera y registro activo/'+trashKey(t));
 const originals=seedGym().routines.filter(x=>x.id.startsWith('original-'));for(const o of originals)if(!same(gym.routines.find(x=>x.id===o.id)??missing,o))conflicts.push('Gym/rutina original/'+o.id);
 for(const plan of gym.planned)if(!gym.routines.some(x=>x.id===plan.routineId))conflicts.push('Gym/plan sin rutina/'+plan.id);
 if(conflicts.length)return {ok:false,conflicts:[...new Set(conflicts)],changed};
 try{checked({preferences,gym})}catch(e){return {ok:false,conflicts:['Validación conjunta: '+e.message],changed}}
 return {ok:true,conflicts:[],changed,merged:{preferences,gym}};
}
