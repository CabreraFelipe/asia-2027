# V11.7 — Pendientes y riesgos para el plan V11.8 → V12.0

**No confundir UI responsive local con plataforma multiusuario lista.**

1. **Autenticación apta para personas reales:** cuentas en proveedor confiable, verificación, recuperación, protección ante abuso y separación efectiva en backend. V11.1b solo autentica cuentas sintéticas con credencial de operador.
2. **Propiedad de las claves y recuperación:** diseño formal de claves por usuario/dispositivo, pérdida de contraseña, rotación, recuperación y revocación. No reutilizar claves de prueba de navegador como credenciales de producción.
3. **Sincronización real:** cola local duradera, cambios diferenciales o estrategia de snapshots, resolución explícita de conflictos, deduplicación, offline/online, autenticar cada operación; pruebas iPhone/Windows. El prototipo V11.7 solo sincroniza estado entre pestañas que comparten el **mismo** IndexedDB por CAS.
4. **Migración real y reversible:** respaldos V10.6 y D1 Salud deben inventariarse por separado, verificar checksum, ensayar recuperación independiente y verificar antes de tocar datos reales. V11.3 solo ensayó contenido ficticio.
5. **Datos sensibles y consentimiento:** permisos por aplicación, por dispositivo y por solicitud al Coach; explícitos, auditables y revocables; privacidad y retención definidas antes de usar Salud real.
6. **Integración de la IA:** límites de coste, revisión del proveedor, minimización del contexto, retención, cumplimiento y observabilidad antes de agregar modelos reales.
7. **Push real:** VAPID/infraestructura de entrega, APNs/FCM según plataforma, control opt-in, permisos del navegador, suspensión y revocación.
8. **Experiencia de producto:** probar Chrome/Edge/Safari reales, iPhone y Android, accesibilidad, teclados virtuales, persistencia bajo presión de almacenamiento, recuperar navegador después de cerrar sesión, estados sin red y actualización del SW.
9. **Auditoría:** pruebas de amenazas, XSS/CSP, exposición en respaldos, tablas de cuenta ajena, concurrencia, cuotas, cifrado, logs, dependencias, políticas de seguridad y pruebas en Cloudflare de los endpoints reales.
10. **Arquitectura V12:** clarificar una sola fuente de verdad de datos, versión canónica del esquema, adaptador de almacenamiento offline, capa API segura y estrategia de despliegue gradual con reversión.

**V11.8 recomendada:** auditar arquitectura y contratos de integración; evitar agregar más funciones de laboratorio que simulen una plataforma real sin cerrar estos puntos primero.
