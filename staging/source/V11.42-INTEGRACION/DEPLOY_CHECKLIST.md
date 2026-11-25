# V11.42 — preparación del piloto aislado (solo sintético)
## Antes de desplegar
- Confirmar aprobación de CI y revisar el paquete generado por tests/build.mjs, después de los tres builders de candidato de la workflow.
- Crear un Worker, una D1 vacía y un bucket R2 **nuevos**, exclusivamente para V11.42. No reutilizar la base ni bucket de V10.6/V11.24.
- Configurar OAuth Google de pruebas con callback exacto https://asia-v1142-candidate-staging.<subdominio>.workers.dev/v11.11/auth/callback, usuarios de prueba autorizados, client ID y secreto mediante configuración segura. No poner secretos en Git. Configurar STAGING_GOOGLE_CLIENT_ID, STAGING_GOOGLE_CLIENT_SECRET, STAGING_ALLOWED_EMAILS en el Worker nuevo.
- Completar los placeholders de dist/wrangler.template.toml en una copia local. Verificar identidad de recursos y aplicar exclusivamente las migraciones del paquete dist/migrations a la base nueva vacía. No ejecutar si no se verificó el destino. Las tres flags permanecen falsas hasta inspección.
## Gate de piloto
- Habilitar solo pruebas sintéticas y verificar acceso anónimo, OAuth real, logout/revocación, manifest e instalación iOS/Android; testear caché, pérdida de red, sincronización R2 y dos cuentas.
- Si algo falla, deshabilitar flags del Worker nuevo; no borrar datos ni tocar el origen personal.
- No ingresar copias personales. Para V12.0 faltan servicios reales aislados, restauración integral de conflictos, atajos, pruebas de migración física, paridad y revisión de seguridad. No sustituir V10.6 sin copia verificada, consentimiento explícito y plan de reversión.
