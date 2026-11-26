# V11.90 — borrador de protección de rutinas
Refuerza la identidad de slots referenciados por programas y cambios Coach, además del historial de sesiones. Diario de cambios acumulativo, no truncable ni editable. Valida transiciones de settings en persistencia normal contra el before-image. No modifica las rutinas de V10.6 ni su recuperación explícita. Pruebas nuevas y regresión integral pendientes; sin promoción.

Prueba aislada PASS: identidad de slots referenciados, journal acumulativo, rechazo null, cancelación legítima, edición de rutina sin referencias, compatibilidad de historial y parche idéntico para diario/shell. Integración en paquete y CI aún no verificadas.

También protege snapshot y commit frente a sesión Gym clásica persistida y evita iniciar flush de ciclo de vida cuando Coach está ocupado o incierto. Se añade regresión de IndexedDB/cifrado en browser offline. No se afirma validación de integración hasta CI.

V11.89 677d8234664d99fa972e5212a1356019a22a374e validada: fuentes 45901892839, D1/R2 45901892806, PWA 45901892860 y Chrome 45901892879 SUCCESS. Se promueve V11.90 a desarrollo; gates propios aún pendientes, sin despliegue.
