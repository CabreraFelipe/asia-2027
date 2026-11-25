# Asia 2027 — decisión definitiva de producto y contrato de paridad V10.6

**Estado:** objetivo acordado; NO es un paquete instalable, una versión terminada ni un despliegue.
**Base exacta del producto:** `CabreraFelipe/asia-2027`, rama `main`, commit `061bb34dc3735d38dfd14eeb77f1054f34b63578`, publicado como **V10.6**.
**Base técnica de identidad y cifrado:** **V11.24** publicada en Cloudflare staging y verificada por separado.

## 1. Objetivo no negociable

**Ofrecer la aplicación V10.6 existente, con las mismas pantallas, navegación, diseño, funcionalidades y experiencia de uso, a varios usuarios distintos.** No diseñar una app nueva inspirada en V10.6, ni reemplazar funciones terminadas por demostraciones, datos sintéticos o marcadores "próximamente". La distinción es que cada persona inicia sesión y tiene sus datos, claves, metas, respaldos e historial aislados; las autorizaciones y límites de los servicios se aplican por cuenta.

## 2. Evidencia de la auditoría

- El árbol público de la V10.6 contiene **110 archivos**, aproximadamente **2,42 MB** de contenido sin empaquetar; su `index.html` referencia **51 scripts** y dos hojas de estilos de primer nivel. La ruta de navegación muestra `Inicio · Dieta · Gym · Salud · Progreso`.
- V11.24 tiene navegación similar pero su propio HTML/JS y un diario sintético restringido: no ejecuta íntegramente los 51 scripts originales; por tanto **no es una copia funcional 1:1**. No se debe anunciar lo contrario.
- `accounts106.js` ya prepara explícitamente separación lógica por cuenta para claves de registros, Coach y preferencias visuales, y una base de IndexedDB por cuenta. Ese código es **preparatorio**, no una barrera de autenticación ni una migración activada. Debe aprovecharse sin confundir espacio de nombres local con seguridad del servidor.
- El esquema y el almacenamiento de V11.24 actualmente siguen acotados al laboratorio; no son equivalentes a las estructuras completas de V10.6.

## 3. Principio de implementación

**El frontend original es la referencia; la infraestructura es la que se adapta a él.**

1. Iniciar desde un clon verificado del commit V10.6, preservando `index.html`, `v4.css`, `ultimate84.css`, los scripts, iconos, flujos y estructura de navegación originales. No continuar reconstruyendo pantallas con `web124/app.js` como fuente principal.
2. Incorporar una puerta de autenticación antes de cargar datos privados. Utilizar el OIDC de Google desarrollado en V11.x, con sesión HTTP-only, CSRF, controles de acceso y `accountId` asignado por el servidor; nunca confiar en un ID de cuenta que envíe el navegador.
3. Introducir adaptadores de almacenamiento compatibles con el modelo real de V10.6. Inventariar `localStorage`, IndexedDB, cachés, fotos, respaldos, memoria del Coach, registros corporales, comidas, sesiones, rutinas, metas y preferencias. No borrar ni renombrar automáticamente el almacenamiento personal.
4. En Cloudflare, separar todos los registros por cuenta verificada, con cifrado y control de concurrencia. No migrar credenciales históricas ni tokens de servicios externos como parte de los datos portables. Las funciones con servicios externos requieren autorización y configuración propias por cuenta.
5. Implementar importación **explícita, reversible, verificable y no destructiva** de V10.6 a una cuenta. Previsualizar categorías y cantidades, crear copia local/cifrada y verificar la restauración antes de habilitar la cuenta. La V10.6 personal debe permanecer funcional e intacta.
6. Adaptar infraestructura de Coach IA, Open Food Facts, informes Xiaomi, rutinas, notificaciones, sincronización/respaldos, Apple Salud (en dispositivos compatibles) y demás conectores para usarse individualmente, con cuotas/costes controlados. No dar por equivalente ningún módulo si su acción central no funciona.
7. Revisar registro, privacidad, términos, protección de datos de Salud y consentimiento explícito antes de admitir usuarios reales. Las verificaciones locales en staging no sustituyen auditoría de seguridad y pruebas reales.

## 4. Matriz de aceptación funcional

