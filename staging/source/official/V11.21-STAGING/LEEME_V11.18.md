# Asia 2027 V11.18 — KIT DE RESCATE CIFRADO (STAGING)

## Instalación en Windows

1. Descomprimí TODO el ZIP en una carpeta nueva (no abras el CMD dentro del ZIP).
2. Ejecutá `INSTALAR_V11_18.cmd` desde la carpeta raíz extraída.
3. El instalador usa Node 22+, comprueba hashes, código y regresiones, y verifica **por GET sin cookies** que el Worker remoto sea V11.17 y que siga aislado de producción.
4. Luego pregunta **S/N**. Solo si elegís S: exporta primero `asia-v11-db-staging` a `BACKUP_STAGING/`, despliega **únicamente** `asia-v1111-identity-staging` y hace smoke sin credenciales. No ejecuta migraciones, no toca GitHub ni V10.6.
5. Abrí https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev/v11.18/

**Ante cualquier error posterior al deploy, NO repitas el CMD hasta revisar el estado y el error.** No compartas capturas que muestren Google tokens, cookies, códigos, secretos o el contenido de los kits.

## Prueba en staging (datos inventados de enero 2026)

1. Entrá a V11.18 con la cuenta Google autorizada. Confirmá que podés visualizar el diario ficticio existente.
2. En **Cuenta → Kit de rescate cifrado** escribí el **código original V11.14–V11.17**, con 43 caracteres. Debe coincidir con el de ese usuario. Pulsá «Crear y descargar kit cifrado».
3. Se descarga el JSON. Guardá el **segundo código de rescate** mostrado en un lugar DIFERENTE del archivo. No es tu antiguo código.
4. En otro perfil de Chrome (sin clave local), entrá con la MISMA cuenta Google. Seleccioná el JSON, escribí el segundo código, pulsá «Recuperar clave con kit»; deberá validar la clave y mostrar el diario. El archivo no se sube a la nube: el navegador solo lee el archivo local.
5. Probar un código de rescate incorrecto o un archivo alterado: deben bloquearse sin afectar los datos. Otra cuenta Google también debe rechazarse.
6. Confirmá que una copia integral V11.17 sigue exportándose y que las rutas anteriores funcionan. NO vacíes la D1 remota para probar recuperación; eso se prueba con SQLite local.

**Importante:** V11.18 no rota/invalida el código original. Si ya se perdió el original antes de crear el kit, no puede confeccionarse el kit. Este entorno permite únicamente datos ficticios, no información de Salud, comidas reales o copias de V10.6.

## Validaciones offline

Dentro de `V11.18-STAGING`: `node scripts/preflight1118.mjs` (Node 22+).
