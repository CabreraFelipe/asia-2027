# Asia 2027 — V11.22 a V11.24 (entrega acumulativa, STAGING)

Base confirmada en Cloudflare: V11.21. No contiene migraciones SQL ni rutas nuevas de escritura.

- **V11.22**: Inicio con actividad reciente de ejemplo y panorama semanal; se conservan las cinco pestañas y la Cuenta independiente.
- **V11.23**: barras semanales accesibles y filtro de historiales de Dieta/Gym (enero 2026, exclusivamente registros ficticios). Sin IA, sin diagnóstico, sin datos de Salud.
- **V11.24**: ajustes de densidad y acento visual guardados localmente por cuenta mediante IndexedDB; hardening del instalador, validación de rutas, prueba de actualizacion de V11.21 a V11.24 y regresiones históricas.

Conservado byte a byte: V11.11–V11.21 y toda la lógica de seguridad, cifrado y backups. Los únicos cambios en el Worker nuevo son los recursos estáticos V11.24, cookie de retorno OIDC y versión del endpoint de estado. La base D1 se respalda antes del despliegue pero no se migra.

PENDIENTE: revisión visual real en Chrome Windows e iPhone; integración V10.6 completa, Apple Salud, Xiaomi, IA real, rutina avanzada, metas múltiples y subida de datos personales. Ninguna función se simula como disponible.
