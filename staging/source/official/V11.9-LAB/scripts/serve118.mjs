// Asia V11.8 audited offline LAB. Serves only known static files on IPv4 loopback.
// No API, credentials, request bodies, proxied paths or outward connections.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const PAGES=new Map([
 ['/', '../v118/index.html'],['/web/', '../web/index.html'],['/web/index.html','../web/index.html'],['/v118/', '../v118/index.html'],['/v118/index.html','../v118/index.html'],
 ...['styles.css','app.mjs','vault117.mjs','icon.svg','manifest.webmanifest','sw117.js'].map(f=>['/web/'+f,'../web/'+f]),
 ...['styles.css','app.mjs','vault117.mjs','icon.svg','manifest.webmanifest','sw118.js'].map(f=>['/v118/'+f,'../v118/'+f]),
 ['/coach115-client.mjs','../coach115-client.mjs'],['/wellness116-client.mjs','../wellness116-client.mjs']
]);
const TYPES={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json; charset=utf-8'};
const policy="default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'";
const port=Number(process.env.ASIA117_PORT??4177);
if(!Number.isSafeInteger(port)||port<1024||port>65535)throw Error('INVALID_PORT');
const server=createServer(async(req,res)=>{
 const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':policy,'Cache-Control':'no-store','X-Frame-Options':'DENY','Cross-Origin-Resource-Policy':'same-origin','Permissions-Policy':'geolocation=(), camera=(), microphone=()'};
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{...headers,Allow:'GET, HEAD'}).end();return;}
 let url;try{url=new URL(req.url,'http://127.0.0.1');}catch{res.writeHead(400,headers).end();return;}
 if(url.pathname==='/'&&!url.search){res.writeHead(302,{...headers,Location:'/v118/'}).end();return;}
 if(url.search||url.hash||!PAGES.has(url.pathname)){res.writeHead(404,headers).end();return;}
 try{
  const file=new URL(PAGES.get(url.pathname),import.meta.url),buffer=await readFile(file);
  const type=Object.entries(TYPES).find(([ext])=>file.pathname.endsWith(ext))?.[1]||'application/octet-stream';
  res.writeHead(200,{...headers,'Content-Type':type,'Content-Length':buffer.length});res.end(req.method==='HEAD'?undefined:buffer);
 }catch{res.writeHead(500,headers).end();}
});
server.on('error',err=>{console.error(`No se pudo abrir localhost: ${err.message}`);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`V11.8 LAB — abrir http://127.0.0.1:${port}/v118/ (Ctrl+C para detener). No hay despliegue ni conexión externa.`));
