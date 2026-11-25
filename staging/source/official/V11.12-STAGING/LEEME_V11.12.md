# Asia 2027 — V11.12 integración de Google + D1 (STAGING)

Esta entrega es un paquete **completo**; no requiere instalar parches anteriores ni modificar los secretos OAuth. La carpeta `V11.11-STAGING` incluida preserva el último parche V11.11d y sus pruebas como referencia. La nueva `V11.12-STAGING` lleva su propio archivo de despliegue.

## Dos comandos para la integración

1. Descomprimir el ZIP **en carpeta nueva**. Abrir PowerShell dentro de `V11.12-STAGING`.
2. Pegar el siguiente bloque (valida offline y despliega únicamente si pasa):

```powershell
node scripts/preflight1112.mjs
if ($LASTEXITCODE -eq 0) {
  npx.cmd --yes wrangler@4.165.0 deploy --config wrangler.integrated.toml
}
```

Debe indicar `V11.12 PREFLIGHT: VALIDADO OFFLINE.` antes de desplegar. Wrangler debe indicar exclusivamente el Worker `asia-v1111-identity-staging`. **No aplicar migraciones, no volver a crear secretos, no modificar producción.**

3. Abrir la ruta [staging V11.12](https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev/v11.12/) en Chrome. Iniciar sesión con Google (la cuenta de prueba ya autorizada). Crear una clave aleatoria, **guardar el código de recuperación que se muestra una sola vez**, agregar actividades ficticias y luego actualizar. En otro navegador, iniciar sesión con la misma cuenta Google, importar el código y comprobar que aparezcan las mismas actividades ficticias. Si se abre con otra cuenta Google de prueba autorizada, debe aparecer vacío.

## Alcance concreto

- Login real de Google y sesiones existentes V11.11d, verificación por servidor.
- Datos cifrados *en el navegador* con PBKDF2 600.000 iteraciones, AES-256-GCM y una clave aleatoria de 256 bits generada por el cliente. La base D1 recibe solo el sobre cifrado. No se solicita contraseña propia de Asia.
- Las claves PBKDF2 no extraíbles se guardan en IndexedDB, por cuenta verificada. La clave de recuperación se muestra al generarla, y se introduce manualmente en otro navegador si se quiere descifrar allí. Google **no** puede recuperarla. Perder todas las copias de ese código y las claves almacenadas significa perder acceso a los contenidos cifrados.
- Actividades sintéticas exclusivamente predefinidas. No hay campos de texto libre en la prueba.
- Revisiones por cuenta, guardado condicional con conflictos HTTP 409. Borradores en conflicto quedan únicamente en memoria de la pestaña.
- El diseño CSS es **idéntico** al del laboratorio anterior V11.9. La aplicación personal de producción V10.6 no se modifica.

## Cambios en Cloudflare

La nueva config `wrangler.integrated.toml` apunta al **mismo Worker aislado** y la misma D1 staging: no crea ni modifica migraciones. Cambia `main` al Worker integrado y activa `STAGING_ALLOW_SYNTHETIC_SNAPSHOTS = "true"` para permitir almacenamiento cifrado de **datos exclusivamente ficticios** bajo sesión Google autorizada. No cambia secretos ni el nombre del Worker. Para desactivar nuevamente las escrituras sintéticas, desplegar el archivo anterior `wrangler.identity.toml` del paquete V11.11d (tras preflight) y verificar que su variable está en `false`.

## Limitaciones y pendientes

No es la interfaz original de la PWA V10.6; es una pantalla técnica de integración con el CSS del laboratorio. No importa datos personales, no conecta Salud/IA/push, no sincroniza automáticamente sin compartir el código de recuperación y no ofrece recuperación del código de cifrado. La activación de datos sintéticos NO constituye autorización para subir datos personales.

Para V12.0 siguen pendientes autenticación multi-proveedor/recuperación, auditoría independiente, gestión de claves recuperables, pruebas multiplataforma reales, procedimientos de continuidad y migración segura de V10.6.

No compartir el `csrf`, la cookie de sesión, códigos de retorno OAuth ni el código de recuperación. Nunca copiar capturas de esos valores.
