# V11.9 — Registro de cambios

Base exacta: paquete verificado de V11.8. Se preservan **sin modificar** `web/`, `v118/` y el CSS original, así como las implementaciones y pruebas heredadas. V10.6 y producción no se incluyen ni se modifican.

- Nueva interfaz de prueba bajo `/v119/` (cabecera y manifiesto v11.9; CSS idéntico). Se mantiene `asia-v117-demo-only` para continuidad de cuentas ficticias en mismo perfil y origen.
- Nuevo archivo de **historial cifrado íntegro disponible** `asia119-demo-history-v1`: exporta todas las revisiones locales disponibles y borradores en conflicto, con catálogo autenticado AES-GCM y huella SHA-256 de las entradas. No exporta claves ni textos en claro.
- Importación validada de **todos los registros antes de cualquier escritura**, con transacción IndexedDB de cuatro stores (`accounts`, `heads`, `versions`, `drafts`). Duplicados no sobrescriben ni dejan cuentas a medio guardar.
- Una copia V11.8 que contenía solo HEAD conserva esa limitación; `historyComplete:false` marca el historial incompleto explícitamente.
- Compatibilidad para importar copias individuales V11.7/V11.8 conservada.
- `cloud-bridge119.mjs`: ensayo **offline** de AES-GCM/PBKDF2 con el formato de sobre D1 `asia84-encrypted-v1`, con payload `asia119-lab-cloud-bridge-v1` inequívoco; no hay subida a la nube ni identidad real.
- `serve119.mjs`: servidor sin escritura HTTP y escuchando solo en `127.0.0.1`; ruta versionada evita caché de Service Worker antiguo.
- `preflight119.mjs`, tests de tampering, privacidad, conflictos, regresiones, contrato del servidor, inventario de brechas.

**No se habilita beta V12.0.** Para cuentas humanas todavía hacen falta proveedor de identidad real, recuperación de claves, integración con almacenamiento remoto protegido y migración de todos los orígenes V10.6.
