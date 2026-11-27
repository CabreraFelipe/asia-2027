# Activación de acceso Google gestionado — piloto sintético
Estado: preparación, no autorización de despliegue. El propietario acepta empezar con un perfil de prueba vacío, sin recuperar su frase. V10.6 y datos personales quedan fuera.
## Requisitos
- Candidato con CI de paquete, OIDC simulado firmado, D1/R2 local y Chrome normal/lento aprobadas; revisar cambios exactos.
- Ambiente protegido asia-v12-pilot y aprobación separada del cambio de esquema/configuración; el procedimiento anterior solo permite actualización de código.
- Verificar Worker asia-v1142-candidate-staging, origen exacto, D1 y R2 existentes y marcador staging. No tocar recursos de producción.
- Crear copia verificable de D1 y conservar R2 y bóvedas locales. No copiar secretos a Git ni logs.
- Configurar KEK aleatoria de 32 bytes, codificada base64url canónica, secreto de Worker dedicado y versión estable; custodiar respaldo seguro. No derivar de Google, no rotar ni reemplazar durante esta operación.
- Aplicar únicamente 0010, 0015 y 0016 propuestas, en ese orden, en la D1 sintética verificada, verificando esquema y triggers. 0011 y rekey remoto no se habilitan. No cambiar filas de perfiles existentes en el rollout.
- Publicar candidato y activar STAGING_ALLOW_MANAGED_KEYS_1152 y STAGING_ALLOW_PILOT_FRESH_PROFILE_V12, con STAGING_MANAGED_KEK_ID_1152 correspondiente. Confirmar bindings pre/post, huella pública y acceso anónimo denegado al diario y clave. No activar servicios reales.
- Si falla, detener sin repetir escrituras ni modificar KEK. Tras creación de sucesor, no revertir a un Worker que desconozca el mapeo; el trigger de sesiones bloquea acceso al perfil anterior. Preservar registros y corregir hacia delante.
## Aceptación física
Con Google ya autenticado en piloto, elegir «Olvidé la frase: empezar con un perfil de prueba vacío», confirmar y volver a Google. Debe abrir el diario sin frase. Guardar solo datos ficticios; cerrar sesión y abrir en otro dispositivo, comprobar perfil y sincronización; cuenta B independiente. No declarar cierre hasta comprobación física. El perfil anterior sigue separado y cifrado, no se promete recuperar sin frase.
