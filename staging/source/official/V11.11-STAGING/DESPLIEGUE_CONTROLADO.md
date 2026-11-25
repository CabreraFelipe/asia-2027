# V11.11 — Despliegue controlado (solo staging)

**Antes de desplegar**: terminar el preflight local, revisar `wrangler.identity.toml` y verificar que el proyecto pertenece a tu Cloudflare. No hacer nada contra `asia2027db`, `asia-2027-ai` ni `asia-2027-rest`.

## 1. Google Cloud Console

En Google Cloud Console → APIs & Services → Credentials, crear un **OAuth Client ID tipo Web application**. Completar la pantalla de consentimiento OAuth y agregar tu cuenta Google como usuaria de prueba si el proyecto está en modo Testing.

URI de redirección autorizada EXACTA:

`https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev/v11.11/auth/callback`

Se necesitan el `Client ID` y el `Client Secret`. **Nunca** pegarlos en el chat ni guardarlos en archivos del proyecto. Usar los controles seguros de tu consola de Cloudflare o Wrangler secret put (sin mostrar valores).

## 2. Cloudflare — migración SOLO EN STAGING

Ubicado en `V11.11-STAGING`, primero confirmar nombre, binding e ID de `wrangler.identity.toml`:

- Worker **nuevo**: `asia-v1111-identity-staging`.
- D1 existente de laboratorio: `asia-v11-db-staging`.
- Binding: `STAGING_DB`.
- Migración adicional: `0006_identity_oidc.sql`.

La carpeta `migrations/` del proyecto nuevo contiene solamente `0006_identity_oidc.sql`. Antes de aplicarla, hacer copia de seguridad de staging y confirmar que la base es la esperada. Comando:

```powershell
npx.cmd --yes wrangler@4.165.0 d1 migrations apply asia-v11-db-staging --config wrangler.identity.toml --remote
```

## 3. Secretos del Worker NUEVO

Primero crear el Worker NUEVO con `wrangler deploy --config wrangler.identity.toml`: estará **deshabilitado** hasta tener sus tres secretos. Después, en Cloudflare Dashboard → Workers & Pages → `asia-v1111-identity-staging` → Settings → Variables and Secrets, agregar:

- `STAGING_GOOGLE_CLIENT_ID`: ID cliente OAuth de Google.
- `STAGING_GOOGLE_CLIENT_SECRET`: secreto cliente OAuth de Google.
- `STAGING_ALLOWED_EMAILS`: de uno a cinco correos Google verificados y autorizados, separados por comas. No ingresarlos al código ni compartirlos en el chat. Se almacenan huellas SHA-256 de esos correos junto a las sesiones de prueba (son seudónimos, no datos anónimos).

Los tres se guardan como secretos, no en un archivo de código. `STAGING_ALLOW_SYNTHETIC_SNAPSHOTS` debe seguir en `false`.

## 4. Diagnóstico remoto sin modificar información

Desde PowerShell en `V11.11-STAGING`:

```powershell
node scripts/smoke1111.mjs
```

Debe informar HTTP 200 en status, HTTP 401 en `/auth/me` y HTTP 403 en snapshots. No rota secretos ni crea cuentas. La autenticación real se verifica después abriendo la URL del Worker desde Chrome y entrando con la cuenta de prueba permitida.

## 5. Comprobación manual de Google (sin datos de Salud)

Abrir: `https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev/v11.11/`. Ingresar con Google; Google debe comprobar el usuario de prueba. Tras el callback, `/v11.11/auth/me` devolverá una identidad seudónima y CSRF en JSON. No contiene email, contraseña ni token OAuth. No subir respaldos personales.

**Alcance:** El Worker es un nuevo servicio de staging. NO está conectado a la PWA V10.6; la identidad y la API nuevas todavía requieren revisión de seguridad y una prueba real de Google antes de la beta.
