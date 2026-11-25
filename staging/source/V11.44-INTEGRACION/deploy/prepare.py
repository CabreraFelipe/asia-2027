import os, re, json, sys, urllib.request, urllib.error, pathlib, tempfile
token=os.environ['CLOUDFLARE_API_TOKEN']; account=os.environ['CLOUDFLARE_ACCOUNT_ID']
origin='https://asia-v1142-candidate-staging.cabrerafelipe2003.workers.dev'
worker='asia-v1142-candidate-staging'; db='asia-v1142-new-synthetic-db'; bucket='asia-v1142-new-synthetic-objects'
if not token or not re.fullmatch(r'[a-fA-F0-9]{32}',account): sys.exit('Credenciales Cloudflare inválidas')
client=os.environ.get('STAGING_GOOGLE_CLIENT_ID','')
secret=os.environ.get('STAGING_GOOGLE_CLIENT_SECRET','')
emails=os.environ.get('STAGING_ALLOWED_EMAILS','')
allowed=[x.strip().lower() for x in emails.split(',')]
if not re.fullmatch(r'[A-Za-z0-9_.-]+\.apps\.googleusercontent\.com',client) or not 8<=len(secret)<=512 or not 1<=len(allowed)<=5 or len(set(allowed))!=len(allowed) or not all(re.fullmatch(r'[^\s@,]+@[^\s@,]+\.[^\s@,]+',x) for x in allowed):
    sys.exit('Faltan los tres secretos OAuth de prueba o su formato no es válido')
base='https://api.cloudflare.com/client/v4/accounts/'+account
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs): return None
opener=urllib.request.build_opener(NoRedirect)
def api(method,path,body=None,missing=False):
    req=urllib.request.Request(base+path,headers={'Authorization':'Bearer '+token,'Accept':'application/json','Content-Type':'application/json'},data=None if body is None else json.dumps(body).encode(),method=method)
    try:
        with opener.open(req,timeout=25) as r: result=json.load(r)
    except urllib.error.HTTPError as e:
        if missing and e.code==404:return None
        sys.exit('Preflight Cloudflare rechazado (HTTP '+str(e.code)+'); sin publicar')
    except Exception:sys.exit('Preflight Cloudflare sin respuesta confirmada; sin publicar')
    if not isinstance(result,dict) or result.get('success') is not True:sys.exit('Preflight no confirmado')
    return result.get('result')
sub=api('GET','/workers/subdomain')
if not isinstance(sub,dict) or sub.get('subdomain')!='cabrerafelipe2003':sys.exit('Subdominio no coincide')
if api('GET','/workers/scripts/'+worker+'/settings',missing=True) is not None:sys.exit('Worker candidato ya existe; no sobrescribir')
rows=api('GET','/d1/database?name='+db+'&per_page=100&page=1')
if not isinstance(rows,list) or len(rows)!=1 or rows[0].get('name')!=db:sys.exit('D1 exacta no identificada')
uid=rows[0].get('uuid','')
if not re.fullmatch(r'[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}',uid) or api('GET','/d1/database/'+uid).get('name')!=db:sys.exit('UUID de D1 no confirmado')
if api('GET','/r2/buckets/'+bucket).get('name')!=bucket:sys.exit('R2 exacto no confirmado')
def query(sql):
    r=api('POST','/d1/database/'+uid+'/query',{'sql':sql})
    if not isinstance(r,list) or len(r)!=1 or r[0].get('success') is not True:sys.exit('Consulta D1 no confirmada')
    return r[0].get('results')
if query('SELECT marker FROM staging_identity_v110 WHERE id=1')!=[{'marker':'asia-v11-staging-110'}]:sys.exit('Marcador de D1 no válido')
for t in ['accounts_v11','auth_oidc_sessions_v1111','sync_v1138_objects']:
    if query('SELECT COUNT(*) AS n FROM '+t)!=[{'n':0}]:sys.exit('La D1 del piloto no está vacía')
p=pathlib.Path('staging/source/V11.42-INTEGRACION/dist')
config=(p/'wrangler.template.toml').read_text().replace('REPLACE-NEW-D1-ID',uid).replace('https://asia-v1142-candidate-staging.REPLACE-SUBDOMAIN.workers.dev',origin)
for flag in ['STAGING_ALLOW_V1142_TESTS','STAGING_ALLOW_V1138_TESTS','STAGING_ALLOW_V1139_TESTS']:
    config=config.replace(flag+' = "false"',flag+' = "true"')
if 'REPLACE-' in config or 'name = "'+worker+'"' not in config or 'run_worker_first = true' not in config:sys.exit('Plantilla no válida')
(p/'wrangler.toml').write_text(config)
# JSON literal, permissions 0600, outside the assets and repository; no shell interpolation.
file=pathlib.Path(os.environ['RUNNER_TEMP'])/'asia-v12-oauth.json'
fd=os.open(file,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
with os.fdopen(fd,'w') as f:json.dump({'STAGING_GOOGLE_CLIENT_ID':client,'STAGING_GOOGLE_CLIENT_SECRET':secret,'STAGING_ALLOWED_EMAILS':','.join(allowed)},f)
print('Destino nuevo verificado; D1 vacía, R2 presente y credenciales OAuth con formato válido. No se han ejecutado migraciones.')
