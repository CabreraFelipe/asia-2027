# Asia 2027 — Continuidad después de V11.18

Fecha: 24/11/2026. Base exacta V11.17 del ZIP `Asia_2027_V11.17_Respaldo_Integral_Cifrado_STAGING.zip`, incorporada como carpeta V11.17-STAGING byte a byte. El paquete V11.18 quedó listo para instalación manual; **el asistente no desplegó nada**.

## Estado seguro

- Personal V10.6 en GitHub Pages y producción Cloudflare: no se edita ni migra. Entorno nuevo `asia-v1111-identity-staging` con D1 `asia-v11-db-staging` y Google con cuentas autorizadas. Todos los datos probados son sintéticos.
- V11.14 almacena 20 snapshots cifrados; V11.15 diario sintético hasta 30 revisiones. V11.16 importa diario, V11.17 respalda/restaura ambos conjuntos (prefijo, CAS, reanudación, sin sobrescritura), V11.18 crea y abre un **kit de recuperación offline** (archivo JSON cifrado + segundo código de 43 caracteres). La clave original nunca se transmite al servidor.
- Para crear un kit de V11.18, el usuario debe conocer el código **original**; se prueba equivalencia con la clave local y datos en ambas colecciones. Para recuperar en un nuevo navegador necesita kit + código de rescate + la misma cuenta. AES-GCM, AAD, PBKDF2 600k, salt/IV aleatorios. Los datos del diario nunca se re-cifran ni modifican en el proceso.
- **No hay rotación criptográfica real**: el código original sigue siendo válido; no hay recuperación de un código previamente perdido sin kit; no se reescriben las revisiones cifradas históricas. Si se desea cambiar la clave real, primero diseñar protocolo de transición y migración auditable.
- V11.18 añade solo `web118/`, `src/assets1118.mjs`, `src/worker1118.mjs`, pruebas y scripts nuevos. `wrangler.preview.toml` apunta al Worker nuevo; el resto de archivos V11.17 son idénticos. No hay migraciones SQL ni endpoints nuevos de escritura.

## Plan V11 pendiente (sujeto a validación real)

V11.19 UX unificada multiusuario; V11.20 integración de nutrición/entrenamiento/metas ficticias; V11.21 Coach IA sin llamadas reales; V11.22 offline/sync; V11.23 privacidad/auditoría; V11.24 QA multidispositivo; posible V11.25–26 para incidencias. La rotación criptográfica real es **trabajo pendiente** y no se debe prometer una rotación segura sin compatibilidad de datos y plan de migración verificado.

La app debe conservar versión visible, look & feel y cinco pestañas al migrarse; metas personalizadas con fechas y motivación propias, conservando histórico más allá de Asia 2027. Ningún dato personal debe entrar a staging ni se debe crear una cuenta pública antes de cerrar auditorías.

## Siguiente conversación

Abrir el paquete V11.18, revisar `V11.18-STAGING/LEEME_V11.18.md`, `CAMBIOS_V11.18.md`, `scripts/preflight1118.mjs` y código; usar V11.18 como base, solicitar confirmación de instalación real y errores, e implementar una versión siguiente sin tocar V10.6 ni datos de producción. El instalador remoto requiere V11.17 exacta como precondición.
