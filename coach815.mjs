// Read-only bridge from reviewed historical records to the original Coach.
import {openStore} from './store84.mjs';
import {validate84} from './model84.mjs';
const unsafe=text=>/data:image|\bBearer\s|\b[a-f0-9]{64}\b|\bsk-[A-Za-z0-9_-]{12,}/i.test(text);
const key=m=>JSON.stringify([m.category,m.text.trim().replace(/\s+/g,' ').normalize('NFC').toLocaleLowerCase('es')]);
export function approvedMemory815(state,current=[]){
  if(!state||typeof state!=='object'||Array.isArray(state))throw Error('Histórico inválido');
  if(Object.keys(state).length===0)return {notes:[],duplicates:0,blocked:0};
  validate84(state);
  const original=new Set(current.map(key)), grouped=new Map();let duplicates=0,blocked=0;
  for(const m of state.reviewedMemory810||[]){
    if(m.status!=='approved')continue;
    if(unsafe(m.text)){blocked++;continue;}
    const k=key(m);if(original.has(k)){duplicates++;continue;}
    const prev=grouped.get(k);
    if(prev){duplicates++;if(prev.health!==m.health){grouped.set(k,{...prev,health:true});}continue;}
    grouped.set(k,{id:m.id,category:m.category,text:m.text,day:m.day,health:m.health,historical815:true});
  }
  return {notes:[...grouped.values()],duplicates,blocked};
}
export async function readApproved815(current,open=openStore){
  const store=await open();
  try{const r=await store.read('preferences');return approvedMemory815(r.payload,current);}
  finally{store.close();}
}

// Revocar la aprobación de la entrada visible; un grupo deduplicado se excluye entero.
export async function excludeApproved829(note,current=[],open=openStore){
 const store=await open();try{const q=await store.read('preferences');const fresh=approvedMemory815(q.payload,current);const match=fresh.notes.find(m=>m.id===note?.id);if(!match||JSON.stringify(match)!==JSON.stringify(note))throw Error('Cambió el recuerdo. Volvé a consultar.');const next=structuredClone(q.payload),k=key(match);let count=0;for(const m of next.reviewedMemory810||[])if(m.status==='approved'&&key(m)===k){m.status='excluded';count++;}if(!count)throw Error('Recuerdo no disponible');next.audit.push({at:Date.now(),action:'Exclusión manual desde Coach: '+count});next.audit=next.audit.slice(-200);await store.write('preferences',q.revision,validate84(next));return count;}finally{store.close();}
}
