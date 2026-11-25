# Estado de integración tras V11.14

| Componente | Estado |
|---|---|
| Autenticación Google y sesiones Cloudflare | Real, staging, cuenta permitida |
| Base D1 por cuenta | Real, staging, datos ficticios |
| Cifrado antes de enviar | Real, código de recuperación separado |
| Copias y control de revisiones | Funcional en staging, límite de 20 |
| Resguardo frente a conflictos y cortes | Laboratorio V11.13 reutilizado |
| Estética de V10.6 | CSS original reaprovechado, sin editar la aplicación personal |
| Interfaz completa de V10.6 | **NO integrada todavía** |
| Migración real del historial | **NO habilitada** |
| Coach IA original | **NO integrado** |
| Apple Salud y push | **NO integrados** |
| Recuperación de clave/cuenta | Pendiente de diseño y validación |
| Publicación para terceros | Prohibida hasta auditoría de privacidad y seguridad |

**Próxima entrega útil:** integrar un módulo real (por ejemplo el diario nutricional y de entrenamiento) detrás de Google sin incorporar datos personales aún; definir migración reversible; aplicar aislamiento por cuenta a las claves locales y a los almacenes IndexedDB. No considerar V12.0 lista simplemente porque funcionen pruebas sintéticas.
