# Cambios V11.16 vs. V11.15

- Nuevo `web116/archive116.js`: validador de archivos V11.15, AES-GCM y revisiones 1..N aditivas; restauración no destructiva, reanudación y comprobación de prefijos exactamente idénticos.
- Nuevo `web116/app.js`: selector de archivo en Cuenta, resumen ficticio, confirmación explícita y mensajes de recuperación o bloqueo.
- Nueva pantalla `/v11.16/` con barra V11.16; original `asia106-original.css` byte por byte, estilos únicamente suplementarios `stage116.css`.
- Nuevo `src/worker1116.mjs` y assets `src/assets1116.mjs`: sirven V11.16 con CSP, origen staging y `__Host-asia1116_return`; OAuth/cookies/sesiones viejos intactos. `status` indica V11.16.
- **Sin cambios de API D1 ni migraciones**. Reutiliza CAS de V11.15 y verificación de Google por sesión.
- `tests/test1116.mjs`: 124 comprobaciones adicionales; recuperación completa e interrumpida en SQLite real local, cuenta ajena, rollback, divergencia, corrupción, CSRF, OAuth simulado.
- `scripts/preflight1116.mjs` comprueba hashes de todos los archivos, fuente V11.15 original, CSS original, tests anteriores y destino staging exacto.
- `INSTALAR_V11_16.cmd`: preflight, confirmación de V11.15 remota, consentimiento, respaldo de D1 staging, deploy Worker, smoke; no actualiza GitHub Pages ni Workers productivos.

## Pendiente

Auditoría externa de seguridad antes de datos personales; migración completa de la PWA V10.6 con rollback real; recuperación de clave de cifrado frente a pérdida; diseño completo y Coach multiusuario, Android, Apple Health, notificaciones, servicios y costes; prueba manual en iPhone/Chrome con staging y datos ficticios. **No habilitar beta real.**
