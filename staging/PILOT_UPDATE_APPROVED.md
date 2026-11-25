# Solicitud de actualización exclusiva del piloto

El usuario confirmó el fallo «Montaje agotado» mediante captura. Actualización limitada al Worker del piloto ya publicado, después de aprobación manual y pruebas de paquete/Chrome, incluida carga lenta. Comprobar bindings y variables exactas antes de desplegar. Preservar D1, R2 y secretos; sin migraciones, sin cambios en V10.6. No usar datos personales.

Primer hotfix no llegó a publicar: Chrome no montó diario con demora artificial, ambas pruebas fallaron. Se reemplaza dependencia del evento load por readiness del DOM y verificación explícita Gym, manteniendo timeout acotado y bloqueo de interacción durante montaje. Regresión con recurso secundario lento, aislamiento y guardado originales. Requiere nueva aprobación y CI.
