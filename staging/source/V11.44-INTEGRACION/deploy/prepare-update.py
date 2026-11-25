import os, re, json, sys, urllib.request, urllib.error, pathlib, tempfile
token=os.environ['CLOUDFLARE_API_TOKEN']; account=os.environ['CLOUDFLARE_ACCOUNT_ID']
origin='https://asia-v1142-candidate-staging.cabrerafelipe2003.workers.dev'
worker='asia-v1142-candidate-staging'; db='asia-v1142-new-synthetic-db'; bucket='asia-v1142-new-synthetic-objects'
if not token or not re.fullmatch(r'[a-fA-F0-9]{32}',account): sys.exit('Credenciales Cloudflare inválidas')
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
settings=api('GET','/workers/scripts/'+worker+'/settings')
if not isinstance(settings,dict) or not isinstance(settings.get('bindings'),list):sys.exit('Worker publicado no confirmado')
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
bindings={b.get('name'):b for b in settings['bindings'] if isinstance(b,dict)}
types={'STAGING_DB':'d1','STAGING_SYNC_OBJECTS':'r2_bucket','STAGING_PWA_ASSETS':'assets','STAGING_GOOGLE_CLIENT_ID':'secret_text','STAGING_GOOGLE_CLIENT_SECRET':'secret_text','STAGING_ALLOWED_EMAILS':'secret_text','STAGING_MODE':'plain_text','STAGING_ORIGIN':'plain_text','STAGING_ALLOW_V1142_TESTS':'plain_text','STAGING_ALLOW_V1138_TESTS':'plain_text','STAGING_ALLOW_V1139_TESTS':'plain_text'}
if set(bindings)!=set(types) or any(bindings[k].get('type')!=v for k,v in types.items()):sys.exit('Bindings distintos del piloto esperado')
if (bindings['STAGING_DB'].get('id') or bindings['STAGING_DB'].get('database_id'))!=uid or bindings['STAGING_SYNC_OBJECTS'].get('bucket_name')!=bucket:sys.exit('Bindings de datos no coinciden; no desplegar')
for k,v in {'STAGING_MODE':'asia-v1111-identity-private','STAGING_ORIGIN':origin,'STAGING_ALLOW_V1142_TESTS':'true','STAGING_ALLOW_V1138_TESTS':'true','STAGING_ALLOW_V1139_TESTS':'true'}.items():
    if bindings[k].get('text')!=v:sys.exit('Variables no coinciden; no desplegar')
p=pathlib.Path('staging/source/V11.42-INTEGRACION/dist')
config=(p/'wrangler.template.toml').read_text().replace('REPLACE-NEW-D1-ID',uid).replace('https://asia-v1142-candidate-staging.REPLACE-SUBDOMAIN.workers.dev',origin)
for flag in ['STAGING_ALLOW_V1142_TESTS','STAGING_ALLOW_V1138_TESTS','STAGING_ALLOW_V1139_TESTS']:
    config=config.replace(flag+' = "false"',flag+' = "true"')
if 'REPLACE-' in config or 'name = "'+worker+'"' not in config or 'run_worker_first = true' not in config:sys.exit('Plantilla no válida')
(p/'wrangler.toml').write_text(config)
print('Worker y bindings originales del piloto verificados. No se modifican datos ni secretos.')
