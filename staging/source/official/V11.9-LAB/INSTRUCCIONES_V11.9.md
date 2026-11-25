# Asia Platform V11.9 — consolidación de laboratorio previa a beta

**Laboratorio local únicamente.** No instala nada sobre la V10.6 original. No despliega a GitHub ni a Cloudflare; no utiliza cuentas reales ni datos personales. Se necesita Node.js 20+ (22 recomendado) y Chrome/Edge.

## Instalación segura: carpeta NUEVA

1. Extraé el ZIP en una carpeta distinta de `v11.0` y de los laboratorios anteriores. Abrí PowerShell **dentro de `V11.9-LAB`**.
2. Ejecutá **un único preflight**:

```powershell
node scripts/preflight119.mjs
```

El final esperado es:

```text
V11.9 PREFLIGHT: VALIDADO OFFLINE. Sin Cloudflare, sin datos personales, sin despliegue.
```

3. Si el servidor anterior V11.8 sigue activo, detenelo con `Ctrl+C` antes de continuar. Ejecutá:

```powershell
node scripts/serve119.mjs
```

4. En Chrome, abrí `http://127.0.0.1:4177/v119/`. **Debe figurar `v11.9` en el encabezado.** El diseño CSS es exactamente el de V11.7/V11.8; no hay rediseño. Detené el servidor con `Ctrl+C`.

**Continuidad con V11.7/V11.8:** se mantiene el origen `127.0.0.1:4177` y el nombre de IndexedDB `asia-v117-demo-only`, así que las cuentas de prueba deberían continuar apareciendo si usás el mismo perfil y puerto. No borres los datos del sitio. Si cambias el puerto, será un origen y almacenamiento distinto.

## Prueba manual útil (5 pasos, solo datos ficticios)

1. Abrí una **cuenta ficticia** existente; si no hay ninguna, creá una con una **frase inventada de al menos 16 caracteres**. No uses contraseñas reales.
2. En Diario, guardá **dos registros de prueba distintos**. En **Versiones**, verificá que aparezcan las revisiones sucesivas.
3. Tocá **Exportar historial cifrado completo (V11.9)**. Se descarga un JSON cifrado con **todas las revisiones existentes** y los borradores pendientes (si los hay). Su catálogo de contenido está autenticado por cifrado AES-GCM.
4. Abrí **un perfil diferente** de Chrome, otra instancia de navegador o una ventana de incógnito, siempre usando `http://127.0.0.1:4177/v119/`; elegí **Importar respaldo cifrado de laboratorio**. Seleccioná el JSON y escribí la frase ficticia de la cuenta de origen. Debe importar todas las revisiones y permitir recuperar las anteriores. En el perfil original no se borra ni modifica nada.
5. Intentá importar de nuevo el mismo archivo en el perfil receptor: debe rechazar la duplicación. También podés modificar una copia del archivo para comprobar que se rechace **sin crear una cuenta parcial**. No toques el archivo original de respaldo.

Si una cuenta venía de una exportación **solo HEAD de V11.7/V11.8**, es imposible recuperar versiones no presentes en la base original; el archivo V11.9 lo identifica con `historyComplete:false` (y no afirma que están). Para recuperar borradores, abrí la sección **Conflictos**.

## Lo que este paso NO hace

- No da acceso a usuarios reales, SSO ni recuperación de contraseñas.
- No sincroniza dispositivos físicos por Internet.
- No conecta Apple Salud, notificaciones reales ni un modelo de IA.
- No migra el diario personal V10.6 ni su D1 de Salud.
- No envía el nuevo JSON a Cloudflare. El módulo `cloud-bridge119.mjs` prueba **offline** que un estado sintético se puede cifrar como `asia84-encrypted-v1`, forma aceptada por la API de staging, pero **no implementa propiedad segura de claves, credenciales ni red**.

**Antes de V12.0 real:** leer `AUDITORIA_V11.9.md` y `CONTRATO_IDENTIDAD_V11.9.md`. G01, G02 y otros bloqueos permanecen abiertos o parcialmente resueltos. No habilitar datos personales en staging experimental.
