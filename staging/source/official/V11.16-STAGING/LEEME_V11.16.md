# Asia 2027 V11.16 — restauración verificable del diario cifrado (SOLO STAGING)

**Fecha:** 24/11/2026. **Origen exacto:** V11.15. **Producción V10.6 permanece intacta.**

## Instalación Windows

1. Extraé **todo** el ZIP en una carpeta NUEVA; no ejecutes nada desde el ZIP comprimido.
2. En la raíz de la carpeta extraída, ejecutá `INSTALAR_V11_16.cmd` con doble clic. No entres directamente a la subcarpeta `V11.16-STAGING` para ejecutar un instalador viejo.
3. Ejecutará pruebas locales de V11.9 a V11.16 y verificará en modo **solo lectura** que Cloudflare staging actualmente es **V11.15**.
4. Si no confirma V11.15, se detiene **sin desplegar**: no fuerces la actualización. Si confirma y las pruebas pasan, solicita `S` explícita.
5. Tras confirmar, realiza export SQL de D1 **staging** en `BACKUP_STAGING/` y despliega **únicamente** Worker `asia-v1111-identity-staging` apuntando a la base existente `asia-v11-db-staging`. **NO ejecuta migraciones de D1**, no elimina tablas ni toca cuentas, claves o sesiones.
6. Hace smoke de 10 rutas HTTP sin cookies. Al terminar, abrir `https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev/v11.16/`.

Si ocurre cualquier error **después de confirmar**, NO vuelvas a ejecutar el instalador sin revisar. Conservá una captura de la ventana sin cookies, claves ni información sensible.

## Qué aporta V11.16

La V11.15 podía descargar todas las revisiones del diario cifrado pero no reimportarlas. Esta versión permite **validar y restaurar el archivo descargado desde V11.15 o V11.16** en la **misma cuenta Google autorizada**, sin hacer un traslado entre cuentas y sin entregar la clave a Cloudflare.

1. En **Cuenta**, inicia sesión con Google autorizado y recupera tu código de cifrado existente. Debe ser el mismo que usaste al crear el archivo.
2. En **Historial cifrado**, descargá una copia del diario ficticio si aún no la tenés.
3. En **Importar y recuperar copia cifrada**, seleccioná el `.json` correspondiente a la misma cuenta.
4. Se verifica en el **navegador** el formato, tamaño, 30 revisiones máximo, propietario criptográfico, código, autenticidad AES-GCM de cada sobre y que las revisiones sean consecutivas y aditivas.
5. Se muestra una **vista previa** de número de revisiones, días de alimentación y sesiones de entrenamiento ficticios. **Importar un archivo no escribe nada automáticamente.**
6. Si presionás **Recuperar solo revisiones faltantes**, aparece una confirmación; solo se insertan revisiones que la nube todavía no tiene si su historia es un **prefijo idéntico** de la copia. No se reemplazan filas ni se aplica un merge destructivo.
7. Si se interrumpe el proceso, volvé a seleccionar el mismo archivo. La continuación verifica cada revisión ya cargada y conserva las restantes. Si existe alguna divergencia, la recuperación **se bloquea sin borrar nada**.

**El archivo JSON NO contiene el código de recuperación.** Si se pierde el código y no queda ningún navegador con clave, este mecanismo no puede descifrar el respaldo. Un archivo cifrado no sustituye una copia segura e independiente del código. No compartas el código con el asistente.

## Ejercicios de prueba recomendados

- Una misma cuenta y código: importar en el mismo navegador un respaldo ya guardado: debe indicar **ya restaurado**, con 0 escrituras nuevas.
- Otro perfil de Chrome, la **misma** cuenta y código: verificar la importación y la detección de revisiones ya existentes.
- Un archivo modificado, recortado o de otra cuenta: tiene que rechazarse **antes** de permitir la escritura.
- Un archivo con nube divergente: bloquear y no sobrescribir.
- No simular un borrado de la D1 remota para probar restauración. **Los casos de nube vacía, cortes y divergencias ya están cubiertos por pruebas automáticas con SQLite local ficticio.**

## Restricciones críticas

- **EXCLUSIVAMENTE datos ficticios de enero de 2026.** No ingresar datos personales, Salud, rutinas reales, fotos, comidas reales ni respaldos de V10.6.
- Solamente las cuentas Google ya autorizadas. No hay registro público ni transferencias entre cuentas.
- Mantiene **la misma D1, API `/v11.15/data/journal`, esquema SQL, control CAS y todos los endpoints V11.11–V11.15**. No modifica `encrypted_snapshots_v11` ni el código de recuperación.
- No es todavía una solución completa de backup de toda Asia 2027 ni una recuperación de cuenta Google perdida: restaura solo el diario sintético V11.15.
- Los 30 sobres están validados por AES-GCM; no hay un sello externo de completitud histórica. Una copia recortada a un prefijo válido puede aparecer como un archivo más corto. Por eso no se promete verificar que no se haya omitido una cola histórica.
- Si dos dispositivos tienen revisiones cifradas diferentes, no se fusionan: el usuario debe conservar ambos archivos y revisar el conflicto. La preservación prima sobre la automatización.
- Ante falla tras restaurar algunas revisiones, se conservan las ya escritas: la operación no es transacción todo-o-nada. Reimportar es seguro si la nube mantiene el prefijo cifrado exacto.

## Validación y trazabilidad

Ejecutar manualmente sin despliegue: `node V11.16-STAGING/scripts/preflight1116.mjs` desde la raíz del paquete (requiere Node 22+ con SQLite integrado). Las pruebas usan OAuth Google simulado, D1 SQLite real **local** y datos ficticios; no hay peticiones reales de autenticación ni modificaciones en Cloudflare en el preflight. El instalador sí utiliza la red para comprobar staging, respaldar y desplegar **solo después de pedir permiso**.

Paquete creado como etapa V11.16 con CSS original de V10.6 byte a byte, versión visible y nuevo archivo de recursos aparte. Toda producción personal V10.6 está fuera del paquete.
