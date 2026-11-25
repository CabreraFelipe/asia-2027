# Cambios V11.7 — Primer prototipo responsive ejecutable

## Objetivo

Convertir los prototipos de V11.3–V11.6 en una **interfaz local tangible** que pueda abrirse en Chrome de escritorio y adaptarse a un viewport móvil sin requerir recursos remotos. Se mantiene el esquema de cuentas sintéticas.

## Nuevas piezas

| Archivo | Función |
|---|---|
| `web/vault117.mjs` | Validación estricta, AES-256-GCM, AES-GCM AAD cuenta/tipo/revisión, PBKDF2 en el navegador, bóveda por cuenta, historial y CAS. |
| `web/app.mjs` | UI de inicio, diario, Salud sintética, Coach, historial, borradores y exportación cifrada. |
| `web/index.html` / `web/styles.css` | Diseño responsive con versión visible `v11.7`. |
| `web/manifest.webmanifest` / `web/sw117.js` | Metadatos PWA + caché de recursos locales, sin acceso a recursos externos. |
| `scripts/serve117.mjs` | HTTP estático loopback, whitelist de rutas y cabeceras de seguridad. |
| `tests/test117.mjs` | 82 verificaciones unitarias y 57 de integración, con WebCrypto real y repositorio de memoria. |

## Modelo de concurrencia

- Cada cuenta tiene su propio conjunto de versiones y una revisión `head`.
- `commit` compara la revisión de base dentro de una transacción `readwrite` de IndexedDB.
- Cuando hay conflicto, persiste una nueva copia cifrada en el almacén de borradores de esa misma cuenta. El `head` anterior no se modifica.
- Las pestañas no hacen fusiones automáticas. La vista de borradores permite revisión, no incorporación ciega.
- Recuperar una versión antigua crea una nueva revisión con nuevo IV y AAD de su nuevo número.
- Historial máximo de 100 revisiones; máximo 8 cuentas, 60 entradas y 31 días de Salud por cuenta.

## Integración con V11.5 y V11.6

- Reutiliza `validateCoachState115`, `prepareCoachRequest115`, `approveMemory115` y `GRANTS115` sin llamar a modelos externos.
- Reutiliza `validateHealthState116` sin acceso a Apple Salud.
- Las rutas de la API Cloudflare no participan de esta versión; los engines anteriores se incluyen **sin modificaciones**.

## Calidad verificada

- `node tests/test117.mjs`: 82 pruebas unitarias + 57 comprobaciones de integración offline.
- Pruebas anteriores V11.0–V11.6: 141; 283; 375; 29+34; 99+51; 84+83; 113+154 respectivamente.
- Sintaxis de todos los archivos JavaScript/MJS: verificada con `node --check`.
- Servidor local: comprobación HTTP en localhost con respuesta 200 y cabeceras de seguridad. No se comprobó navegación final con Chrome en este entorno, por bloqueo administrativo del navegador; realizar prueba manual en el equipo.

## Sin cambios

PWA V10.6, base `asia2027db`, Workers `asia-2027-ai`/`asia-2027-rest`, staging V11 en Cloudflare, secretos, GitHub y Service Worker de producción. Se entrega exclusivamente un nuevo ZIP offline.