| Módulo V10.6 | Criterio mínimo para declarar paridad |
|---|---|
| Inicio | Misma composición, indicadores, accesos rápidos, secciones plegables, personalización y estrategia de hoy |
| Dieta | Registro completo, alimentos y cantidades, objetivos nutricionales, escaneo/foto, biblioteca, recetas, historial y cálculos reales |
| Gym | Rutinas, ejercicios, series, cargas, temporizadores, progresión, registros activos, historial y análisis |
| Salud | Peso y composición Xiaomi, Apple Salud según plataforma, actividad, recuperación, informes y entrenador IA |
| Progreso | Gráficos, métricas, calendario, comparativas y análisis históricos con datos de la propia cuenta |
| Coach IA | Chat, memoria, contexto, recomendaciones y límites por cuenta; proveedor, privacidad y errores transparentes |
| Metas | Cada usuario define objetivos, fechas y motivos independientes; Asia 2027 se mantiene como primera meta histórica, no como límite de la aplicación |
| Datos y respaldo | Exportar, importar, recuperar, verificar integridad, gestionar conflictos, sincronizar y restaurar sin mezclar cuentas |
| Preferencias | Apariencia, distribución y personalización originales, persistencia individual |
| PWA e integración | Instalación, caché/service worker, notificaciones, red, acceso en iPhone y desktop sin exposición entre cuentas |

La matriz debe desglosarse en casos de prueba observables por control. **Un menú visible no cuenta como funcionalidad terminada.**

## 5. Criterios de salida

- Auditoría de **cobertura** de todos los controles y flujos V10.6 con evidencias de paso/fallo, no solo tests sintéticos.
- Comparación visual con capturas de V10.6 en móvil y escritorio. Las diferencias deben estar documentadas y justificadas por autenticación/gestión de cuenta, no por un rediseño.
- Al menos dos cuentas de prueba autenticadas con intentos de lectura, escritura, exportación y restauración cruzada: **todo acceso cruzado denegado**.
- Migración de exportación V10.6 con comprobación de recuentos, totales, registros y trazabilidad, sin alterar el original.
- Recuperación de cuenta/clave, sin exposición de secretos ni pérdida de datos; comportamiento offline y conflictos testeados.
- Auditoría de privacidad, autorización de servicios externos, coste y cuotas; plan de recuperación de incidentes.
- Instalador probado con versión concreta de Node bajo Windows, rutas OneDrive con espacios y acentos, y deploy verificable por `status`, ruta y función. Nunca se presenta Linux como validación de Windows.

## 6. Orden de ejecución a partir de ahora

**Fase A — Congelación y auditoría:** recuperar copia completa del repositorio V10.6 fijado al commit, inventariar 51 scripts, datos locales, flujos y dependencias; ejecutar `VERIFICAR_PARIDAD_FUENTES.mjs` contra cualquier candidato. Entrega sin instalación.

**Fase B — V10.6 intacta con login:** montar los archivos originales detrás del login V11.x en una ruta independiente. Ninguna sustitución de interfaz. Inicio de sesión, cierre e identidad solo en contenedor discreto. Requerirá validación visual, aun sin datos reales.

**Fase C — Modelo de datos 1:1 por cuenta:** adaptar el almacenamiento original y todos los servicios; probar cada módulo y la sincronización real; preservar historial y migración no destructiva.

**Fase D — Piloto real y apertura:** primero pruebas con cuentas propias autorizadas, luego un grupo cerrado, seguridad y aceptación completa, finalmente apertura a otros usuarios. No habilitar datos personales en el staging sintético por cambiar un rótulo.

No se promete una cantidad fija de actualizaciones, porque la condición es **paridad verificada**, no alcanzar un número de versión.

## 7. Herramienta de control incluida

`VERIFICAR_PARIDAD_FUENTES.mjs` compara los archivos del frontend original con un candidato adaptado y falla si desaparece o cambia alguno de los scripts y recursos nucleares. **Es un control estructural preliminar**: no demuestra por sí solo paridad de comportamiento ni aislamiento. Si es imprescindible modificar un archivo de V10.6 para integrarlo, el cambio debe ser mínimo, revisado y acompañado de prueba funcional y visual, antes de aceptarse una excepción al control.

Uso sin instalaciones ni red:

