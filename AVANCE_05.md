# Asia 2027 · V8.9.2

## Cambios realizados
- Rediseño del bloque **Coach IA / check-in diario** en Inicio.
- Reemplazo de selects por una interfaz tipo **escala 1–5** más visual e intuitiva, con barra de progreso y estados guardados.
- Accesos rápidos arriba del coach: **Revisar registro**, **Registrar peso**, **Actualizar Salud**.
- Nueva tarjeta de **detección inteligente de estancamiento** basada en medias móviles de 7 días y cobertura reciente.
- Botones contextuales desde esa tarjeta para ir a **Progreso** o **Revisar metas**.
- Actualización de versión visible en cabecera y estado local a **V8.9.2**.
- Service worker actualizado con nuevos hashes y nueva caché `asia-2027-v892-20261117`.

## Archivos modificados
- `coach89.js`
- `progress818.js`
- `v4.css`
- `index.html`
- `ui85.js`
- `sw.js`

## Notas de diseño
- No se tocaron datos del usuario.
- La detección de estancamiento es descriptiva; **no cambia metas automáticamente**.
- El Coach sigue siendo local en este bloque: no envía nada a OpenAI.
