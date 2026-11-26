// Candidate only; leave original V10.6 files unchanged. Share exact implementation
// between diary, shell and server to preserve referenced slots during merges.
import {readFileSync,writeFileSync} from 'node:fs';
export function patchRoutine1190(web){
 const original=readFileSync('gym826.js','utf8'),anchor='return true;}\n// Only exact original routine structures';
 if(original.split(anchor).length!==2)throw Error('Marcador de compatibilidad de rutinas');
 const guard="const ps=before?.programmes102??[],changes=before?.coachRoutine1179??[],incoming=after?.coachRoutine1179??[];check(Array.isArray(ps)&&Array.isArray(changes)&&Array.isArray(incoming),'Referencias de rutina inválidas');const referenced=new Set(ps.flatMap(p=>p.days.map(d=>d.slot)));for(const r of changes)for(const slot of [r.baseSlot,r.oldSlot,r.newSlot])referenced.add(slot);for(const slot of referenced)if(slot>=4)check(a[slot-4]&&JSON.stringify(a[slot-4])===JSON.stringify(b[slot-4]),'Una rutina referenciada por un programa o Coach debe conservar su identidad. Creá una versión nueva.');check(changes.length<=incoming.length&&changes.every((r,i)=>JSON.stringify(r)===JSON.stringify(incoming[i])),'El historial de cambios del Coach es acumulativo.');";
 const text=original.replace(anchor,guard+anchor);
 for(const path of [web+'/diary/gym826.js',web+'/gym826.js']){if(readFileSync(path,'utf8')!==original)throw Error('Gym original inesperado');writeFileSync(path,text)}
 const diary=web+'/diary/index.html';let html=readFileSync(diary,'utf8'),persist='const next=JSON.stringify(data);localStorage.setItem(key,next);disk600=next;return true';
 if(html.split(persist).length!==2)throw Error('Marcador de persistencia de diario');
 // Use persisted before-image, not mutable live data. Explicit whole-copy recovery
 // uses a separate verified mechanism; normal edits/merges cannot truncate versions.
 html=html.replace(persist,"if(disk600!==null){const previous=JSON.parse(disk600);if(JSON.stringify(previous.settings??{})!==JSON.stringify(data.settings??{})){window.asiaGym826.compatibleSettings(previous.settings,data.settings,previous.work);const programmes=window.asiaSchedule829.programmes(data.settings);window.asiaCoachActions1179.validate(data.settings,window.asiaGym826,programmes);}}"+persist);
 writeFileSync(diary,html);
 return text;
}
