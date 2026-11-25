# Decisiones fijadas para Asia 2027

- **Nunca obligar a crear una contraseña propia de Asia de 16 caracteres.** En la versión final priorizar passkeys / login social OIDC; Google es la primera integración de staging.
- Google OIDC no es lo mismo que implementar passkeys de Google o Apple; la disponibilidad depende del proveedor y del dispositivo.
- La contraseña de ingreso a Google NO debe ser una clave para cifrar los respaldos. El cifrado, la recuperación y la rotación de claves de Asia deberán diseñarse por separado.
- **Estética:** preservar colores, navegación, Coach IA y pantallas de la PWA V10.6. La página del Worker es solo una pantalla temporal de staging, no un nuevo diseño de producto.
- **Integración:** no producir otra colección de laboratorios como objetivo final. El siguiente hito es servir la interfaz existente y la nueva API desde un origen controlado y usar sesiones reales para leer/escribir respaldos cifrados sintéticos.
- **Seguridad:** V11.11 NO habilita usuarios públicos, información médica real, migración de V10.6 ni notificaciones reales. D1 de staging y Workers de producción son recursos diferentes.
- **Salida a beta:** solo después de pruebas reales de Google con un cliente configurado, recuperación, manejo de conflictos, privacidad, auditoría y reversibilidad.
