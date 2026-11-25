# Asia Platform V11.10 — Identidad delegada (laboratorio)

Fecha: 23-11-2026 · Alcance: **offline, local, sin cuentas reales**.

## Cambios entregados

- Servicio de identidad experimental de tipo OIDC Authorization Code + PKCE S256.
- **No existe contraseña local del usuario.** Una pantalla de proveedor ficticio permite elegir Persona A o B para ensayar la autorización. No se piden 16 caracteres ni se guardan contraseñas.
- El gateway hace el intercambio de código *del lado del servidor*, descarga JWKS desde un origen fijo y verifica criptográficamente el ID Token RS256, `iss`, `aud`, `nonce`, `exp`, `iat`, `auth_time` y `sub`.
- `state` y `nonce` aleatorios, transacciones de autorización de uso único, con vencimiento.
- Cookie de sesión HttpOnly, SameSite=Lax y TTL 30 minutos; el identificador crudo de sesión no se almacena (solo su SHA-256), y puede revocarse individualmente o en todas las sesiones de la misma identidad.
- Solicitudes de modificación protegidas por token CSRF y comprobación del origen.
- El `accountId` del backend se deriva únicamente de `issuer + sub` después de verificar la firma; la API ignora identificadores de cuenta suministrados por el cliente.
- Notas **ficticias** aisladas por cuenta, almacenadas exclusivamente en memoria del proceso, para mostrar el control de acceso.
- Servidores limitados a loopback `127.0.0.1`. Puerto inicial de app 4177 e IdP 4178.
- Interfaz con CSS idéntico por SHA-256 a V11.9; cabecera visible `v11.10`.
- Baseline V11.9 completo y sin alterar incluido por separado para regresión.

## Qué no está implementado

- **No hay proveedor real**, registro verificado, passkeys reales, correo, Apple/Google, MFA real, recuperación de acceso, escalabilidad, base persistente para sesiones ni conexión a Cloudflare. La identidad del mock es fácilmente elegible y NO representa autorización pública real.
- La implementación es Node.js para laboratorio, no un Worker desplegable directamente.
- Sesiones y notas se pierden al detener el proceso. Sin Internet externo: los dos servicios se comunican por loopback.
- No integra todavía la bóveda de V11.9 ni desbloquea respaldos cifrados. Una sesión de acceso no equivale a una clave AES-GCM.
- **Jamás habilitar cuentas reales ni datos personales con este mock**.

## Política de acceso deseada en versión final

- Preferir **passkeys** y/o OIDC con proveedor que soporte login passwordless y MFA.
- No obligar al usuario a inventar una contraseña de 16 caracteres.
- Si existe alternativa de contraseña, administrarla en un IdP verificado con MFA, bloqueo de contraseñas comprometidas y recomendaciones actualizadas. NIST SP 800-63B-4 recomienda mínimo 15 para contraseña usada como único factor, y mínimo 8 cuando se usa como factor de un esquema MFA.
- Mantener separada la recuperación de la cuenta respecto de la recuperación de los datos cifrados. No prometer recuperación de datos si se pierde la clave de cifrado y no existe mecanismo de recuperación configurado.
