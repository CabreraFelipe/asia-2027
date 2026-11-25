// Launch two localhost servers: an OIDC-style BFF and a MOCK identity provider.
import {startGateway} from '../src/gateway1110.mjs';
import {startMockProvider} from '../src/mock-provider1110.mjs';
const parse=(raw,defaultPort)=>{const n=Number(raw||defaultPort);if(!Number.isSafeInteger(n)||n<1024||n>65535)throw Error('PUERTO_INVALIDO');return n;};
const appPort=parse(process.env.ASIA1110_PORT,4177),idpPort=parse(process.env.ASIA1110_IDP_PORT,4178);
if(appPort===idpPort)throw Error('PUERTOS_IGUALES');
const provider=startMockProvider({port:idpPort,appPort});
const gateway=startGateway({port:appPort,idpPort,issuer:provider.issuer});
const listen=(s,port)=>new Promise((resolve,reject)=>{s.once('error',reject);s.listen(port,'127.0.0.1',resolve);});
try{await listen(provider.server,idpPort);await listen(gateway.server,appPort);console.log(`V11.10 identidad ficticia, sin contraseñas. Abrir http://127.0.0.1:${appPort}/v1110/`);console.log('Solo loopback, sin red externa, sin Cloudflare. Ctrl+C para detener.');}
catch(e){gateway.server.close();provider.server.close();console.error('No se pudo iniciar laboratorio:',e.message);process.exitCode=1;}
for(const event of ['SIGINT','SIGTERM'])process.on(event,()=>{gateway.server.close();provider.server.close();});
