# Permisos de despliegue staging

Actualización posterior a la prueba exitosa 45533706616. Cloudflare documenta autorización granular por Worker desde septiembre de 2026: https://developers.cloudflare.com/workers/authorization/workers/ y https://developers.cloudflare.com/workers/authorization/.

Decisión: solicitar un token de cuenta (Manage Account > Account API Tokens), scope Individual/Specified Workers, únicamente asia-v1111-identity-staging, rol Editor, 90 días. No Workers Scripts Edit a nivel de producto, Admin, Routes ni D1 directo. Mantener el token de lectura actual separado hasta validar el nuevo. El rol Editor permite desplegar el Worker existente y sus bindings; no otorga acceso directo a D1. El código del Worker sí puede acceder a sus bindings, por lo que se debe comprobar el destino y preservar los controles sobre datos.

Crear entorno separado asia-staging-deploy con rama development/multiuser y aprobación del propietario, sin bypass de administradores, secretos propios (CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID). Primero prueba GET sin cambios con token granular, después flujo de despliegue explícito, preflight, smoke y reversión. No desplegar V11.25 candidato. V11.24 sigue siendo versión confirmada, main intacta. No se ha concedido escritura ni realizado despliegues en esta etapa.
