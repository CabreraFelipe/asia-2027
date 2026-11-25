# Asia Platform V11.8 — Auditoría real de integración y puertas de salida

Fecha: 2026-11-23. Alcance: análisis estático y pruebas locales de los **archivos incluidos en este paquete**. La auditoría **no es** una evaluación independiente de ciberseguridad ni un pentest completo. No se ha validado Cloudflare ni producción en esta versión.

## Resultado de integración

| Subsistema | Estado comprobado | Limitación |
|---|---|---|
| V11.0 Infraestructura | Regresiones locales; HTTP 200 de API/REST reportados en fases previas | Sin diagnóstico remoto en V11.8 |
| V11.1b Autenticación | Claves sintéticas, operador, sesiones, revocación; regresiones locales | No son credenciales de usuarios reales |
| V11.2 Respaldos en D1 | Aislamiento por `account_id` obtenido de sesión y CAS; 20 comprobaciones remotas previas | Operador `401` observado tras rotación posterior; sin resolver en esta etapa |
| V11.3 Migración | Ensayo de respaldo V10.6 con datos ficticios y sin red | Salud en D1 y contraseñas no se incluyen en el respaldo general V10.6 |
| V11.4 Sincronización | Motor CAS y borradores cifrados, laboratorio offline | No hay cola persistente entre dispositivos físicos |
| V11.5 Coach | Estado/consentimiento por cuenta y límites, laboratorio offline | No hay modelo de IA, coste, retención ni verificación de proveedor |
| V11.6 Salud/Push | Permisos, aislamiento y colas sintéticas, laboratorio offline | No hay conexión real con HealthKit/Health Connect ni envío push |
| V11.7 UI | Interfaz responsive y cifrado local, prueba manual del usuario | Cuentas ficticias, sin control servidor, solo IndexedDB de origen |
| V11.8 Portabilidad | Exportación de una revisión cifrada y **importación atómica verificada**, offline | **No** restaura todo el historial ni equivale a sincronización en la nube |

## Problemas abordados por V11.8

1. **Service Worker viejo sirviendo código obsoleto.** V11.7 usa caché-first en `/web/`. En vez de reemplazar esa ruta, V11.8 se sirve desde `/v118/` con Service Worker/cache propios. V11.7 sigue accesible; ambos comparten origen y el IndexedDB de demostración para preservar cuentas ficticias. No abrir dos versiones al mismo tiempo si no querés generar conflictos (CAS evita la sobrescritura).
2. **Exportación cifrada sin importación.** V11.8 incorpora importación que exige conocer la frase de prueba original, valida formato y descifra en memoria antes de persistir, y almacena cuenta/head/revisión **en una única transacción IndexedDB**. No sobrescribe si el ID ya está presente.
3. **Exportación potencialmente desactualizada.** Ahora comprueba si el head coincide con la revisión desbloqueada; si otra pestaña cambió los datos, solicita actualizar. Si hay borrador en conflicto no exporta. Rechaza respaldos cuyo cifrado no sea íntegro.
4. **Fecha de calendario incorrecta cerca de medianoche.** La fecha sugerida en el diario V11.8 utiliza calendario local, no el día UTC.
5. **Control de versiones visible y conservación estética.** V11.8 aparece en el encabezado; `v118/styles.css` es **idéntico byte a byte** al CSS de V11.7. No se modifica un solo recurso de la app personal V10.6.

## Bloqueos antes de permitir datos reales / beta V12.0

| ID | Criticidad | Riesgo / trabajo obligatorio |
|---|---|---|
| G01 | **Crítico** | Sustituir claves de prueba/operador por proveedor de identidad real; verificación, recuperación, MFA opcional, límites y sesiones por dispositivo. |
| G02 | **Crítico** | Definir esquema canónico, propiedad/rotación/recuperación de claves. El esquema del respaldo Cloudflare V11.2 `asia84-encrypted-v1` **no coincide** con el formato local `asia117-browser-vault-v1`; no se pueden enlazar directamente. |
| G03 | **Alto** | Implantar transporte autenticado, cola offline **duradera**, deduplicación y resolución de conflictos para dispositivos distintos. V11.8 es portabilidad **manual** de una revisión. |
| G04 | **Alto** | Ensayar migración reversible de **todos** los orígenes V10.6, incluyendo D1 Salud, y realizar verificación y reversión antes de tocar producción. |
| G05 | **Alto** | Resolver el diagnóstico de lectura del acceso de operador: en V11.2 una segunda rotación de `STAGING_API_TOKEN` produjo HTTP 401 tras una validación previa exitosa. No asumir que hoy funciona ni rotar sin necesidad. |
| G06 | **Alto** | Revisar retención/borrado/exportación de datos sensibles, minimización, consentimiento, trazabilidad, abuso y observabilidad sin PII en logs. |
| G07 | **Alto** | Pruebas con iPhone Safari, Android Chrome y desktop reales de instalación, offline, SW, IndexedDB, almacenamiento bajo presión y accesibilidad. El CI actual no verifica interacción final en Chrome. |
| G08 | **Alto** | Integrar realmente Apple Salud / Health Connect y notificaciones VAPID/APNs/FCM con consentimiento y baja verificada; hoy son simuladores. |
| G09 | **Medio** | Incluir historial completo en un formato de respaldo portable, importación de borradores y una política de retención. La exportación V11.8 **solo transporta el snapshot HEAD**. |
| G10 | **Medio** | Evaluar límite y reputación del origen localhost: IndexedDB cifrado protege contenido frente a lectura casual sin frase, pero la app local **no constituye una frontera de seguridad multiusuario** ni evita modificaciones por extensiones o código en el mismo origen. |
| G11 | **Alto** | Auditar funciones reales del backend V11.5/V11.6 con D1 y su esquema remoto; hasta ahora se ensayaron offline y las migraciones `0004`/`0005` no forman parte de los despliegues probados. |

## Decisión de salida

**V11.8 APROBADA solamente como laboratorio offline.** La V12.0 no debe abrirse a cuentas reales todavía. Hito recomendado tras esta auditoría: **V11.9 — Consolidación y cierre de bloqueos críticos** (identidad real, contrato único de cifrado/sync y validación controlada en staging). No modificar V10.6 ni Cloudflare sin un plan de reversión específico y sin aprobación.
