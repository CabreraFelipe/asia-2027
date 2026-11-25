import json, urllib.request, urllib.error, urllib.parse, time, sys
origin='https://asia-v1142-candidate-staging.cabrerafelipe2003.workers.dev'
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*a,**k):return None
opener=urllib.request.build_opener(NoRedirect)
def get(path):
    try:
        with opener.open(origin+path,timeout=15) as r:return r.status,r.headers,r.read()
    except urllib.error.HTTPError as e:return e.code,e.headers,b''
for i in range(12):
    try:
        if get('/v11.42/index.html')[0]==200:break
    except Exception:pass
    time.sleep(5)
else:sys.exit('Worker publicado no disponible; inspeccionar antes de reintentar')
status,h,b=get('/v11.42/manifest.json')
if status!=200 or json.loads(b).get('scope')!='/v11.42/':sys.exit('Manifest inválido')
for p,expected in [('/v11.42/app.mjs',401),('/v11.42/diary/index.html',401),('/v11.11/auth/me',401),('/v11.38/sync',401),('/v11.24/',404)]:
    actual=get(p)[0]
    print(p+': HTTP '+str(actual)+' (esperado '+str(expected)+')',flush=True)
    if actual!=expected:sys.exit('Smoke de aislamiento falló en '+p)
print('Manifest correcto; comprobaciones de aislamiento aprobadas.',flush=True)
# Una sola solicitud de inicio genera un flujo OAuth temporal. Nunca se sigue a Google.
status,h,b=get('/v11.11/auth/start')
print('Inicio OAuth: HTTP '+str(status),flush=True)
location=urllib.parse.urlparse(h.get('Location',''))
params=urllib.parse.parse_qs(location.query)
if status not in [302,303] or location.scheme!='https' or location.hostname!='accounts.google.com' or params.get('redirect_uri')!=[origin+'/v11.11/auth/callback'] or params.get('code_challenge_method')!=['S256']:sys.exit('Inicio OAuth no verificado')
print('Smoke real aprobado: manifest, autorización, rutas aisladas, inicio Google y PKCE. No se inició sesión ni se migraron datos.')
