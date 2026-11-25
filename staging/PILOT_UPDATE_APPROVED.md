# Solicitud de actualización exclusiva del piloto

El usuario confirmó el fallo «Montaje agotado» mediante captura. Actualización limitada al Worker del piloto ya publicado, después de aprobación manual y pruebas de paquete/Chrome, incluida carga lenta. Comprobar bindings y variables exactas antes de desplegar. Preservar D1, R2 y secretos; sin migraciones, sin cambios en V10.6. No usar datos personales.

Primer hotfix no llegó a publicar: Chrome no montó diario con demora artificial, ambas pruebas fallaron. Se reemplaza dependencia del evento load por readiness del DOM y verificación explícita Gym, manteniendo timeout acotado y bloqueo de interacción durante montaje. Regresión con recurso secundario lento, aislamiento y guardado originales. Requiere nueva aprobación y CI.

0ec60f4: Chrome normal y recurso lento SUCCESS (45555111048), paquete y fuentes SUCCESS. Nueva ejecución requiere job validate SIN secretos, con ambos Chrome, antes de la aprobación manual del deploy. El paquete lleva huella de assets reproducible en entry.js y smoke compara SHA-256 del archivo completo; se verifican bindings antes y después. No modifica funcionalidad del hotfix aprobado. Solo Worker piloto, sin migraciones ni datos reales.

Revisión edeba210: las tres CI completaron SUCCESS (45555572840 fuentes, 45555572793 paquete y 45555572822 Chrome normal y lento). Reanudar pipeline de actualización con código funcional y generador validados sin cambios; repetir validate antes de solicitar aprobación manual. Mantener recursos y secretos existentes, verificar bindings antes/después y huella de paquete publicada. Sin migraciones ni datos reales.
