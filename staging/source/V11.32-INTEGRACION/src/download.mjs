// Explicit user-initiated browser download; triggering does not prove that the file was saved.
export function downloadEncryptedCopy(envelope,{document:doc=globalThis.document,url=globalThis.URL,filename='asia-recuperacion-cifrada.json'}={}){
 if(envelope?.format!=='asia84-encrypted-v1'||typeof envelope.cipher!=='string'||typeof envelope.salt!=='string'||typeof envelope.iv!=='string')throw Error('Copia cifrada inválida');
 if(!/^asia-[a-z0-9-]+\.json$/.test(filename))throw Error('Nombre inválido');
 const blob=new Blob([JSON.stringify({format:envelope.format,cipher:envelope.cipher,salt:envelope.salt,iv:envelope.iv})],{type:'application/json'});
 const href=url.createObjectURL(blob),a=doc.createElement('a');a.href=href;a.download=filename;
 try{doc.body.append(a);a.click()}finally{a.remove();setTimeout(()=>url.revokeObjectURL(href),1000)}
}

// Multipart review archive: preserve the exact object and all authenticated
// parts. Starting a download is not proof of saving or verification.
export function downloadRecoveryArchive1167(archive,{document:doc=globalThis.document,url=globalThis.URL}={}){
 const encrypted=e=>e?.format==='asia84-encrypted-v1'&&typeof e.cipher==='string'&&typeof e.salt==='string'&&typeof e.iv==='string';
 if(!encrypted(archive?.manifest)||!Array.isArray(archive.parts)||archive.parts.length>16||!archive.parts.every(p=>typeof p.name==='string'&&encrypted(p.envelope)))throw Error('Archivo de revisión inválido');
 const blob=new Blob([JSON.stringify(archive)],{type:'application/json'});
 const href=url.createObjectURL(blob),a=doc.createElement('a');a.href=href;a.download='asia-revision-cifrada.json';
 try{doc.body.append(a);a.click()}finally{a.remove();setTimeout(()=>url.revokeObjectURL(href),1000)}
}
