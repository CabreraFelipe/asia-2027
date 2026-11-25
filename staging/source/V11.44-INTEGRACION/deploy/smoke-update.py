import urllib.request, urllib.error, time, sys, hashlib, pathlib
origin='https://asia-v1142-candidate-staging.cabrerafelipe2003.workers.dev'
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*a,**k):return None
opener=urllib.request.build_opener(NoRedirect)
def get(path):
    try:
        with opener.open(urllib.request.Request(origin+path,headers={'User-Agent':'Asia-pilot-update-check/1'}),timeout=15) as r:return r.status,r.read()
    except urllib.error.HTTPError as e:return e.code,b''
expected=hashlib.sha256(pathlib.Path('staging/source/V11.42-INTEGRACION/dist/assets/v11.42/entry.js').read_bytes()).digest()
for i in range(24):
    try:
        status,body=get('/v11.42/entry.js')
        if status==200 and hashlib.sha256(body).digest()==expected:break
        print('Entrada: HTTP '+str(status)+'; esperando nueva versión',flush=True)
    except Exception as e:print(type(e).__name__,flush=True)
    time.sleep(5)
else:sys.exit('Actualización no verificada; no volver a desplegar sin revisar')
for path,wanted in [('/v11.42/index.html',200),('/v11.42/app.mjs',401),('/v11.11/auth/me',401)]:
    status,_=get(path)
    print(path+': HTTP '+str(status))
    if status!=wanted:sys.exit('Aislamiento no confirmado')
print('Huella SHA-256 de entrada publicada coincide con el paquete local; acceso privado protegido. Sin login ni cambio de datos.')
