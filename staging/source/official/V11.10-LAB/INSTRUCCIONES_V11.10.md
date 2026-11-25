# V11.10 — Instrucciones para Windows / PowerShell

## Preparación

1. Descargar el ZIP `Asia_2027_V11.10_Identidad_Sin_Contrasena_LAB.zip`.
2. Descomprimirlo en **una carpeta nueva**. El ZIP contiene `V11.9-LAB` intacto y `V11.10-LAB` nuevo.
3. Abrir PowerShell dentro de **`V11.10-LAB`**, no dentro de la carpeta vieja `v11.0`.
4. Usar Node.js **22 o superior** (`node --version`). No se necesitan `npm install`, Wrangler, cuentas ni secretos.

## 1. Comprobar

```powershell
node scripts/preflight1110.mjs
```

Salida esperada:

```
V11.10: 50 comprobaciones de contratos + 84 comprobaciones HTTP/OIDC locales.
Sin contraseñas, sin datos personales, sin Internet, sin despliegue.
V11.10 PREFLIGHT: VALIDADO OFFLINE.
```

## 2. Probar en Chrome

Detener antes cualquier servidor V11.9 en 4177 mediante `Ctrl+C`.

```powershell
node scripts/serve1110.mjs
```

Abrir `http://127.0.0.1:4177/v1110/`.

- Pulsar **Continuar con proveedor ficticio**.
- Elegir **Persona de prueba A**. No solicita contraseña.
- Escribir y guardar una nota inventada para A.
- Cerrar sesión.
- Iniciar como **Persona de prueba B** y verificar que no aparece la nota de A.
- Volver a entrar como A y comprobar que la nota A sigue allí (solo mientras el servidor esté encendido).
- Utilizar **Cerrar todas mis sesiones** y comprobar que deja de permitir consultas con la sesión anterior.

El servidor se detiene con `Ctrl+C`. No se guarda información de personas reales. El resultado usa el perfil de Chrome únicamente para almacenar la cookie HttpOnly de prueba.

## Si falla

- `EADDRINUSE` / no abre: detener el servidor anterior de V11.9 y cualquier otra aplicación en puertos 4177 o 4178.
- `401` al consultar `/auth/me` antes de entrar es **correcto**.
- Si el IdP dice "Solicitud rechazada", volver a `http://127.0.0.1:4177/v1110/` e iniciar un flujo nuevo: los códigos duran unos dos minutos y solo se usan una vez.
- Si abrís una segunda identidad en el mismo perfil de Chrome, reemplazará la sesión activa de ese perfil. Para sesiones paralelas usar un perfil separado o incógnito.
- Si el preflight falla, compartir solo el **error**; nunca copiar tokens, cookies, enlaces de callback ni datos privados.

## Importante

- No ejecutar Wrangler. No realizar migraciones D1. No cambiar secretos. No subir el ZIP a GitHub Pages ni desplegar `mock-provider1110.mjs` en Cloudflare.
- La interfaz V11.9 anterior y la app original V10.6 permanecen intactas.
- No es la incorporación de usuarios reales: es el prototipo del contrato de identidad que utilizaremos al contratar/configurar un IdP real.
