# Puertas abiertas para ofrecer Asia a personas reales

1. **Proveedor real**: Google OIDC implementado en un Worker aparte, pero NO validado en Cloudflare ni con un cliente OAuth real.
2. **Aislamiento**: snapshots por account ID y CAS ensayados en SQLite real, pero pendiente test remoto cross-user en staging con varios usuarios autorizados.
3. **Criptografía de bóveda**: el sobre aceptado solo verifica la forma del contenido. Se necesita gestión, recuperación y rotación de claves por usuario sin acceso del servidor a datos sin cifrar.
4. **Interfaz V10.6 y mismo origen**: el Worker usa cookies `SameSite=Lax` de primera parte y la PWA actual está en otro origen. La integración requerirá desplegar la interfaz y la API bajo un mismo origen o establecer un BFF/proxy revisado; NO habilitar CORS con credenciales de forma indiscriminada. La interfaz original: NO se integró el nuevo login con las pantallas originales. No cambiar sus estilos sin aprobación.
5. **Dispositivos físicos**: no hay sincronización persistente real, offline queues, Safari/Android ensayados o push real.
6. **Datos sensibles**: falta revisión de privacidad, minimización/retención/eliminación, consentimiento, sanitización de logs y evaluación independiente.
7. **Seguridad de la identidad**: MFA/passkeys dependen de configuración real del proveedor; faltan limitación de tasa distribuida por origen, alertas, expiración/limpieza de sesiones y revisión de infra.
8. **Staging existente**: autenticar un usuario real no equivale a importar la información V10.6 ni a validar la recuperación de Salud en D1.

No abrir registro público ni almacenar Salud real hasta cerrar todas las puertas correspondientes.
