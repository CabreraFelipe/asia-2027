import os, re, json, urllib.request, urllib.error, sys
account=os.environ.get('CLOUDFLARE_ACCOUNT_ID',''); token=os.environ.get('CLOUDFLARE_API_TOKEN','')
if not token or not re.fullmatch(r'[a-fA-F0-9]{32}',account):sys.exit('Credenciales no válidas')
worker='asia-v1142-candidate-staging'
origin='https://asia-v1142-candidate-staging.cabrerafelipe2003.workers.dev'
base='https://api.cloudflare.com/client/v4/accounts/'+account
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*a,**k):return None
opener=urllib.request.build_opener(NoRedirect)
def api(label,path):
    request=urllib.request.Request(base+path,headers={'Authorization':'Bearer '+token,'Accept':'application/json'})
    try:
        with opener.open(request,timeout=20) as r:obj=json.load(r)
        if obj.get('success') is not True:print(label+': API no confirmó');return None
        print(label+': GET confirmado');return obj.get('result')
    except urllib.error.HTTPError as e: print(label+': HTTP '+str(e.code));return None
    except Exception as e:print(label+': '+type(e).__name__);return None
sub=api('Subdominio de cuenta','/workers/subdomain')
if isinstance(sub,dict):print('Subdominio esperado: '+str(sub.get('subdomain')=='cabrerafelipe2003'))
sub=api('Estado workers.dev del Worker','/workers/scripts/'+worker+'/subdomain')
if isinstance(sub,dict):
    for k in ('enabled','previews_enabled'):print(k+': '+str(sub.get(k)))
settings=api('Configuración Worker candidato','/workers/scripts/'+worker+'/settings')
if isinstance(settings,dict):
    bindings=settings.get('bindings',[])
    if isinstance(bindings,list):
        by={b.get('name'):b for b in bindings if isinstance(b,dict)}
        for k in ('STAGING_DB','STAGING_SYNC_OBJECTS','STAGING_PWA_ASSETS','STAGING_GOOGLE_CLIENT_ID','STAGING_GOOGLE_CLIENT_SECRET','STAGING_ALLOWED_EMAILS','STAGING_MODE','STAGING_ORIGIN','STAGING_ALLOW_V1142_TESTS','STAGING_ALLOW_V1138_TESTS','STAGING_ALLOW_V1139_TESTS'):
            b=by.get(k,{})
            print(k+': '+str(bool(b))+'; tipo '+str(b.get('type','ausente')))
        for k,v in {'STAGING_MODE':'asia-v1111-identity-private','STAGING_ORIGIN':origin,'STAGING_ALLOW_V1142_TESTS':'true','STAGING_ALLOW_V1138_TESTS':'true','STAGING_ALLOW_V1139_TESTS':'true'}.items():
            print(k+' coincide: '+str(by.get(k,{}).get('text')==v))
    print('Configuración assets presente: '+str(bool(settings.get('assets'))))
for path in ('/','/v11.42/index.html','/v11.42/manifest.json','/v11.42/entry.js','/v11.42/app.mjs','/v11.11/auth/me'):
    req=urllib.request.Request(origin+path,headers={'User-Agent':'Asia-pilot-readonly-diagnostic/1'})
    try:
        with opener.open(req,timeout=15) as r:
            print(path+': HTTP '+str(r.status)+'; Content-Type '+str(r.headers.get('Content-Type',''))+'; cache '+str(r.headers.get('Cache-Control','')))
    except urllib.error.HTTPError as e:
        body=e.read(8192).decode('utf-8','replace')
        known=next((x for x in ('1101','1102','1016','1000','1042','1033','1020') if re.search(r'(?i)(?:error(?: code)?[ :<>/]*|\bcode[ :<>/]+)'+x+r'\b',body)),None)
        print(path+': HTTP '+str(e.code)+'; error Cloudflare '+str(known or 'no identificado')+'; cache '+str(e.headers.get('Cache-Control','')))
    except Exception as e:print(path+': '+type(e).__name__)
print('Diagnóstico finalizado. Solo GET, sin cambios remotos ni valores de secretos.')
