# Asia 2027 V11.18 — Cambios frente a V11.17

**Objetivo realizado:** kit offline de rescate de la clave ORIGINAL existente. No es rotación de la clave de datos.

- Nueva sección **Cuenta → Kit de rescate cifrado V11.18**; exige la clave original para crear el kit. La valida contra la clave no extraíble que guarda este dispositivo mediante un desafío AES-GCM efímero, y comprueba el diario y snapshots cifrados remotos de la misma cuenta.
- Genera un **segundo código de rescate aleatorio de 256 bits** que no se incluye en el archivo. Cifra el código original en un archivo JSON con AES-GCM-256 y PBKDF2-SHA256 600.000 iteraciones, salt e IV aleatorios y AAD ligado a `accountId`. El código secundario se muestra una sola vez, en pantalla.
- Recuperación mediante **kit + segundo código + misma cuenta Google**; verifica integridad, propietario y compatibilidad con ambas colecciones cifradas antes de volver a almacenar la clave PBKDF2 no extraíble en IndexedDB local. No modifica ni descarga claves hacia Cloudflare.
- Rechazos ante archivo modificado, cuenta distinta, código de rescate incorrecto, JSON inválido, parámetros KDF distintos, longitud o formato incorrectos.
- Mantiene absolutamente intactas las rutas y archivos de V11.11–V11.17. No cambia migraciones SQL, APIs de escritura, cuentas, credenciales de Google, permisos ni D1. Worker `src/worker1118.mjs` sirve assets V11.18 y conserva las rutas históricas. Versión visible y status en V11.18.
- Entrega con nuevo instalador de Windows de preflight completo, precondición estricta V11.17, export D1 antes del deploy, smoke HTTP sin autenticación y manifiesto SHA-256.

## Límites y amenazas

- **NO rota la clave maestra** ni invalida el código original: todas las revisiones V11.14–V11.17 siguen cifradas con aquel código. La rotación auténtica requiere un protocolo de re-cifrado, transición de claves, tratamiento de borradores y de historiales inmutables, no autorizada ni implementada en V11.18.
- **NO recupera un código ya perdido si no existe un kit creado antes**. Para crear el kit es imprescindible recordar el código original. Si se pierde el archivo o el código de rescate y no se dispone de la clave original, no se recuperan los datos.
- El kit NO es un respaldo del diario ni reemplaza la copia cifrada integral V11.17. No incluye Health, V10.6, Coach, fotos ni datos personales.
- Kit y código deben guardarse **por separado y de forma segura**. El archivo cifrado contiene material sensible cifrado y no debe subirse a servicios públicos. No se almacena en D1.
- Requiere pruebas manuales en Chrome/Windows e iPhone. No disponible para usuarios reales: solo staging con datos ficticios.
