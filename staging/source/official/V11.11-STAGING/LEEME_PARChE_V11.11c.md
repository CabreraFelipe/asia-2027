# V11.11c — Diagnóstico seguro del inicio de sesión con Google

**Motivo:** V11.11b devolvía `IDENTIDAD_NO_VERIFICADA` tanto si fallaba el intercambio del código de Google como si fallaban sus claves públicas, el token de identidad o D1. Sin distinguir la etapa no era seguro recomendar cambiar credenciales ni relajar validaciones.

**Qué cambia:** el callback conserva todas las comprobaciones de `state`, cookie, PKCE, JWT firmado, `nonce` y allowlist. Ante un fallo devuelve **únicamente categorías fijas y no sensibles**:

- `fase: FLUJO_D1`: no se pudo consumir el flujo temporal en D1.
- `fase: INTERCAMBIO_GOOGLE`: Google rechazó o no respondió al intercambio de autorización. `diagnostico: INVALID_CLIENT` apunta al cliente OAuth; `INVALID_GRANT` al código/redirect/tiempo; `NO_DETERMINADO` requiere investigar la conectividad.
- `fase: CLAVES_GOOGLE`: no se pudieron recuperar las claves públicas de Google.
- `fase: TOKEN_GOOGLE`: el token no pasó la verificación criptográfica o sus condiciones de seguridad.
- `fase: CUENTA_D1`: falló la vinculación a la cuenta en D1.
- `fase: SESION_D1`: falló la escritura de la sesión en D1.

No se devuelven ni registran códigos OAuth, tokens, email, secretos, SQL ni respuestas del proveedor. Los errores de Google se restringen a identificadores conocidos.

## Instalación segura en Windows

1. Extraer los archivos del ZIP **dentro de** la carpeta `V11.11-STAGING` que ya contiene V11.11b, reemplazando los existentes. El ZIP no contiene secretos ni `wrangler.identity.toml`.
2. Desde esa carpeta ejecutar `node scripts/preflight1111.mjs`. La última línea debe decir `V11.11c PREFLIGHT: VALIDADO OFFLINE.`. Si no pasa, **no desplegar**.
3. Ejecutar `npx.cmd --yes wrangler@4.165.0 deploy --config wrangler.identity.toml`. Verificar que el único Worker sea `asia-v1111-identity-staging`.
4. Abrir la pantalla `https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev/v11.11/` y presionar **Iniciar sesión con Google** en una pestaña nueva. No reutilizar una URL de callback porque los códigos OAuth son de un solo uso.
5. Si devuelve error, compartir **solo el objeto JSON de error** con `fase` y `diagnostico`, **no la URL del navegador ni un token ni datos de Google**.

No es necesario cambiar el cliente OAuth, volver a crear la base, repetir migraciones, configurar secretos ni acceder a producción. Esta entrega **diagnostica**, pero no afirma resolver una causa que todavía no fue identificada en Cloudflare real.
