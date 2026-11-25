# Asia 2027 V11.17 — respaldo integral cifrado (STAGING)

## Cómo instalar en Windows

1. Extraer **todo el ZIP** en una carpeta nueva.
2. Ejecutar `INSTALAR_V11_17.cmd` **desde la raíz extraída**, no desde V11.16 ni dentro del ZIP.
3. Se valida íntegramente el paquete, V11.16 y sus regresiones. Luego se consulta en modo de solo lectura el Worker staging y **se exige V11.16 real**.
4. Solo si la precondición pasa, solicita consentimiento `S`. Si no, se detiene sin modificaciones.
5. Con aprobación, exporta SQL de `asia-v11-db-staging` en `BACKUP_STAGING/`, despliega `asia-v1111-identity-staging` y ejecuta smoke sin cookies. **No hace migraciones, no borra datos, no despliega GitHub Pages ni Workers personales.**
6. Abrir: https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev/v11.17/

Ante error después de confirmar, **NO reejecutar a ciegas**. Guardar captura sin claves, cookies, tokens, datos privados ni respaldos personales.

## Cómo probar — SOLO datos ficticios de enero 2026

1. Iniciar Google autorizada y recuperar el mismo código local de V11.14–V11.16. No compartirlo.
2. Abrir **Cuenta → Respaldo INTEGRAL cifrado V11.17**.
3. Pulsar **Descargar copia integral cifrada**. Descarga un JSON que integra todas las revisiones remotas de los dos conjuntos ficticios, no los borradores locales. No contiene el código de recuperación ni información sin cifrar.
4. Seleccionar ese JSON en el mismo panel. Debe mostrar el número de revisiones del historial viejo y del diario y que el archivo fue **verificado**. Seleccionar el archivo no escribe en la nube.
5. Pulsar **Recuperar revisiones faltantes** y confirmar. Si ya están todas, informa 0 recuperadas. No recrea ni duplica revisiones.
6. Probar en otro perfil Chrome **con la misma cuenta y el mismo código**, solo con datos inventados. Un archivo adulterado o de otra cuenta debe bloquearse.

**Nunca vaciar la D1 real para ensayar** la restauración desde cero: eso está cubierto en SQLite local. No ingresar Salud, nutrición personal, comidas reales, fotos, claves privadas, ni copia de V10.6 en staging.

## Propiedades de seguridad

El Worker autoriza por sesión Google existente (`account_id` del servidor), cookie HttpOnly, CSRF y Origin, escritura CAS y claves cifradas guardadas solo en el navegador. El código no viaja a Cloudflare ni se guarda en la exportación. Los dos historiales se cotejan ANTES de empezar a escribir; todas las escrituras se verifican contra ciphertext exacto.

La recuperación no es una operación indivisible entre las dos tablas. Si se corta después de una escritura válida, permanece guardada y la reanudación verifica el prefijo de ambas tablas. Una rama divergente bloquea toda recuperación. No hay importación entre cuentas, ni restauración de borradores IndexedDB, ni recuperación de clave perdida. Toda prueba se limita a datos ficticios.

## Pruebas locales

Desde la carpeta `V11.17-STAGING`: `node scripts/preflight1117.mjs` (Node 22+). Pruebas con SQLite local, Google simulado, AES-GCM real y datos inventados. El asistente no despliega en Cloudflare.
