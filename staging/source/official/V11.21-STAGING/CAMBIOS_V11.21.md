# Asia 2027 · actualización acumulativa V11.19 → V11.21 (staging)

## V11.19 — Identidad visual de V10.6

- Regresan la jerarquía de «Mi progreso», la navegación inferior de cinco pestañas **Inicio, Dieta, Gym, Salud, Progreso** y el acceso independiente a **Cuenta**.
- Paleta azul marino y dorado, tarjetas y barras adaptables a móvil, versión visible. **No es un calco pixel-perfect** de V10.6; es una primera unificación de interfaz.
- Se mantienen todas las rutas de V11.11–V11.18 y no se importa ningún archivo de producción.

## V11.20 — Inicio y registro ficticio integrado

- Inicio con tarjetas resumidas del diario cifrado ficticio, accesos rápidos a Dieta, Gym, Progreso y Cuenta.
- Formularios existentes para enero 2026 reutilizados SIN modificar esquema, validadores, sincronización ni límites.
- Estado de sincronización y clave mostrado desde la cuenta actual.

## V11.21 — Salud y Progreso como estructura para la plataforma

- Salud deja claro que no hay Apple Health, Xiaomi ni métricas reales integradas. No envía ni recopila mediciones.
- Progreso calcula contadores, calendario D/G y lectura descriptiva sobre la colección ficticia ya descifrada.
- Resumen local de orientación sin IA ni inferencias clínicas; no llama APIs nuevas.
- Cuenta retiene todas las acciones de V11.18, incluido kit, recuperación integral y borradores pendientes.

## Limitaciones honestas

Esta entrega NO migra datos reales, metas personales, nutrición real, rutina avanzada, Apple Salud, inteligencia artificial ni notificaciones. Sigue siendo un laboratorio STAGING exclusivo para datos inventados. La pantalla reutiliza el modelo cifrado de V11.15 y no crea tablas. Vista visual real pendiente de comprobar en iPhone/Windows: Chromium del entorno bloqueó el acceso al servidor local.

## Seguridad

Se añadió una ruta estática /v11.21 con 11 recursos. La sesión sigue siendo Google OIDC V11.11, almacenamiento D1 existente y clave AES local. `worker1121.mjs` hereda las rutas previas, sin migraciones SQL ni cambios de permisos. La vuelta de Google a V11.21 se implementa con una cookie temporal HttpOnly. La versión en `/v11.11/status` será 11.21 tras desplegar.

## Prueba recomendada después de instalar

1. Verificar cabecera V11.21, fondo azul/dorado, cinco pestañas y Cuenta.
2. Iniciar sesión Google con cuenta de staging. Importar código ficticio anterior si el navegador todavía no lo tiene.
3. Abrir Dieta y Gym y confirmar que el historial ficticio de V11.18 permanece. Guardar **solo un ejemplo inventado** (si hay espacio de revisiones).
4. Comprobar que Inicio, Salud y Progreso cambian sin recargar y no muestran datos reales.
5. Cuenta: verificar visualmente los controles de kit, copia integral y recuperación anterior, SIN importar/copiar V10.6.
6. Si aparece un error, no repetir el instalador ni cambiar producción.

## Hotfix de instalación (ruta inexistente)

El despliegue consultado el 24/11/2026 se encontraba en V11.17, por lo que la URL V11.21 devolvía 404/RUTA_INEXISTENTE. El instalador de V11.21 exigía previamente V11.18 y bloqueaba innecesariamente la actualización. Se ajustó exclusivamente el precheck para aceptar V11.17 o V11.18, sin omitir la verificación de staging, la copia D1 ni el smoke. Sin modificaciones en Worker, assets, esquemas, autenticación, claves ni datos.

## Hotfix Windows ESM — 24/11/2026

El preflight de V11.21 fallaba en Windows al importar `precheck1121.mjs` usando una ruta absoluta `C:\...` como especificador de `import()`. El loader ESM la interpretaba como protocolo `c:` y abortaba con `ERR_UNSUPPORTED_ESM_URL_SCHEME`. Se corrigió **únicamente el test de actualización** (`tests/test_upgrade1121.mjs`) para usar `pathToFileURL(script).href`. El test sigue ejecutándose; no fue omitido. Se añadieron aserciones de URL y round-trip de ruta, y se probará también una extracción en ruta con espacios.

No hay cambios de código de Worker, activos web, datos, tablas, autenticación, configuraciones de despliegue ni permisos. El origen remoto aceptado continúa siendo solo V11.17 o V11.18.
