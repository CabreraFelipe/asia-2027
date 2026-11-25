# Asia 2027 — estado tras V11.16

**Fecha:** 24/11/2026. **Base de código:** ZIP V11.15 exacto, preservado en la carpeta histórica `V11.15-STAGING`.

- **Producción:** V10.6 personal en GitHub Pages. NO fue modificada; tampoco Workers `asia-2027-ai`, `asia-2027-rest` ni D1 personal.
- **Staging:** Worker `asia-v1111-identity-staging`, D1 `asia-v11-db-staging`, Google OAuth autorizadas, sin registro público ni Salud. No usar datos reales.
- **V11.15:** diario estructurado ficticio con AES-GCM, por cuenta Google, CAS, borradores cifrados, exportación de historial.
- **V11.16:** validación de copia V11.15 y recuperación segura de revisiones faltantes del diario ficticio a la **misma cuenta**; validación criptográfica de 1..N, no sobrescritura, no fusión destructiva, idempotencia y reanudación tras cortes. No importa códigos de recuperación ni migra entre usuarios.
- **Código de cifrado:** independiente de Google y fuera del servidor. Sin el código o navegador que conserve la clave, las copias continúan indescifrables.
- **Integración:** ruta `/v11.16/` y Worker `src/worker1116.mjs`. Reutiliza sin cambios API `/v11.15/data/journal` y migraciones D1 anteriores. CSS original V10.6 intacto, cabecera V11.16.
- **Instalación:** ZIP con `INSTALAR_V11_16.cmd`; verifica V11.15 remoto antes de desplegar, hace backup D1 staging y smoke; entrega manual. No se desplegó por el asistente.
- **Pruebas:** el preflight local recorrió V11.9–V11.15 y 124 nuevos casos V11.16 con SQLite local + Google simulado, verificó 53 hashes y 42 archivos heredados idénticos. Prueba visual completa con sesión real o en iPhone **pendiente**.

## Siguiente fase sugerida (no se ha aprobado aún)

V11.17: cierre de recuperación completa de todos los módulos *sintéticos* y verificación de continuidad cruzada. Antes de migrar V10.6 o abrir a terceros, faltan recuperación de código perdido, auditoría independiente, pruebas físicas iPhone/Android, políticas de datos/consentimiento y migración reversible del historial real. Evitar habilitar datos reales hasta superar esas compuertas.

## Reglas permanentes

No reemplazar la app personal por la página técnica staging; cinco pestañas Inicio/Dieta/Gym/Salud/Progreso y estética original, preferencias y CSS. Múltiples objetivos con fecha y motivo para uso después del 08/03/2027, preservando Asia 2027 como primera meta. Versión visible y coherente con entrega y código. Entregar ZIP y pruebas sin desplegar ni resetear sin autorización.
