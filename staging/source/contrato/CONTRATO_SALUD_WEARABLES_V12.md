# Contrato de integraciones de salud y wearables por cuenta
Estado: requisito bloqueante de V12.0 para iOS y Android; no implica conectores reales habilitados. Piloto sintético únicamente.

## Producto
- Cada cuenta empieza sin proveedor, sin dispositivo vinculado, sin permiso concedido y sin datos de terceros. No hereda conexiones, claves, registros de salud ni suscripciones del propietario.
- Pantalla Salud conserva los indicadores, histórico, actividad, recuperación y registro manual de V10.6, con origen y última sincronización visibles. El usuario elige conectar, cambiar, desconectar y revisar permisos de sus propias fuentes. No llamar Apple Salud a los datos de otra fuente.
- El usuario puede usar su teléfono sin reloj. El reloj se vincula mediante su aplicación/sistema compatible o API del fabricante, no se promete emparejamiento Bluetooth universal ni todas las métricas en todos los modelos.
- Separar conexión de salud (lectura de actividad) de suscripción a notificaciones (entrega de avisos). Ningún permiso de uno concede automáticamente el otro.

## Adaptadores
1. iPhone: Health Auto Export como ruta de compatibilidad con V10.6, por cuenta y dispositivo, sin compartir claves ni endpoint personal. Evaluar puente nativo HealthKit con autorización granular; PWA no lee directamente el almacén del sistema. Apple Watch y otros relojes que exporten datos a Apple Salud usan esta ruta.
2. Android: integración nativa/compañera Health Connect con permisos de lectura por tipo. Samsung Health, Fitbit, Xiaomi, Garmin, Huawei, Amazfit u otras aplicaciones pueden ser fuentes solamente si el modelo, sistema, región y app efectivamente exportan los datos autorizados a Health Connect. No afirmar cobertura por marca sin pruebas.
3. APIs de fabricante: OAuth por usuario donde exista acceso autorizado (p. ej. Garmin Connect y Fitbit, sujeto a aprobación, disponibilidad y condiciones). No pedir contraseñas de terceros ni usar scraping como alternativa.
4. Importación de archivos compatibles con previa revisión de origen, unidades y deduplicación; registro manual sin reloj. Nunca presentar simulación o botón inoperante como conexión real.

## Identidad, autorización, datos
- El servidor determina cuenta a partir de sesión autenticada; nunca del accountId de un cuerpo o encabezado. Identidad de conexión, proveedor, dispositivo y sujeto externo vinculados y verificados. OAuth state/PKCE, CSRF, caducidad, revocación, rotación y no reutilización entre cuentas. Secretos/tokens únicamente en almacenamiento protegido separado de los respaldos portables; sin logs de credenciales.
- Consentimiento explícito por proveedor y tipo de dato, lectura mínima necesaria, no compartir con Coach IA sin autorización independiente. Desconectar revoca ingestión y nuevas consultas; conservar o eliminar histórico mediante decisión explícita. Un registro sincronizado nunca se atribuye a otra cuenta.
- Normalizar pasos, distancia, energía activa/reposo, tiempo de ejercicio, FC/reposo, VFC, sueño, VO2 y entrenamientos cuando disponibles; peso/composición y otros datos según fuente. Fecha, zona horaria, unidad, identificador estable del proveedor, procedencia, instante y revisión; distinguir cero, dato ausente y permiso no comprobable. No sumar totales diarios de fuentes duplicadas; seleccionar fuente preferida por indicador y resolver solapamiento. No sobrescribir registro manual sin confirmación. Migración de registros de salud históricos no migra credenciales.
- Permitir varias fuentes propias sin duplicación, con selección y estado por fuente. Respetar revocación local, cambio de cuenta, sesión cerrada, reintentos idempotentes, desconexión y reconexión. Sin escritura al proveedor por defecto.

## Criterios de aceptación
- Dos cuentas, dos dispositivos, proveedores diferentes; lectura, ingestión, desconexión y revocación cruzadas denegadas; misma cuenta en dos teléfonos mantiene su propio histórico y preferencias.
- iPhone físico: autorización HealthKit/puente o exportador elegido, Apple Watch vinculado y métricas verificadas contra origen; otro wearable compatible si está disponible. Android físico: Health Connect con aplicación compatible, permisos parciales, revocación, sincronización real y datos verificados contra origen. Validar app cerrada según capacidades del proveedor, fallos de red y ausencia de datos.
- Cada adaptador adicional requiere pruebas reales por modelo/app y métricas anunciadas, no solo fixture. Verificar notificaciones en relojes compatibles por separado según contrato de notificaciones.
- No declarar paridad Salud ni migrar datos reales antes de pruebas de aceptación, revisión de privacidad, costos, términos de proveedores y transición explícita. No tocar integración personal V10.6 ni servicios actuales.

## Referencias técnicas
- Apple HealthKit: https://developer.apple.com/documentation/healthkit
- Apple permisos: https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data
- Android Health Connect: https://developer.android.com/health-and-fitness/health-connect/get-started
- Garmin Health API: https://developer.garmin.com/gc-developer-program/enterprise/health-api/
- Fitbit API: https://dev.fitbit.com/build/reference/web-api/explore/

## Estado comprobado
health.js usa terminología/contrato Apple Salud y la copia piloto llama servicios sintéticos por sesión; el Worker publicado usa proveedor vacío. No existe puente nativo ni conexión real multiusuario aún. La primera prueba ampliada confirma únicamente aislamiento de lecturas sintéticas, no autorización de proveedores ni entrega real de datos.
