// Images stay in browser memory until explicit upload. No saved photos or full video sent.
function canvasJPEG(source,w,h){if(!Number.isFinite(w)||!Number.isFinite(h)||w<1||h<1)throw Error('Imagen o vídeo sin dimensiones');const scale=Math.min(1,768/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(source,0,0,c.width,c.height);let out=c.toDataURL('image/jpeg',.72);if(out.length>600000)out=c.toDataURL('image/jpeg',.45);if(out.length>600000||!out.startsWith('data:image/jpeg;base64,'))throw Error('No se pudo preparar la imagen');return out}
export async function preparePhoto84(file){if(!file||!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type)||file.size>12e6)throw Error('Elegí una imagen de hasta 12 MB');const u=URL.createObjectURL(file);try{const img=new Image();img.src=u;try{await img.decode()}catch{throw Error('No se pudo abrir la foto. Probá exportarla como JPEG o PNG.')}return canvasJPEG(img,img.naturalWidth,img.naturalHeight)}finally{URL.revokeObjectURL(u)}}
export function captureFrame84(video){if(video.readyState<2)throw Error('Esperá a que cargue el vídeo');video.pause();return canvasJPEG(video,video.videoWidth,video.videoHeight)}
export async function requestVision84(endpoint,key,mode,question,images,fetcher=fetch){
 const u=new URL(endpoint);
 if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.pathname!=='/vision84'||!/^[a-f0-9]{64}$/i.test(key))throw Error('Servidor o clave de acceso inválida');
 if(!['meal','technique'].includes(mode)||typeof question!=='string'||question.length>600||!Array.isArray(images)||images.length<1||images.length>4||images.some(i=>typeof i!=='string'||i.length>600000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(i)))throw Error('Elegí de 1 a 4 imágenes válidas');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),110000);
 try{
  const r=await fetcher(u.href,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({mode,question,images}),cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal});
  if(r.status===401||r.status===403)throw Error('Acceso rechazado (HTTP '+r.status+'). Revisá el acceso IA en la configuración original.');
  if(r.status===404||r.status===405)throw Error('Ruta visual no disponible (HTTP '+r.status+'). Revisá que el AI Worker tenga desplegada /vision84.');
  if(r.status===429)throw Error('Límite de análisis visual alcanzado (HTTP 429). Probá otro día (UTC).');
  if(r.status===503)throw Error('Servicio visual no configurado o temporalmente no disponible (HTTP 503).');
  let x;try{x=await r.json()}catch{throw Error('Respuesta no válida del servidor (HTTP '+r.status+').');}
  if(r.status===502)throw Error('El servicio de IA no completó la consulta (HTTP 502'+(Number.isInteger(x?.upstream_status)?'; OpenAI '+x.upstream_status:'')+').');
  if(!r.ok)throw Error('El servidor rechazó el análisis (HTTP '+r.status+').');
  if(x?.ok!==true||typeof x.answer!=='string'||!x.answer.trim()||x.answer.length>12000)throw Error('Respuesta de IA inválida.');
  return x;
 }catch(e){if(controller.signal.aborted)throw Error('Tiempo de espera agotado. No se reenvió automáticamente la consulta.');if(e instanceof TypeError)throw Error('No se pudo conectar al servicio visual. Revisá la conexión y el despliegue del Worker.');throw e;}finally{clearTimeout(timer);}
}
