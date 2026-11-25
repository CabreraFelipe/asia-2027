# INSTALACIÓN — ASIA 2027 V11.21

**Una entrega incluye el trabajo de V11.19, V11.20 y V11.21.** No hace falta instalar versiones intermedias.

1. Extraé TODO el ZIP en una carpeta nueva.
2. Ejecutá `INSTALAR_V11_21.cmd` desde la raíz (o `node INSTALADOR_SEGURO_V11_21.mjs` desde CMD).
3. El instalador comprueba Node 22+, la integridad, pruebas de regresión y que el Worker remoto sea **V11.17 o V11.18**, con modo staging (ambas rutas de actualización son compatibles).
4. SOLO si confirmás **S**, se exporta la base D1 de pruebas y se despliega al mismo Worker privado. No se ejecutan migraciones.
5. Al finalizar: https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev/v11.21/

**Nunca cargues datos personales, historias clínicas, nutrición real ni copias de V10.6 en staging.**

Para probar sin conexión ni desplegar: `node INSTALADOR_SEGURO_V11_21.mjs --solo-preflight`.
Para revisar estructura sin ejecutar pruebas o red: `node INSTALADOR_SEGURO_V11_21.mjs --diagnostico`.
Ante un error después de iniciar el despliegue no repitas el instalador: revisá el error sin compartir secretos.

La interfaz está más cerca visualmente de V10.6, pero **no constituye una migración completa** de funcionalidades. Revisión visual en navegador real pendiente.

## Corrección de ruta V11.21 (24/11/2026)

Se constató remotamente que el Worker seguía en V11.17 (no V11.18), aunque la entrega V11.18 había sido informada como instalada. El nuevo precheck permite ambos estados de partida, confirma la pantalla existente y exige las mismas protecciones. V11.21 incorpora el código de V11.18, por lo que no es necesario desplegarla como paso separado. El instalador exige copia D1, confirmación humana y smoke de V11.21. Si el origen es otro, no hace deploy.

**Nunca usar el enlace V11.21 antes del deploy exitoso.** Primero verificar en consola `V11.21 INSTALADA EN STAGING.` y confirmar `/v11.11/status` con `version:11.21`.

## Hotfix Windows ESM — 24/11/2026

El preflight de V11.21 fallaba en Windows al importar `precheck1121.mjs` usando una ruta absoluta `C:\...` como especificador de `import()`. El loader ESM la interpretaba como protocolo `c:` y abortaba con `ERR_UNSUPPORTED_ESM_URL_SCHEME`. Se corrigió **únicamente el test de actualización** (`tests/test_upgrade1121.mjs`) para usar `pathToFileURL(script).href`. El test sigue ejecutándose; no fue omitido. Se añadieron aserciones de URL y round-trip de ruta, y se probará también una extracción en ruta con espacios.

No hay cambios de código de Worker, activos web, datos, tablas, autenticación, configuraciones de despliegue ni permisos. El origen remoto aceptado continúa siendo solo V11.17 o V11.18.
