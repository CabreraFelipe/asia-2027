# Registro de alcance y verificación V11.13

- **Aislamiento:** Worker `asia-v1111-identity-staging`; D1 `asia-v11-db-staging`; staging marker obligatorio; OAuth y cookies existentes. Ningún código de producción instalado.
- **Integridad:** el navegador descifra cada sobre antes de exportar. El archivo contiene SHA-256 de los metadatos y sobres cifrados, pero NO existe todavía una importación final probada. El código de recuperación no se envía ni se exporta.
- **Concurrencia:** la API usa la revisión esperada y responde HTTP 409; la UX almacena cifrado el borrador antes de escribir; una petición fallida no reintenta a ciegas. La fusión de actividad es append-only y valida propietario, IDs, tipos, límites y que se conserve la base.
- **Restauración:** se realiza como una escritura nueva con versión condicional; si el remoto cambió, requiere intervención. Todas las revisiones anteriores quedan disponibles hasta el límite del laboratorio.
- **Privacidad:** solo actividades ficticias predefinidas; el login Google real se limita a cuentas autorizadas. No almacenar claves de recuperación en logs, archivos de respaldo ni en D1.
- **Estética:** CSS idéntico al de V11.9/V11.12; header visible de la demo actualizado a V11.13; V10.6 no se modifica.
- **Antes de V12.0:** faltan identidad de múltiples proveedores o política de identidad adecuada, recuperación y rotación de claves, exportación/importación verificable, migración reversible de todos los datos de V10.6, audit de XSS, protección contra pérdida de dispositivos, borrado de datos conforme privacidad, QA en iOS/Android, términos y consentimiento y revisión legal de datos sensibles.

**Una prueba offline o de solo lectura no sustituye una auditoría independiente ni un test de sincronización real.**
