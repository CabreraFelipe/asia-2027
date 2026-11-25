# Cambios V11.15

- **Integración de dominio:** nuevos formularios de alimentación y entrenamiento con campos del diario V10.6, restringidos a opciones ficticias.
- **Persistencia separada:** `synthetic_journal_v115` agrega máximo 30 revisiones por cuenta; la antigua `encrypted_snapshots_v11` no se cambia.
- **Criptografía:** AES-GCM con AAD específica `asia-v1115-synthetic-domain-v1` y propietario de cuenta; comparte la familia de códigos de recuperación pero no el formato de contenido de V11.14.
- **Controles de escritura:** cuenta desde sesión validada, rechazo de Origin/CSRF incorrectos, límite de tamaño, control atómico de revisiones y protección contra accesos cruzados.
- **Borradores cifrados:** IndexedDB antes de cada escritura; persistencia ante cortes; conflicto conservado sin sobrescritura automática de la misma fecha/categoría.
- **Frontend:** CSS original V10.6 preservado byte por byte; nuevas vistas bajo `/v11.15/`; versión visible en la cabecera.
- **Migración:** `0007_synthetic_journal_v115.sql` aditiva, exclusiva de staging, respaldada antes del despliegue.
- **Despliegue Windows:** `INSTALAR_V11_15.cmd` en raíz, `call npx.cmd`, pausa visible y smoke HTTP de solo lectura.

## Pendientes imprescindibles antes de beta real

Autenticación y autorización de usuarios no inscritos en staging; recuperación de claves; sincronización persistente de todos los módulos originales; migración de datos V10.6 completa y reversible; auditoría externa de seguridad y privacidad; pruebas con distintos dispositivos reales. Esta entrega no permite guardar información personal.
