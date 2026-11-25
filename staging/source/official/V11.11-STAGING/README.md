# Asia Platform V11.11 — Identidad Google OIDC para staging

**Objetivo:** reemplazar la identidad simulada de V11.10 por un **Worker nuevo** con acceso real de Google OIDC y D1, sin modificar los Workers antiguos ni la aplicación personal V10.6. Es un puente técnico pre-beta, no una aplicación pública.

## Paso único para probarlo en Windows (sin Google ni Cloudflare)

1. Extraer TODO el ZIP en una carpeta nueva, sin mezclar con las anteriores.
2. Abrir PowerShell **dentro de `V11.11-STAGING`**.
3. Ejecutar `node scripts/preflight1111.mjs`.

Resultado esperado:

```text
V11.11 PREFLIGHT: VALIDADO OFFLINE.
Sin Google real, sin Cloudflare, sin contraseñas ni datos personales.
```

La verificación ejecuta las pruebas de V11.9 y V11.10b, comprueba los hashes nuevos y usa **SQLite y WebCrypto reales** para simular un Worker y un proveedor Google de firma RSA, sin conexión externa. Los archivos extraídos que no pertenecen al manifiesto no hacen fallar el test (se verifica la integridad de los archivos necesarios, sin el error del ZIP sobrante de V11.10b).

## Despliegue posterior (requiere un proyecto OAuth de Google)

**No ejecutar estos pasos hasta revisar la configuración.** Es una operación separada y voluntaria. Consultar `DESPLIEGUE_CONTROLADO.md`. No hace falta cambiar el `STAGING_API_TOKEN` anterior. El acceso público y la escritura de datos sintéticos permanecen inhabilitados por defecto, y la cuenta Google está limitada a hasta cinco correos permitidos.

## Alcance y límites

- Login OIDC con Google, authorization code + PKCE S256, state y nonce de un solo uso.
- Validación RS256 de JWT mediante JWKS y comprobación de issuer/audience/exp/nonce/sub/email verificado.
- Lista privada de correos permitidos por secreto de Cloudflare; cookies Secure/HttpOnly/SameSite y sesiones revocables en D1.
- Snapshot cifrado en D1 bajo cuenta derivada del `sub` firmado; bloqueo de suplantación y control de revisiones.
- Nueva base auxiliar en **la misma D1 staging**; tablas propias `auth_oidc_*_v1111`. No hay migración de datos personales.
- No hay recuperación de clave de bóveda, Apple/passkeys nativos, sincronización física completa, HealthKit, push, verificación externa ni garantías de beta pública.
- `STAGING_ALLOW_SYNTHETIC_SNAPSHOTS` es `false`: no se aceptan respaldos hasta habilitarlo deliberadamente con datos de prueba.
- El estilo de V10.6 y de los laboratorios V11.7–V11.10 NO se modifica.
