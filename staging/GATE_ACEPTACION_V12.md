# V12.0 — gate de aceptación y corte (27/11/2026)

## Candidato verificado
- Desarrollo: bf90e6b612326c993901120f3c3347431d1aebb4; producción V10.6: 061bb34dc3735d38dfd14eeb77f1054f34b63578.
- CI exacta: [fuentes, smoke y sanitizer Docker](https://github.com/CabreraFelipe/asia-2027/actions/runs/45959147012), [D1/R2](https://github.com/CabreraFelipe/asia-2027/actions/runs/45959146914), [PWA](https://github.com/CabreraFelipe/asia-2027/actions/runs/45959146930), [Chrome normal/lento](https://github.com/CabreraFelipe/asia-2027/actions/runs/45959146916): SUCCESS.
- No equivale a prueba con proveedor real, a despliegue actualizado ni a paridad física completa.

## Orden de cierre (sin ampliar alcance)
1. Piloto sintético: comparar paquete actual con versión desplegada, aprobar actualización exacta por propietario, validar pipeline sin secretos y luego aprobación del entorno protegido. Mantener Worker/D1/R2 aislados, no aplicar migraciones propuestas a destinos existentes, comprobar huella SHA-256 y rutas privadas 401. No usar datos personales. Las aprobaciones históricas son específicas de sus cambios.
2. Entorno de aceptación real separado: definir recursos nuevos, identidad de cuentas reales y autorización por capacidad, con flags deshabilitadas inicialmente. No cambiar syntheticOnly para simular identidad real. Verificar alta/revocación, sesión expirada, A/B, CSRF, restauración, límites, copia remota y conflictos. No sustituir el piloto sintético.
3. Coach/documentos: provisionar credenciales fuera del repositorio y servicio privado del inspector con aislamiento auditado. Revisar tratamiento de datos y consentimiento; ejecutar pruebas con documentos autorizados no sensibles. Verificar edición, guardado, reapertura y sincronización de menú/rutina en dos dispositivos. No declarar que store:false garantiza retención cero.
4. Notificaciones: vincular dispositivo a sesión, alta/revocación, claves y cola, scheduler, service worker, temporizador offline, entrega física y zona horaria. Sin datos personales en lockscreen. No enviar a usuarios hasta aceptación.
5. Salud y fuentes: verificar alcance real de Apple Salud y otros wearables, permisos y unidades, revocación, procedencia, sin duplicación; mantener entrada manual disponible. Documentar limitaciones por plataforma.
6. Migración personal: inventario real de solo lectura con autorización, backup integral cifrado, restauración aislada, equivalencia por módulo y fotos, reconciliación de cambios pendientes, comprobación por propietario y plan de vuelta. Nunca copiar tokens ni permisos de push; nunca borrar origen.
7. Publicación V12.0: solo después de evidencias de aceptación de los pasos anteriores y aprobación explícita del propietario. Sin fecha prometida ni porcentaje de avance inventado.

## Criterios físicos mínimos
- iOS y Android: login/logout, A/B, reapertura PWA, red lenta/offline, cambio de cuenta y restauración.
- Gym clásico/PRO: rutinas, series y cargas, fotos, descansos, agenda y cambios de programa sin alterar historial.
- Nutrición: objetivos, alimentos y recetas, dieta importada, alternativas, adherencia, respaldo y sync.
- Coach: contexto autorizado, propuesta editable, rechazo intacto, aceptación y guardado verificable.
- Documentos: PDF digital y escaneado, JPEG/PNG, datos ambiguos, archivos inválidos, ejercicios desconocidos, sin envío por defecto.
- Seguridad: expiración/revocación, cruces de cuenta, errores de proveedor, límites, conflictos, no persistencia de archivos originales por defecto.
- Registrar evidencia por caso y commit, sin credenciales ni datos identificables.

## Bloqueo actual
La composición de servicios reales no está incorporada en el candidato. El Worker existente sigue siendo exclusivamente sintético; el inspector tiene CLI y adaptador, pero no host privado provisionado. No se verificó en esta revisión la huella de la versión remota actual. Este archivo es un registro de aceptación, no una autorización, no activa workflows de despliegue y no altera producción.

## Evidencia de actualización del piloto — 27/11/2026
Publicación autorizada del commit 76c6f118691082ba6830b43b57cd43250708ce29. [Run 45961653644](https://github.com/CabreraFelipe/asia-2027/actions/runs/45961653644) completado SUCCESS: validate 140380631861 y deploy 140382447680, incluyendo Chrome normal/lento, paquete, preflight de destinos, actualización exclusiva del Worker piloto, comprobación posterior de bindings y secretos, y smoke con huella SHA-256 y rutas anónimas 200/privadas 401. main verificada en 061bb34dc3735d38dfd14eeb77f1054f34b63578. Sin migraciones ni habilitación de servicios reales según procedimiento ejecutado. Pendiente aceptación física del propietario: inicio de sesión, apertura, cuenta propia sin programa Asia heredado en instalación nueva de prueba, calendario/entrenamiento, nutrición, Running/deporte, reapertura y cierre de sesión. No introducir datos personales ni utilizar este piloto para migración; importación IA real, push y wearables siguen sin activación. No se ha realizado prueba física en esta revisión. Este registro no autoriza otra publicación.
