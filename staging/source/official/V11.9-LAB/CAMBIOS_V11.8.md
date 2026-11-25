# Cambios V11.8 (solo LAB)

- Se crea `/v118/` para evitar el choque de caché con el SW de V11.7 que controla `/web/`; no se modifican los archivos históricos de `/web/`.
- Se conserva el nombre de base IndexedDB para continuidad de datos ficticios y se preserva el CSS idéntico; nueva cabecera **v11.8**.
- Se agrega una importación local cifrada en el motor `v118/vault117.mjs`, con verificación criptográfica y validación del estado antes de una transacción atómica de tres stores.
- Se endurece exportación ante head obsoleto, borrador en conflicto o cifrado corrupto. 
- Se corrige la fecha sugerida del diario a calendario local.
- Se agrega `tests/test118.mjs`, `tests/test118_http.mjs`, `scripts/preflight118.mjs`, `scripts/serve118.mjs`, documentación de contratos, riesgos y bloqueos.
- Se incluyen módulos heredados **sin modificaciones** para regresión, más interfaz V11.7 bajo su ruta original.
- **Sin** nuevas cuentas reales, migración real, IA externa, notificaciones reales, cambios en V10.6 ni despliegues en Cloudflare.
