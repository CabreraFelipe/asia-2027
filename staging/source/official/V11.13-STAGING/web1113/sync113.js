// V11.13 - pure reconciliation helpers. Only synthetic append-only records.
// Never silently drop an entry, overwrite a revision, or merge a restore with concurrent changes.
const allowed = new Set(['meal','walk','rest','training']);
const isId = x => typeof x === 'string' && /^[0-9a-f]{32}$/.test(x);
export function validEntries(entries) {
  return Array.isArray(entries) && entries.length <= 20 &&
    entries.every(x => x && typeof x === 'object' && !Array.isArray(x) &&
      Object.keys(x).sort().join(',') === 'id,kind' && isId(x.id) && allowed.has(x.kind)) &&
    new Set(entries.map(x => x.id)).size === entries.length;
}
export function validSynthetic(payload, owner) {
  return typeof owner === 'string' && /^acct_[0-9a-f]{32}$/.test(owner) &&
    payload && typeof payload === 'object' && !Array.isArray(payload) &&
    Object.keys(payload).sort().join(',') === 'entries,format,owner' &&
    payload.format === 'asia-v1112-demo-v1' && payload.owner === owner && validEntries(payload.entries);
}
const same = (a,b) => a.id === b.id && a.kind === b.kind;
const containsAll = (wanted, entries) => wanted.every(x=>entries.some(y=>same(x,y)));
export function containsDraft(latest, proposed) {
  if (!proposed?.owner || !validSynthetic(latest,proposed.owner) || !validSynthetic(proposed,proposed.owner)) return false;
  return containsAll(proposed.entries,latest.entries);
}
export function mergeSynthetic(base, proposed, latest) {
  const owner = base?.owner;
  if(!validSynthetic(base,owner)||!validSynthetic(proposed,owner)||!validSynthetic(latest,owner))return {status:'INVALIDO'};
  if (!containsAll(base.entries,proposed.entries)||!containsAll(base.entries,latest.entries))return {status:'NO_FUSIONABLE'};
  const ids=new Map(latest.entries.map(e=>[e.id,e]));
  for(const entry of proposed.entries){if(ids.has(entry.id)&&!same(ids.get(entry.id),entry))return {status:'COLISION'};}
  const additional=proposed.entries.filter(x=>!ids.has(x.id));
  if(latest.entries.length+additional.length>20)return {status:'LIMITE'};
  const merged={...latest,entries:[...latest.entries,...additional]};
  return {status:additional.length?'LISTO':'YA_GUARDADO',payload:merged};
}
export function validateRevisionList(list) {
  return Array.isArray(list)&&list.length>=1&&list.length<=20&&list.every((x,i)=>
    x&&typeof x==='object'&&Object.keys(x).sort().join(',')==='envelope,revision'&&
    Number.isSafeInteger(x.revision)&&x.revision===i+1&&
    x.envelope&&typeof x.envelope==='object'&&!Array.isArray(x.envelope)&&
    Object.keys(x.envelope).sort().join(',')==='cipher,format,iv,salt'&&x.envelope.format==='asia84-encrypted-v1'
  );
}