```powershell
node VERIFICAR_PARIDAD_FUENTES.mjs "C:\ruta\asia-2027-v10.6" "C:\ruta\asia-2027-multiusuario"
```

**Ni el documento ni el script modifican Cloudflare ni la app personal.**


---

## 8. Requisito añadido: iPhone y Android, la misma experiencia y los mismos datos

**Aceptación explícita:** el usuario emplea V10.6 principalmente como aplicación instalada en **iPhone** y la nueva edición multiusuario también deberá poder usarse en **Android**. No se acepta una interfaz exclusivamente de escritorio, ni una reconstrucción visual reducida. Las funciones principales de V10.6 (Inicio, Dieta, Gym, Salud, Progreso, Coach, metas, cámara y respaldos) deben conservarse en ambos móviles, salvo integraciones específicas del sistema operativo, que requieren un adaptador propio con funciones y permisos explicados.

### 8.1 Estado de la PWA original verificado en el commit `061bb34`

- `manifest.json` incluye `id: './'`, `start_url: './'`, `scope: './'`, `display: 'standalone'`, iconos 192/512 y accesos rápidos. Estas propiedades deben mantenerse funcionalmente en ambas plataformas.
- `index.html` contiene viewport móvil, icono `apple-touch-icon`, manifest y las cinco pestañas `Inicio`, `Dieta`, `Gym`, `Salud`, `Progreso`.
- `push.js` registra `./sw.js`, actualiza service worker al volver a primer plano y comprueba la suscripción web push; su propio mensaje restringe iOS a una webapp instalada en pantalla de inicio y versión compatible.
- `sw.js` aplica un manifiesto de recursos con hashes; evita `skipWaiting()` y `clients.claim()` para no mezclar sesiones de dos versiones. **No sustituir este comportamiento por un vaciado de caché o actualización forzada** en una instalación con registros locales.
- `health.js` contiene una integración Apple Salud; no es intercambiable directamente por una integración Android. El mismo panel debe soportar adaptadores distintos y un registro manual funcional cuando el origen automático no exista.

### 8.2 Regla de preservación al migrar desde iPhone

**No borrar la app original de pantalla de inicio, no borrar datos de sitios en Safari, no limpiar IndexedDB/localStorage ni cambiar el origen de V10.6 como estrategia de actualización.** Antes de mover datos hay que identificarlos y exportarlos desde el **contexto exacto en el que se usa la app** (instalación de pantalla de inicio u otro navegador). No asumir que dos contextos de iOS comparten almacenamiento. El backend de Cloudflare por sí solo no contiene necesariamente fotos, preferencias, diarios, memorias del Coach o sesiones que siguen locales.

Secuencia obligatoria: (a) auditoría de inventario **solo lectura** en el iPhone; (b) exportación local cifrada desde esa instalación; (c) comprobación de que el archivo puede descifrarse y que contiene los grupos esperados; (d) importación en una **cuenta nueva aislada** sin alterar el origen; (e) comparación de cantidades de registros, fechas, fotos, metas, Gym, preferencias y Coach; (f) abrir la misma cuenta en Android y verificar sincronización; (g) comprobar exportación/restauración; (h) recién entonces solicitar aprobación para usar la edición nueva. **No eliminar V10.6** como consecuencia de esa aprobación: retirar la app sería una decisión posterior y explícita.

Un cambio de URL, dominio, `scope` o `id` puede crear otra instalación con otro espacio de datos. Por eso se recomienda un sitio multiusuario separado, conservando la URL y el manifiesto de la V10.6 personal. Cada cuenta se identifica por la sesión del servidor, no por un selector local manipulable.

### 8.3 Compatibilidad por plataforma (criterios de aceptación)

