# Asia 2027 — V11.14 · Primera integración visual y funcional (staging)

## Instalación en Windows: un solo archivo

1. Extraé **todo** el ZIP en una carpeta nueva. No mezcles archivos con instalaciones previas.
2. Hacé doble clic en `INSTALAR_V11_14.cmd`, ubicado en la raíz.
3. El instalador verifica los archivos y ejecuta regresiones offline. Si todo pasa, pide confirmar con **S**. Si se confirma, actualiza **únicamente** el Worker `asia-v1111-identity-staging`; después verifica seis URL sin cookies.
4. Abrí en Chrome `https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev/v11.14/`.

La ventana permanece abierta al final, incluso si Wrangler falla: **usa `call npx.cmd`**, para evitar el error de V11.13.

## Qué funciona realmente

- Google OAuth real (infraestructura previamente validada, sin necesidad de contraseña propia).
- Acceso a copias cifradas de las cuentas de prueba de V11.12 y V11.13 sin migrarlas ni borrarlas.
- Un primer tablero funcional con categorías de alimentación, entrenamiento, caminatas y descanso **ficticias**, control de revisiones, conflictos, recuperación y descarga cifrada.
- Estilo original del `index.html` V10.6: el contenido del bloque `<style>` se copió **sin modificar un byte** a `web114/asia106-original.css`. Los ajustes especiales para staging están separados en `web114/stage114.css`.
- En Chrome nuevo se crea correctamente la base IndexedDB `asia-v1112-demo-keys` con el almacén `account_keys`; los perfiles existentes conservan sus claves sin ser reinstalados.

## Qué NO funciona todavía

- No es la PWA V10.6 completa. Los módulos de Coaching, Health, planes, macros, gimnasio y notificaciones originales **no están conectados ni desplegados**.
- No se importan ni copian registros reales; las únicas entradas aceptadas siguen siendo las cuatro categorías sintéticas de V11.12.
- La clave aleatoria de recuperación no es una contraseña de cuenta y debe conservarse para descifrar datos en un navegador nuevo. No existe recuperación real en caso de perderla en todos los dispositivos.
- No es una beta pública ni apta para almacenar datos personales o de Salud.
- El botón de Google de V11.14 usa una cookie temporal `HttpOnly` de destino fijo: tras iniciar sesión se vuelve automáticamente a `/v11.14/`, manteniendo las comprobaciones OAuth de V11.11d.

## Salvaguardas de despliegue

- Configuración idéntica a V11.13 salvo `main = "src/worker1114.mjs"`. El nombre del Worker y la base siguen siendo exclusivamente staging.
- Sin migraciones, secretos ni cambios de producción.
- Los endpoints `/v11.11/`, `/v11.12/` y `/v11.13/` conservan su comportamiento anterior.
- La API sólo acepta datos sintéticos, el `accountId` de la sesión verificada y la comprobación CSRF.
- Los archivos de pruebas se validan con SHA-256 antes de cualquier despliegue. No se rechaza un ZIP extra presente en la carpeta.

## Si surge algún error

No repitas el despliegue. La ventana del instalador muestra si falló el preflight, la actualización de Cloudflare o la comprobación HTTP de solo lectura. Compartí una captura ocultando cookies, códigos de recuperación y secretos.

## Fuente del diseño

CSS extraído del `index.html` incluido en `Asia_2027_V10.6_GitHub.zip`, SHA-256 del HTML fuente: `614bff4f327bdcf469b6b3de505dd643aa8da0bc41c8d1867dc9f207921246bd`.
