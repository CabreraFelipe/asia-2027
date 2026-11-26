# Auditoría inicial del programa fijo — Bloque 1
Fecha 26/11/2026. Fuente original V10.6 fijada en 061bb34dc3735d38dfd14eeb77f1054f34b63578; inspección en rama de desarrollo 2aa0eb709d8d19bad6ee945d31e511745605f169. No altera los originales ni acredita paridad. Hallazgos de lectura de fuentes, no cambios funcionales.

| Archivo | Dependencia verificada | Requisito de adaptación |
|---|---|---|
| core105.js | asia: 72 kg, preparación 16/11/2026, inicio 23/11/2026, fecha 08/03/2027, vacaciones 26/12–07/01; active/vacation | Separar política de programa por cuenta de validación general; preservar referencia histórica |
| extras830.js | goals101(undefined) crea Asia; validador exige asia-2027 y >=1 elemento; revisión semanal limitada a 23/11–08/03 | Nuevo estado explícito vacío válido sin reinterpretar respaldo legado; ajustar validación y probar lectura/restauración |
| goals101.js | UI gestiona metas múltiples, selección principal y archivo; exige validación previa y trata Asia como especial | Reutilizar UI y reglas de historial con libro vacío en cuentas nuevas, sin insertar Asia |
| profile100.js | Primera meta y motivación ligadas a Asia | Nombre independiente, mostrar meta propia; preservar motivación antigua al importar |
| schedule829.js / training102.js | agenda base fija, programas nuevos a partir de 08/03/2027 | Calendario por cuenta, habilitar programa desde fecha elegida; conservar slots históricos y claves de sesiones |
| planner820.js | PREP, START, END, VAC_START/VAC_END fijos | Derivar fase y fechas de programa propio, sin vacaciones heredadas |
| reminders821.js / reminders845.js | límites temporales fijos y planificación hasta marzo | Parametrizar agenda y zona horaria; no habilitar push en este incremento |
| v42.js / v44.js / v4.js / index.html | cabecera, objetivos, progreso, vacaciones y calendario referencian viaje, 72 kg o fechas fijas | Sustituir datos por valores de cuenta sin ocultar módulos ni alterar historial |
| features896.js | hitos, revisión semanal y vacaciones fijos | fechas de cuenta, validación de históricos y nuevos registros |
| simulator825.js | PLAN_GOAL=72, PLAN_END=2027-03-08 | requerir objetivo elegido; sin objetivo no mostrar recomendación falsa |

## Condiciones de implementación
- Auditar también restantes scripts (51 externos y 2 inline) y validadores de importación, migración, almacenamiento cifrado y reconciliación antes de cambiar esquema. Esta tabla no es inventario exhaustivo.
- Usar distinción explícita entre alta nueva sin programa y legado importado. Nunca inferir que una cuenta es nueva por falta de nombre. No borrar una meta Asia existente ni migrar automáticamente datos personales. Mantener formatos de lectura anteriores o migración reversible, con recuentos, backups y prueba de round trip.
- Separar meta descriptiva, programa Gym, objetivos nutricionales, vacaciones y calendario de recordatorios; ninguno concede permiso de push. El usuario puede no fijar meta o fecha. Evitar imponer 72 kg, 2000 kcal o 150 g como objetivo personalizado; revisar defaults de nutrición y seguridad de rangos.
- Pruebas obligatorias: nueva A/B sin Asia, fechas distintas, programa hoy, objetivos independientes, vacaciones solo si elegidas, históricos legados preservados, backup/restauración y validación negativa, no mezclar cuentas. Comprobar todas las pantallas y temporizadores del piloto. No tocar main, origen, ni recursos personales.
