# Auditoría de preparación — Asia Platform V11.9

Alcance: código **local** contenido en el ZIP; pruebas offline de historia completa, importación cifrada y compatibilidad del sobre aceptado por D1. No hay pentest, certificación, despliegue remoto, autenticación pública ni uso de datos personales.

| Puerta previa a V12.0 | Estado tras V11.9 | Evidencia / siguiente trabajo |
|---|---|---|
| G01 Identidad real | **ABIERTO, CRÍTICO** | Solo claves sintéticas; contrato `CONTRATO_IDENTIDAD_V11.9.md`; implementar proveedor externo y sesiones servidor |
| G02 Formato y claves | **PARCIAL, CRÍTICO** | Puente offline al sobre D1 `asia84-encrypted-v1` verificado; falta esquema canónico de backend, claves por cuenta, rotación y recuperación |
| G03 Sincronización física | **ABIERTO, ALTO** | CAS y borradores solo offline; falta cola persistente, transporte autenticado y pruebas con dos dispositivos reales |
| G04 Migración V10.6+D1 Salud | **ABIERTO, ALTO** | Ensayo V11.3 con datos sintéticos; falta exportación real de Salud D1, validación y reversión |
| G05 Token operador staging | **ABIERTO, ALTO** | Última rotación generó 401; falta prueba **solo lectura** sin rotar secretos antes de cualquier nuevo despliegue |
| G06 Privacidad y eliminación | **ABIERTO, ALTO** | Falta política y prueba de retención/eliminación, consentimiento, registros mínimos |
| G07 Safari/Android/desktop | **ABIERTO, ALTO** | Interfaz local validada por usuario; pendiente matriz de dispositivos y fallos de almacenamiento |
| G08 Health/push reales | **ABIERTO, ALTO** | Simulados en V11.6, sin integración de sistemas operativos ni push real |
| G09 Historial portable | **MEJORADO EN LABORATORIO** | Export/import de todas las revisiones disponibles y borradores con catálogo autenticado; legacy solo HEAD no puede recuperarse |
| G10 Origen local | **ABIERTO, MEDIO** | IndexedDB del mismo origen no es aislamiento contra scripts maliciosos o extensiones, ni autenticación pública |
| G11 Backend D1 Coach/Salud | **ABIERTO, ALTO** | Falta ejecutar pruebas reales y migraciones `0004`/`0005` en staging controlado |

**Conclusión: V11.9 aprobable solo como laboratorio local. V12.0 beta con datos humanos NO AUTORIZADA.** El cierre de G09 y el puente técnico G02 no sustituyen el cierre de G01/G02/G03.

## Preservación estética y datos

- V11.9 copia exactamente el CSS de V11.8, que ya era idéntico al de V11.7.
- No se modifican ni empaquetan los recursos de V10.6 ni sus Workers.
- `v118/` y `web/` históricos se conservan byte a byte.
- El nombre IndexedDB para **cuentas de laboratorio** permanece igual en el mismo origen, para continuar pruebas previas.

## Verificaciones

- Hashes SHA-256 del paquete, sintaxis, tests V11.0..V11.9, contratos HTTP de loopback.
- AES-GCM con contenido alterado, frase equivocada, versiones ausentes, duplicados, borradores y restablecimiento no destructivo.
- La automatización de Chromium no pudo navegar al servidor local por una política del entorno; la comprobación visual sigue correspondiendo al usuario.
