# Asia Platform V11.8 — Auditoría e integración (laboratorio local)

**Versión de interfaz:** v11.8. **Diseño:** el mismo CSS de V11.7, sin rediseño. La aplicación personal V10.6 no se modifica ni recibe cambios de apariencia o de datos. Sin Cloudflare, sin GitHub, sin contraseñas reales y sin Apple Salud.

## Instalación — dos comandos

1. Descomprimir el ZIP en **una carpeta nueva** y abrir PowerShell dentro de `V11.8-LAB`.
2. Ejecutar una única auditoría offline:

```powershell
node scripts/preflight118.mjs
```

Este comando verifica los hashes del ZIP, conserva exactamente el CSS de V11.7, ejecuta todos los tests desde V11.0 hasta V11.8 y comprueba el servidor HTTP de loopback. Si hay un fallo se detiene con error y NO se despliega nada.

3. Para abrir la interfaz:

```powershell
node scripts/serve118.mjs
```

Entrar en **http://127.0.0.1:4177/v118/** desde Chrome o Edge. No ejecutar ambos servidores a la vez en el mismo puerto: si V11.7 sigue abierto, detenerlo primero con `Ctrl+C`. El servidor se termina con `Ctrl+C`.

**Muy importante:** abrir `/v118/` (no `/web/`). Se usa una ruta nueva precisamente para evitar mostrar HTML y JavaScript antiguos desde el Service Worker de V11.7. El laboratorio conserva el mismo origen `127.0.0.1:4177` y la base `asia-v117-demo-only`; las cuentas ficticias existentes deberán seguir visibles en Chrome con el mismo perfil.

## Prueba manual esencial (únicamente datos ficticios)

1. Ver en la cabecera **v11.8**. Comparar el diseño con V11.7: se mantienen colores, tipografía, estructura y estilo de las tarjetas.
2. Crear una cuenta ficticia A (o abrir una ya existente), guardar una nota ficticia, abrir **Versiones** y seleccionar **Exportar copia de laboratorio**. Se descarga un JSON **cifrado**. Nunca contiene la frase.
3. Para probar recuperación sin sobrescribir nada, usar otro perfil de Chrome, un navegador diferente o la navegación de incógnito, en la misma URL local. En la pantalla inicial, usar **Importar respaldo cifrado**, seleccionar ese JSON, ingresar el nombre ficticio y la **misma frase de prueba original**. Debe importar con éxito. Bloquear y abrir la cuenta recuperada: la nota debe aparecer.
4. Repetir la importación en el mismo perfil: debe rechazarla para no duplicar/sobrescribir datos.
5. Probar una frase incorrecta y un archivo editado sobre otra cuenta de prueba: ambos deben ser rechazados sin dejar cuentas parciales.
6. Si ya había cuentas ficticias de V11.7 en el perfil normal de Chrome, comprobar que continúan presentes. **No borrar los datos del sitio ni cambiar el origen/puerto** si deseás conservarlas.

## Qué se verificó y qué NO

- Pruebas automatizadas locales de importación, exportación, sobre cifrado, integridad, revocación de permisos, aislamiento, CAS, bloqueo por conflicto, no sobrescritura y continuidad V11.7 → V11.8.
- Servidor restringido a `127.0.0.1`; cabeceras CSP; rutas de API y métodos de escritura bloqueados. No hay conexión a Internet desde estos scripts.
- CSS V11.7/V11.8 **idéntico byte por byte** y versiones visibles separadas.
- No se comprobó de manera automatizada la interacción final con Chrome, porque el navegador headless del entorno de construcción no pudo completar su arranque. Se requiere la prueba manual anterior.
- No se validaron actualizaciones remotas, la última rotación del token de operador ni sincronización real entre dos dispositivos físicos.

## Estado de producto

La auditoría `AUDITORIA_V11.8.md` incluye **11 bloqueos** para V12.0, varios críticos. Esta etapa cierra el laboratorio y define una compuerta de integración, **no habilita una beta pública ni acceso de usuarios reales**. El próximo trabajo técnico recomendado es V11.9: consolidar identidad, contratos de cifrado/sincronización y diagnósticos remotos seguros antes de aprobar V12.0.
