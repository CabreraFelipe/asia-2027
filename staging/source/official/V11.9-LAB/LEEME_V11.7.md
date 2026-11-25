# Asia Platform V11.7 — Interfaz responsive y bóveda local (LAB)

**Estado:** laboratorio offline para cuentas ficticias; **no desplegar**. No modifica la PWA personal V10.6, Cloudflare, GitHub, ni los datos médicos o de entrenamiento reales.

**Requisitos:** Windows/macOS/Linux con Node.js 22.13+ y Chrome o Edge reciente. No requiere npm, credenciales, Internet, Workers ni migraciones. Se probó el motor local y las regresiones; queda pendiente la validación visual e interacción final en Chrome de tu computadora.

## Paso 1: probar

Descomprimí `Asia_2027_V11.7_Experiencia_Multiplataforma_LAB.zip` en una **carpeta nueva**. Abrí PowerShell dentro de `V11.7-LAB` y ejecutá solamente:

```powershell
node tests/test117.mjs
```

Resultado esperado:

```text
V11.7: 82 pruebas unitarias + 57 comprobaciones de integración offline. Sin red externa, sin datos personales, sin despliegue.
```

También se ejecutaron las regresiones de V11.0–V11.6 desde el paquete, sin errores.

## Paso 2: abrir la interfaz (opcional, recomendado)

Desde la misma carpeta ejecutá:

```powershell
node scripts/serve117.mjs
```

Abri **Chrome** en:

**http://127.0.0.1:4177/web/**

Dejá PowerShell abierto mientras navegás. Para detener el servidor, presioná **Ctrl+C**. El servidor **solo escucha en tu propia computadora** (`127.0.0.1`). No hay APIs de Internet, acceso externo ni servidores Cloudflare.

**No abras `web/index.html` con doble clic:** los módulos ES, el cifrado WebCrypto y el almacenamiento IndexedDB requieren un contexto de navegación adecuado. Usá la URL anterior.

## Prueba manual recomendada de la interfaz

1. Creá una cuenta llamada `Cuenta ficticia A`, con una frase inventada de al menos 16 caracteres, **que no uses en ninguna otra aplicación**.
2. Abrila con esa misma frase, agregá un registro en **Diario** y una muestra en **Salud**. Cerrá la pestaña y volvé a abrir: desbloqueá la cuenta y verificá que persistan.
3. En **Coach**, activá el permiso de Salud y generá una vista previa: solo esa categoría aparece. Desactivá el permiso: deja de aparecer. No hay ninguna petición a un modelo real.
4. Creá `Cuenta ficticia B` con **otra** frase inventada. Verificá que su diario, Salud, memoria y revisiones estén separados.
5. Para ensayar un conflicto: abrí dos pestañas con la **misma cuenta**; ambas deben estar desbloqueadas en la misma revisión. Guardá un registro en la primera; guardá otro registro sin actualizar la segunda. La segunda recibirá un conflicto, preservará un borrador cifrado y **no pisará** la primera. En **Conflictos** podés inspeccionar el borrador; no se aplica automáticamente.
6. En **Versiones**, elegí una versión anterior y recuperala con confirmación. Se crea **otra revisión**, sin borrar la anterior.
7. Opcional: en Chrome abrí las herramientas de desarrollo (**F12** → **Toggle device toolbar** o **Ctrl+Shift+M**) para verificar el diseño en tamaño de teléfono. **Esta simulación no equivale a probar un teléfono físico.**

Usá solamente ejemplos falsos. Nunca subas información de Salud real ni contraseñas personales.

## Qué implementa realmente

- Página web responsive (`web/index.html`, `web/styles.css`, `web/app.mjs`), versión visible `v11.7`, manifiesto de instalación y Service Worker de **laboratorio** `asia-v117-lab-static-1`.
- Dos o más cuentas de ejemplo diferenciadas localmente; máximo ocho. **No hay registro ni login real en un servidor.** Los nombres se guardan en claro como metadatos de prueba.
- Bóvedas AES-256-GCM por cuenta en IndexedDB, clave derivada de una frase ficticia con PBKDF2-SHA256 160.000 iteraciones **en el navegador**, sal y IV aleatorios; el dato se liga por AAD a la cuenta, el tipo de registro y la revisión. La frase y la clave no se escriben en IndexedDB.
- Diario, vista previa de Coach, permisos individuales, memoria explícitamente aprobada y muestras de Salud **sintéticas**, utilizando validadores de V11.5/V11.6.
- Control de escrituras condicionales tipo CAS usando transacción `readwrite` de IndexedDB, historial de hasta 100 revisiones, restauración no destructiva y borradores cifrados cuando otra pestaña modificó el estado.
- Exportación **cifrada** del estado de laboratorio (formato propio de V11.7). Todavía **no** existe la importación de ese archivo.
- Un servidor Node.js estático que solo escucha en loopback, permite GET/HEAD de archivos conocidos, impide POST y utiliza CSP; no puede hacer peticiones a Cloudflare.

## Límites y seguridad

- **Aislamiento local de interfaz y cifrado de demostración, no una frontera de seguridad multiusuario.** Las cuentas no se validan en un backend; una extensión maliciosa o alguien con acceso a tu navegador puede modificar el almacenamiento.
- El nombre de cada cuenta, ID, revisiones y fechas de creación son metadatos visibles sin descifrar. El contenido del diario, Coach, permisos y Salud se cifra.
- Las frases inventadas de prueba pueden ser vulnerables a diccionarios: **no ingreses información real**.
- IndexedDB vive en el perfil y origen del navegador. Cambiar de navegador, dispositivo, puerto u origen no comparte esos datos; borrar datos del sitio puede eliminarlos.
- La UI es responsive, pero **no** sincroniza iPhone ↔ computadora, no accede a Apple Health, no envía push y no llama a OpenAI ni a otros modelos.
- La exportación no sustituye un respaldo recuperable hasta disponer de una importación verificada; tampoco existe recuperación de frases olvidadas en este laboratorio.
- Un conflicto persiste como borrador cifrado para revisión; **no** se fusiona ni se publica automáticamente. Se requiere decisión del usuario para reconciliarlo.
- Los scripts de V11.7 no incluyen `wrangler` ni secretos y no usan la base D1 real.
- Para eliminar los datos de este laboratorio en Chrome, usá la configuración de datos del sitio para `127.0.0.1:4177`. No se borra nada de producción.

## Archivos de esta versión

- `web/vault117.mjs`: motor de bóveda, criptografía, IndexedDB, memoria, CAS y restauración.
- `web/app.mjs`, `web/index.html`, `web/styles.css`, `web/manifest.webmanifest`, `web/sw117.js`, `web/icon.svg`: interfaz y recursos.
- `scripts/serve117.mjs`: servidor HTTP local restringido.
- `tests/test117.mjs`: pruebas de estado, identidad ficticia, cifrado, fraude de datos, revocación de permisos, concurrencia, historial, borradores y continuidad.
- `CAMBIOS_V11.7.md`: cobertura y decisiones de implementación.
- `PENDIENTES_V11.7.md`: pendientes reales antes de V12.0.
- `SHA256_V11.7.txt`: huellas de los archivos del paquete.

**Siguiente paso recomendado:** V11.8 — auditoría técnica y puente controlado. No se deben importar datos personales ni habilitar cuentas reales hasta contar con autenticación, recuperación, pruebas de navegador y revisión de seguridad completas.
