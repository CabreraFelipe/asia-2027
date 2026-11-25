# Asia Platform V11.11d — Corrección de compatibilidad real con Cloudflare Workers

## Error reproducido

El callback de V11.11c devolvía `IDENTIDAD_NO_VERIFICADA`, `fase: INTERCAMBIO_GOOGLE`, `diagnostico: NO_DETERMINADO`.

**Causa identificada:** `providerJSON()` llamaba a `fetch(..., {redirect: 'error'})`. Según la documentación oficial de Cloudflare Workers, `redirect: 'error'` no está implementado y arroja un `TypeError` **antes** de enviar la petición a Google. Las pruebas en Node.js no habían reproducido esa diferencia del runtime.

Referencia: https://developers.cloudflare.com/workers/runtime-apis/request/

## Qué se corrigió

- `src/worker1111.mjs`: se utiliza `redirect: 'manual'` con **rechazo explícito de cualquier estado HTTP 3xx**, para impedir que los parámetros OAuth sean reenviados a un destino inesperado.
- `tests/test1111.mjs`: comprueba el modo compatible con Cloudflare durante el flujo OIDC firmado de extremo a extremo.
- `tests/test1111d.mjs`: pruebas negativas de redirección en el token endpoint y las claves públicas, así como de errores seguros del proveedor.
- `scripts/preflight1111.mjs` y `SHA256_V11.11.txt`: auditoría completa del paquete.

No se cambian secretos, base de datos, rutas, origen, Google Console, cifra ni diseño. No requiere migraciones. **No se garantiza el éxito de un login real hasta probar el Worker desplegado.**

## Instalación en Windows (desde V11.11c ya instalado)

1. Descargar el ZIP y **extraer sus archivos dentro de `V11.11-STAGING`**, reemplazando los existentes. Si el explorador crea una carpeta adicional, mover los archivos `src`, `tests`, `scripts` y el manifiesto directamente a `V11.11-STAGING`.
2. Abrir PowerShell en `V11.11-STAGING` y ejecutar `node scripts/preflight1111.mjs`. Debe terminar en `V11.11d PREFLIGHT: VALIDADO OFFLINE.`
3. Solo si pasó, ejecutar `npx.cmd --yes wrangler@4.165.0 deploy --config wrangler.identity.toml`. Verificar que el único Worker desplegado sea `asia-v1111-identity-staging`.
4. Abrir **la página principal** https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev/v11.11/ e iniciar un flujo nuevo con Google. No reutilizar una URL vieja de callback.
5. Debe dirigir a `/v11.11/auth/me` con `ok: true`. Si falla, compartir **solo** el JSON de error, nunca la URL del callback, códigos OAuth, tokens, correos o secretos.

**Alcance:** únicamente Worker nuevo de staging. No se toca la PWA V10.6 ni Workers/base de producción. No subir datos reales a este laboratorio.
