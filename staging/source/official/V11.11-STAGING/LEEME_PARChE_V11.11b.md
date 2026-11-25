# V11.11b — Corrección del callback OAuth de Google

## Problema
El callback rechazaba la redirección de Google si contenía parámetros adicionales a `state` y `code`. Google puede incluir `scope`, `authuser`, `prompt` y `hd`; esto producía `FLUJO_INVALIDO` después de autorizar la cuenta.

## Corrección
El Worker acepta campos adicionales acotados sin usarlos para decisiones de identidad; exige exactamente un `state` y un `code`, conserva la comprobación del cookie de estado, la protección PKCE, el token firmado, `nonce`, el allowlist y los controles de staging. Un cookie de flujo ausente devuelve `FLUJO_COOKIE_AUSENTE` para facilitar un diagnóstico seguro, sin mostrar tokens.

## Instalación (Windows)
1. Extraé los archivos de este parche **dentro de la carpeta `V11.11-STAGING` existente**, conservando las subcarpetas `src` y `tests` y aceptando reemplazos.
2. Abrí PowerShell dentro de `V11.11-STAGING` y ejecutá `node scripts/preflight1111.mjs`. Debe terminar con `V11.11 PREFLIGHT: VALIDADO OFFLINE.`.
3. Solo si el preflight termina correctamente, ejecutá `npx.cmd --yes wrangler@4.165.0 deploy --config wrangler.identity.toml`. Debe anunciar únicamente `asia-v1111-identity-staging`.
4. Abrí `https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev/v11.11/` en una pestaña nueva y hacé clic en **Iniciar sesión con Google**. No reutilices la URL anterior `/auth/callback` ni copies el `state` ni el `code` a ningún chat.
5. Debería llegar automáticamente a `/v11.11/auth/me` y devolver `ok:true`. Si aparece `FLUJO_COOKIE_AUSENTE`, repetí en el mismo perfil y ventana de Chrome, con cookies habilitadas.

No correr migraciones, no cambiar secretos, no modificar producción y no subir información personal al laboratorio.
