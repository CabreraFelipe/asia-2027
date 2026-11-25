# Cambios V11.17 vs V11.16

- Nuevo respaldo integral de ambas colecciones **ficticias** y cifradas, `encrypted_snapshots_v11` (hasta 20 revisiones) y `synthetic_journal_v115` (hasta 30).
- `web117/bundle117.js`: exporta ambas revisiones completas tras comprobar integridad AES-GCM con el código local; importa y verifica historial, propietario y formato; los snapshots heredados pueden representar restauraciones de estados anteriores, mientras que el diario exige secuencia aditiva.
- Antes de escribir cualquier colección se compara el **prefijo cifrado completo de ambas** con la nube. Ante divergencia se bloquea. CAS, verificación posterior e idempotencia preservadas; recuperaciones interrumpidas son reanudables.
- En Cuenta se agregan descargar, seleccionar, verificar y recuperar un único respaldo integral; el código no se exporta ni se guarda en D1. No incorpora borradores locales de IndexedDB, otros módulos ni datos de V10.6.
- V11.16 conserva completamente su importación individual del diario. Permanecen accesibles las rutas V11.11–V11.16, sin cambiar APIs, tablas, sesiones, cookies históricas ni CSS original.
- `src/worker1117.mjs`, ruta `/v11.17/`, marcador OAuth V11.17, versión de cabecera y status actualizada, assets sellados.
- Preflight: manifiesto de integridad, comparación byte por byte de todos los archivos heredados V11.16, pruebas y regresiones. Instalador Windows exclusivo de staging con precheck remoto V11.16 y export D1 antes de desplegar.

**No cambia producción V10.6.** No hay migración SQL. No se habilitan cuentas nuevas ni uso de información personal.

### Límites conocidos

Un archivo cifrado **no contiene código de recuperación**; sin código, no es posible descifrarlo. Los snapshots y diarios cifrados no incluyen una firma remota que asegure que alguien no haya truncado deliberadamente la cola y reconstruido un archivo consistente; solo se recuperan revisiones presentes. No se recuperan borradores locales, Health, fotos, Coach ni datos originales. Una restauración entre tablas no es una transacción atómica global: si falla en mitad, algunas revisiones nuevas pueden haberse agregado; volver a importar reanuda sin borrar. No utilizar datos personales reales, ni borrarlos para probar.
