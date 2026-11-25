# Asia Platform — V11.13, continuidad y recuperación en staging

**No es la aplicación personal V10.6 ni una beta pública. NO usar datos personales.**

Se trabaja exclusivamente sobre `asia-v1111-identity-staging` + `asia-v11-db-staging`. La interfaz sigue utilizando el **mismo CSS byte por byte**. El acceso Google real y los secretos instalados en V11.11 se reutilizan. No hay nuevas migraciones ni cambios de secretos. Los datos ficticios de V11.12 siguen accesibles en V11.13 con el mismo código de recuperación de 43 caracteres (no es una contraseña de acceso).

## Instalación recomendada en Windows — mínima

1. Descomprimí **todo** el ZIP en una carpeta nueva.
2. Hacé doble clic en `INSTALAR_V11_13.cmd` (situado al mismo nivel que las carpetas `V11.13-STAGING`, `V11.12-STAGING`, etc.). El archivo usa su propia ubicación: **no necesitás navegar con PowerShell**. Ejecuta las pruebas completas; si pasan, te pide confirmar con `S` el despliegue exclusivamente de staging y después realiza una verificación HTTP de solo lectura.
3. Abrí <https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev/v11.13/>. Usá tu Google autorizado y **solo actividades ficticias**. Comprobá que tus actividades de V11.12 siguen ahí.

Alternativa si Windows bloquea el archivo `.cmd`: abrí PowerShell **dentro** de `V11.13-STAGING` y ejecutá:

```powershell
node scripts/preflight1113.mjs
if ($LASTEXITCODE -eq 0) {
  npx.cmd --yes wrangler@4.165.0 deploy --config wrangler.safety.toml
  if ($LASTEXITCODE -eq 0) { node scripts/smoke1113.mjs }
}
```

No ejecutar `wrangler d1 migrations apply`, `wrangler secret put` ni desplegar Workers de producción.

## Novedades concretas

- **Borrador cifrado persistente:** antes del POST a D1 se guarda en IndexedDB un borrador cifrado con el estado anterior. Si se pierde la red o el navegador se recarga, el borrador reaparece (si la clave local continúa disponible).
- **Conflictos sin pérdidas silenciosas:** se puede comprobar si la operación fue guardada a pesar de perderse la respuesta. Si no, se fusionan automáticamente **solo** actividades ficticias añadidas de forma compatible, con versión condicional en D1; nunca se fusionan restauraciones ni cambios que eliminaron registros.
- **Restauración no destructiva:** seleccionar una revisión antigua crea una revisión nueva. Las anteriores permanecen en D1.
- **Exportación cifrada:** descarga un archivo JSON con todas las revisiones presentes (hasta 20), después de comprobar que son descifrables. **No incluye ni el código de recuperación ni datos en claro.** Por ahora es un archivo de resguardo/verificación; **la importación del archivo no está implementada** y NO sustituye el sistema de recuperación del lanzamiento.
- **Límite de 20 revisiones:** se informa antes de agotarlo; no hay borrado automático de historial.
- **Compatibilidad:** se mantiene la interfaz V11.12 en `/v11.12/`; al iniciar sesión con Google se abre V11.13.

## Prueba manual sugerida (cuentas ficticias)

1. Iniciar con la misma Google y el mismo navegador de V11.12; comprobar que se conservan las actividades existentes.
2. Agregar dos actividades ficticias y usar **Descargar historial cifrado**. No compartir el archivo ni el código de recuperación.
3. Usar **Restaurar revisión** y comprobar que se agrega una revisión nueva, sin eliminar las anteriores.
4. Abrir dos pestañas; guardar una actividad en una y otra desde la pestaña desactualizada. Debe aparecer un borrador pendiente. Pulsar **Verificar y resolver sin sobrescribir**; deberían conservarse ambos registros o informarse el motivo del bloqueo.
5. Recargar la pestaña que tenga un borrador pendiente y comprobar que sigue disponible. No probar con datos de Salud ni con información personal.

## Limitaciones antes de V12.0

Todavía faltan una UX integrada con la aplicación V10.6, recuperación de claves apta para usuarios, importación/recuperación verificable del archivo exportado, revisión externa de seguridad, procedimientos de privacidad y continuidad, soporte de Apple/Android y políticas para borrar cuentas/datos. La autenticación de Google en staging no convierte la PWA original en multiusuario.

## Reversión

Sin alterar D1 ni borrar revisiones, se puede volver al Worker V11.12 mediante su configuración anterior `V11.12-STAGING/wrangler.integrated.toml` desde esa carpeta. Los borradores locales V11.13 permanecen en el navegador, aunque V11.12 no los muestra. Conservar una copia del ZIP anterior. No usar respaldos SQL de staging como sustituto de exportar una copia cifrada.
