# Identidad real — especificación pendiente antes de V12.0

Este archivo es una **decisión de arquitectura, no una implementación de login real**. El laboratorio actual usa cuentas ficticias y claves de prueba. No convertir estos identificadores `demo_*` en usuarios de producción.

### Requisitos mínimos a implementar y probar

1. Proveedor de identidad con sesiones verificadas en el servidor; código de autorización con PKCE si aplica. Jamás confiar en `accountId` procedente de un cuerpo, query o cabecera del cliente.
2. En el backend: validar firma, `iss`, `aud`, expiración, no-antes, identificador de sesión y política de revocación. Usar identidad canónica **derivada del token verificado**, no del navegador.
3. Sesiones por dispositivo, revocación completa y cierre remoto; rate-limits por origen, cuenta y sesión, no solo globales.
4. Recuperación de acceso, rotación de credenciales, protección contra enumeración y guía de MFA. Definir explícitamente qué sucede si el usuario olvida su **clave de cifrado cliente**: un reset de contraseña de acceso no recupera automáticamente AES-GCM.
5. Prueba en Cloudflare **staging aislado** y test de usuario A intentando leer/escribir/copiar/eliminar del B, con evidencia de denegación por cada ruta.
6. Logs minimizados, sin tokens, frases, mediciones ni payloads cifrados completos; almacenamiento y eliminación verificable, revisión legal de privacidad.
7. Bloqueo global de importación de datos reales hasta verificar los puntos anteriores y un procedimiento de reversión.

**Compuerta V12.0:** permanece **NO APROBADA**. Un éxito de las pruebas offline de V11.9 no cambia este estado.
