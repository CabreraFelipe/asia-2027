# Solicitud de actualización exclusiva del piloto

El usuario confirmó el fallo «Montaje agotado» mediante captura. Actualización limitada al Worker del piloto ya publicado, después de aprobación manual y pruebas de paquete/Chrome, incluida carga lenta. Comprobar bindings y variables exactas antes de desplegar. Preservar D1, R2 y secretos; sin migraciones, sin cambios en V10.6. No usar datos personales.

Primer hotfix no llegó a publicar: Chrome no montó diario con demora artificial, ambas pruebas fallaron. Se reemplaza dependencia del evento load por readiness del DOM y verificación explícita Gym, manteniendo timeout acotado y bloqueo de interacción durante montaje. Regresión con recurso secundario lento, aislamiento y guardado originales. Requiere nueva aprobación y CI.

0ec60f4: Chrome normal y recurso lento SUCCESS (45555111048), paquete y fuentes SUCCESS. Nueva ejecución requiere job validate SIN secretos, con ambos Chrome, antes de la aprobación manual del deploy. El paquete lleva huella de assets reproducible en entry.js y smoke compara SHA-256 del archivo completo; se verifican bindings antes y después. No modifica funcionalidad del hotfix aprobado. Solo Worker piloto, sin migraciones ni datos reales.

Revisión edeba210: las tres CI completaron SUCCESS (45555572840 fuentes, 45555572793 paquete y 45555572822 Chrome normal y lento). Reanudar pipeline de actualización con código funcional y generador validados sin cambios; repetir validate antes de solicitar aprobación manual. Mantener recursos y secretos existentes, verificar bindings antes/después y huella de paquete publicada. Sin migraciones ni datos reales.

## 25/11/2026 — Bloque 0: consolidación de piloto sintético

Base funcional exacta 9cd718acf27f3737fc369df18e91742eb61e2cd7, seis commits por delante de 4153a094df54d43794d2fa4bb9ebca76b4a1cf80 (último update 45555776326 SUCCESS). main permanece en 061bb34dc3735d38dfd14eeb77f1054f34b63578. Comparación revisada: diez paths, solo candidato, CI de Chrome, pruebas y contratos; no cambios de originales, migraciones ni infraestructura de despliegue.

Consolidar fotos Gym (CSP exacta, dos posiciones y ampliación con fixture CDP), nombre del perfil cifrado (textContent, persistencia y aislamiento), regresiones de descansos clásico/PRO (reloj y callback sintéticos) y preferencias por cuenta (opt-in, horario 06:35 de A persistente, B sin herencia). Huella incluye fuentes servidor. Salud: solo contrato y pruebas de lectura sintética, no conexión real. CI confirmada: 45556529685/45556529724/45556530020, 45556738464/45556738483/45556738547, 45557093195/45557093279/45557093263, 45557216917/45557216895/45557216831 y 45557373458/45557373481 SUCCESS.

Activar únicamente asia-v12-pilot-update.yml para recompilar, ejecutar paquete y Chrome normal/lento sin secretos. No solicitar aprobación hasta validate SUCCESS y deploy waiting del run exacto. Después de aprobación manual, verificar recursos y secretos existentes pre/post, Wrangler dry-run, huella SHA-256 de entrada, inicio 200 y rutas privadas 401. Sin aprovisionamiento, migraciones, cambio de flags, credenciales, ni datos reales. No ejecutar push histórico. Pendiente prueba física de fotos reales, nombre, preferencias A/B y temporizadores; no afirmar push o salud real. Bloque 0 no cerrado hasta evidencias de publicación y prueba física.
