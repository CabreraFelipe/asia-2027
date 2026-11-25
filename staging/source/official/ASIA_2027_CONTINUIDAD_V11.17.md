# ASIA 2027 — CONTINUIDAD DESPUÉS DE V11.17

Fecha: 24/11/2026. Base exacta V11.16 y sus históricos empaquetados. V11.17 está lista para instalar MANUALMENTE en Cloudflare staging; **sin despliegue ejecutado desde el asistente**. La confirmación del usuario de «Actualizado» se refiere a V11.16 (no implica pruebas de UX completas).

## Estado confirmado
- V10.6 personal sigue en GitHub Pages y en sus Workers/D1 originales; permanece intocada. No mezclar fuentes ni claves.
- V11.11–V11.17: Worker staging `asia-v1111-identity-staging`, Google para cuentas autorizadas, sesiones en D1 `asia-v11-db-staging`, sin registro público.
- V11.14 snapshots sintéticos cifrados, hasta 20 revisiones por cuenta; V11.15 diario alimentación/Gym **ficticio**, hasta 30 revisiones; V11.16 recuperación de solo diario; V11.17 copia y recuperación integral de ambas colecciones sintéticas en un mismo archivo.
- V11.17 importa solo a la MISMA cuenta Google y con el mismo código AES. Verifica todas las revisiones. Compara prefijos de AMBAS colecciones antes de restaurar, no reemplaza ramas, reanuda cortes, CAS y validaciones por revisión. Sin migraciones SQL. Los borradores cifrados locales no se incluyen.
- Es requisito mantener la versión visible, estética original con 5 pestañas al integrarse en producción, metas independientes postviaje, y no abrir Salud ni cuentas públicas antes de auditorías/migración consentida.

## Próximas etapas propuestas (no prometer fecha)
V11.18 rotación/recuperación de claves sin pérdida; V11.19 experiencia unificada; V11.20 nutrición, gym, metas sobre cuentas sintéticas; V11.21 Coach IA sin coste real; V11.22 conflictos/offline; V11.23 auditoría/privacidad; V11.24 QA multidispositivo y ensayo de migración; parches adicionales V11.25–11.26 según hallazgos. Se estiman 7–9 actualizaciones a partir de V11.17; el cierre V11 no autoriza automáticamente V12 con personas reales.

## Compuertas
- Mantener V10.6 personal y respaldos sin cambios.
- Probar UI real en Chrome Windows e iPhone, incluyendo sesión y mismo código en distintos perfiles.
- Probar recuperación de clave perdida, borrar/exportar cuenta, privacidad/consentimiento, auditoría independiente, rollback integral de V10.6, funcionalidades completas y costes antes de V12.
- Leer `V11.17-STAGING/LEEME_V11.17.md`, `CAMBIOS_V11.17.md` y código, y comparar Worker desplegado antes de modificar Cloudflare.