| Requisito | iPhone (PWA instalada) | Android (PWA instalada) | Evidencia de aprobación |
|---|---|---|---|
| Pantallas e interacción V10.6 | Mismo diseño, safe areas/notch y gestos | Mismo diseño y navegación táctil | Comparación de capturas y acciones reales |
| Inicio de sesión Google | Retorno correcto a la app instalada | Retorno correcto a la PWA de Chrome | Sesión, cierre y reapertura sin acceso cruzado |
| Datos y metas por cuenta | No perder registros tras cerrar/reabrir | Mismos registros sincronizados | Conteos y sumas idénticos con cuenta A/B |
| Dieta y cámara | Foto, código de barras, adjuntos y errores claros | Igual | Captura/permiso/cancelación/reintento |
| Gym | Rutinas, series, descanso y sesión activa tras bloqueo | Igual | No perder sesión activa ni duplicar series |
| Salud | Apple Salud, si el método de autorización lo permite | Health Connect mediante integración adecuada o entrada manual | Permisos por plataforma, trazabilidad y revocación |
| Coach IA | Memoria, historial, límites y contexto de la cuenta | Igual | Ningún dato de otra cuenta en el contexto |
| Funcionamiento offline | Lectura y registros en cola sin pérdida | Igual | Modo avión, cierre, reconexión y conflictos |
| Notificaciones | Web push en iOS compatible e instalada en inicio | Web push donde navegador/sistema lo soporte | Suscripción, envío, permisos y revocación reales |
| Instalación y actualización | Manifest + service worker estables, sin vaciar datos | Igual | Actualizar con el diario abierto y cerrado; rollback |
| Exportar/restaurar | Archivo recuperable sin reinstalar ni borrar el origen | Igual | Copia descifrada con integridad y recuentos exactos |

### 8.4 Pruebas móviles de salida, sin excepciones

1. **iPhone original:** tomar inventario de la V10.6 instalada y un respaldo cifrado completo. Verificar fotos, historial Coach y Gym que puedan estar fuera de los registros básicos. Nunca ejecutar migraciones automáticas en la original.
2. **iPhone nuevo:** instalar el frontend V10.6 conservado detrás de autenticación; iniciar sesión Google; comprobar **todas las funciones**, estado de sesión y safe areas. Probar Safari y pantalla de inicio como contextos separados.
3. **Android nuevo:** instalar la misma edición desde Chrome (o navegador compatible), comprobar exactamente las mismas rutas, cámara, temporizadores, formularios, red y notificaciones.
4. **Dos dispositivos, una cuenta:** editar un día en iPhone y confirmar el resultado en Android; editar después en Android y confirmar en iPhone. Repetir sin red y provocando un conflicto de escritura simultánea; nunca perder ni sobrescribir silenciosamente.
5. **Dos cuentas, un dispositivo:** iniciar sesión A, cerrar, iniciar B y comprobar que B no puede ver datos/caché/archivos de A, incluso offline. Después recuperar A sin mezclar registros.
6. **Actualizaciones PWA:** validar actualización del service worker, caches por versión, estado de sesiones activas y persistencia de datos. No usar `unregister()`, `localStorage.clear()` ni `indexedDB.deleteDatabase()` sobre V10.6 como mecanismo de instalación.
7. **Salud por plataforma:** Apple Salud/Health Connect requieren integración y consentimiento propios; no prometer acceso directo a Health Connect solo desde una página web. Si no hay conector autorizado, mantener una opción manual genuinamente operativa.

### 8.5 Limitaciones y documentación externa

- La PWA puede instalarse en iOS y Android, pero los permisos y puentes a sistemas de salud varían por plataforma. El acceso a Health Connect se documenta mediante su SDK para aplicaciones Android, no como API web universal. Véase: https://developer.android.com/health-and-fitness/health-connect/get-started
- Las notificaciones web en iPhone requieren compatibilidad del sistema y webapp instalada en la pantalla de inicio: https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers
- El almacenamiento local de WebKit depende del contexto y de políticas de cuota; no es un respaldo duradero: https://webkit.org/blog/14403/updates-to-storage-policy/

**Estado del contrato:** requisitos actualizados; no constituye implementación móvil probada, migración de datos ni una versión para instalar. Ningún dato personal fue leído o modificado al prepararlo.

### 8.6 Salud y wearables realmente multiusuario
Vinculación independiente por cuenta y dispositivo, Apple Salud/Health Connect mediante integración compatible y conectores de fabricante autorizados. Cada cuenta empieza desconectada; origen visible, selección de fuentes sin duplicados, permisos y revocación por tipo de dato. La compatibilidad no se presume por marca. Criterios detallados en CONTRATO_SALUD_WEARABLES_V12.md. No admitir registros reales hasta validar los adaptadores correspondientes.
