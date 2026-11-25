# Asia 2027 V11.15 — Diario estructurado, cifrado y aislado por cuenta (STAGING)

## Instalación: un archivo en Windows

1. Extraé **todo** el ZIP en una carpeta nueva, sin mezclar instalaciones.
2. Hacé doble clic en `INSTALAR_V11_15.cmd`, ubicado **en la raíz del ZIP** (afuera de `V11.15-STAGING`).
3. El instalador comprueba hashes, prueba toda la versión anterior y los módulos nuevos. Si todo pasa, pregunta si querés actualizar *exclusivamente* staging. Confirmá **S** solo si la base es `asia-v11-db-staging` y el Worker `asia-v1111-identity-staging`.
4. El instalador guarda un respaldo SQL de **staging** en `BACKUP_STAGING/`, aplica **una migración nueva** `0007_synthetic_journal_v115.sql`, despliega ese Worker y verifica nueve rutas HTTP de solo lectura. **La ventana permanece abierta** hasta que presiones una tecla.
5. Entrá en `https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev/v11.15/`.

**Si falla una etapa, NO vuelvas a ejecutar la instalación:** guardá la pantalla completa (ocultando cualquier dato sensible) y revisamos el punto preciso.

## Qué permite probar

- Google real (OIDC ya configurado) con sesión verificada por el servidor.
- Campos **tomados de V10.6**, con ejemplos estructurados: cumplimiento del plan, pasos y energía / 5; rutina y cardio (minutos, velocidad, inclinación, esfuerzo).
- Solamente registros de ejemplo de **enero de 2026**, sin notas libres ni fotografías, para desalentar el uso de datos personales. El formulario se limita a opciones predefinidas y validadas antes del cifrado. **El servidor no puede inspeccionar el contenido cifrado para asegurar que sea ficticio**; no uses información real en staging.
- Un diario **nuevo** en D1 `synthetic_journal_v115`, separado por `account_id` derivado de Google y protegido con cookies HttpOnly + CSRF + Origin. Cada revisión contiene solo un sobre cifrado AES-GCM (clave de recuperación solo en el navegador).
- Dos perfiles de Chrome pueden leer el mismo diario con la misma cuenta Google y el mismo código de recuperación.
- Los conflictos de revisión se detectan. Antes de subir un nuevo estado se guarda un borrador cifrado en IndexedDB; si hay un fallo o conflicto, permanece recuperable.
- Backup de las revisiones cifradas para descarga local. **La descarga no incluye la clave**. Importar ese archivo en una cuenta nueva todavía NO está implementado.
- El CSS extraído de V10.6 permanece intacto, en archivo separado; la barra superior muestra V11.15.

## Compatibilidad y limitaciones

- V11.12, V11.13 y V11.14 conservan todos sus endpoints y la tabla `encrypted_snapshots_v11` **no se migra ni se modifica**. Por eso el diario nuevo comienza vacío, aunque haya actividades ficticias de versiones anteriores.
- Para **compartir la clave de cifrado** con tu navegador V11.14, V11.15 reutiliza su almacén de IndexedDB. Si ya tenés un código en V11.14, no crees otro: iniciá sesión con el mismo perfil o importá ese código primero.
- No es todavía el diario original completo de V10.6: son campos y validaciones equivalentes para un primer recorrido real Google → formulario → cifrado → D1 → recuperación. No incluye el Coach IA, Apple Salud, análisis nutricional, rutinas detalladas o registros médicos.
- No ingreses datos personales, Salud real, fotos, notas privadas ni respaldos de V10.6. Staging usa cuentas Google autorizadas y valores sintéticos.
- Máximo **30 revisiones** y **40 registros** por cuenta en el diario nuevo. Si se agota el límite, preservá las copias y no las borres a ciegas.
- Sin contraseñas obligatorias para iniciar sesión; **sí** hay un código de recuperación criptográfico para el cifrado. Si se pierde en todos los dispositivos, no podemos descifrar las copias.
- Esta versión modifica SOLO `asia-v1111-identity-staging` y la base `asia-v11-db-staging` (tabla nueva). **No toca producción V10.6**, los Workers `asia-2027-ai` / `asia-2027-rest` ni `asia2027db`.

## Prueba rápida de usuario

1. Abrí V11.15 en Chrome con tu cuenta Google autorizada. En **Cuenta**, comprobá que se conserva la clave anterior, o importá el código de V11.14; si no hay copias previas, generá uno nuevo.
2. En **Alimentación**, elegí un día de enero de 2026 y registrá un ejemplo; después en **Entrenamiento**, guardá otro día ficticio.
3. Recargá la página y comprobá que persisten las dos entradas.
4. En un segundo perfil de Chrome, entrá con la misma cuenta Google y el mismo código: los dos registros deberían reaparecer.
5. No compartas conmigo el código, cookies, sesión ni URL completa de callback OAuth. Basta informar «funciona» o el error mostrado.

## Restauración del Worker

La migración es **aditiva**: agrega una tabla nueva y no transforma los respaldos anteriores. Si falla el nuevo frontend, los endpoints V11.14 siguen disponibles. No borres la tabla o la base sin revisar el respaldo de staging creado por el instalador.
