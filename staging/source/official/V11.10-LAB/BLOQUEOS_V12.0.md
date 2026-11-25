# Bloqueos hacia V12.0 después de V11.10

| Compromiso | Estado y trabajo pendiente |
|---|---|
| Acceso sin contraseña obligatoria de 16 caracteres | **Decisión UX adoptada.** Demo local sin password; falta implementar passkeys/OIDC con proveedor real. |
| OIDC PKCE, firma y sesión de servidor | **Probado solamente en mock local**. Se necesita adapter para Cloudflare, descubrimiento de metadata/JWKS del IdP real, HTTPS, sesiones persistentes y auditadas. |
| Registro, verificación de correo, recuperación, MFA | **Pendiente**. Selección de proveedor (Auth0, Clerk, Supabase Auth u otro) y configuración del tenant, dominios y consentimientos con autorización del operador. |
| Claves de cifrado de bóveda | **Pendiente crítico**. No utilizar la cuenta OIDC como una clave AES; diseñar recuperación/rotación sin acceso del servidor al texto claro. |
| Aislamiento end-to-end real | **Pendiente**. Vincular sub firmado a D1 real y ejecutar pruebas cross-account en staging sin secretos de operador rotados innecesariamente. |
| Persistencia y dispositivos | **Pendiente**. Store durable para sesión/refresh, revocación multidispositivo, control de origen y límites operativos. |
| Migración V10.6 / Salud / historial | **Pendiente**. Backups completos y reversibilidad probada con consentimiento explícito antes de mover datos reales. |
| Revisión independiente / privacidad | **Pendiente**. Hardening, rate limits distribuidos, pentest, eliminación/retención y política de logs. |

**Compuerta V12.0:** NO APROBADA PARA DATOS REALES.

**Diseño:** `V11.10-LAB/web/styles.css` es una copia byte a byte de `V11.9-LAB/v119/styles.css`. Este demo de identidad NO sustituye el diseño ni los datos de V10.6.

Fuentes: NIST SP 800-63B-4 https://pages.nist.gov/800-63-4/sp800-63b/authenticators/ ; OAuth Security BCP RFC 9700 https://www.rfc-editor.org/rfc/rfc9700.html .
