// Receiver for a future real-account Service Worker. Not installed in the synthetic pilot.
// Never put account, health, nutrition or diary details in the notification or navigation URL.
const kinds=new Set(['weight','gym','diet','weekly','rest']);
const home='/v11.42/index.html',maxBytes=512;
const exact=(v,keys)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
export function parseNotificationPayload(text,now){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>maxBytes||!Number.isSafeInteger(now)||now<86400000)return null;
 let p;try{p=JSON.parse(text)}catch{return null}
 if(!exact(p,['version','kind','due'])||p.version!==1||!kinds.has(p.kind)||!Number.isSafeInteger(p.due)||p.due>now+60000||p.due<=now-(p.kind==='rest'?300000:3600000))return null;
 return Object.freeze({kind:p.kind,due:p.due});
}
export function installNotificationReceiver(scope,{enabled=false,now=Date.now}={}){
 if(enabled!==true)return false;
 if(typeof scope?.addEventListener!=='function'||typeof scope.registration?.showNotification!=='function'||typeof scope.clients?.openWindow!=='function'||typeof scope.clients?.matchAll!=='function'||typeof now!=='function')throw Error('Receiver unavailable');
 const origin=new URL(scope.location.origin).origin,target=new URL(home,origin).href;
 if(origin!==scope.location.origin||!target.startsWith('https://'))throw Error('Secure origin required');
 scope.addEventListener('push',event=>{
  event.waitUntil((async()=>{
   let p;try{p=parseNotificationPayload(event.data?.text(),now())}catch{return}
   if(!p)return;
   // Use a generic lock-screen message and no persistent private data.
   await scope.registration.showNotification('Asia 2027',{body:'Tenés un recordatorio. Abrí la aplicación para consultarlo.',tag:'asia-v12-reminder-'+p.kind+'-'+p.due,renotify:false,data:{version:1,source:'asia-v12'}});
  })());
 });
 scope.addEventListener('notificationclick',event=>{
  const n=event.notification;
  if(!exact(n?.data,['version','source'])||n.data.version!==1||n.data.source!=='asia-v12'||typeof n.tag!=='string'||!/^asia-v12-reminder-(weight|gym|diet|weekly|rest)-\d+$/.test(n.tag))return;
  n.close();
  event.waitUntil((async()=>{
   const windows=await scope.clients.matchAll({type:'window',includeUncontrolled:true});
   const shell=windows.find(c=>c.url===target&&typeof c.focus==='function');
   if(shell){await shell.focus();return}
   await scope.clients.openWindow(target);
  })());
 });
 return true;
}
