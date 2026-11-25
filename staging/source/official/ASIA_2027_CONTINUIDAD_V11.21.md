# Asia 2027 · Continuidad V11.21

Fecha: 24/11/2026. Base: V11.18 instalada según el usuario; ZIP corregido, ruta Worker STAGING.

Esta entrega reúne V11.19 (identidad visual), V11.20 (Inicio y accesos rápidos) y V11.21 (Salud/Progreso y resumen local) en una sola actualización instalable. Se recuperó la navegación real V10.6: Inicio, Dieta, Gym, Salud, Progreso; Cuenta en cabecera. Tema azul marino/dorado.

**Alcance real:** interface integrada sobre el diario sintético V11.15 y todas las operaciones de V11.18. No hay importación V10.6, Health, IA real, offline garantizado, metas reales, conexión a producción, migración SQL o alta pública. Las pestañas Salud y metas están señaladas como no disponibles.

Worker: src/worker1121.mjs; assets src/assets1121.mjs; nuevo web121/. V11.11-V11.18 heredadas byte por byte, excepto wrangler.preview.toml con entrada 1121; staging-only. Status público de staging pasa a 11.21. Autenticación Google mantiene cookies y callback con cookie de retorno propia.

Seguridad: la UI no cambia esquemas, claves, cifrado, índices D1 ni permisos. Instalar manualmente con respaldo D1 de staging y precheck de V11.18. Código en repositorio personal V10.6 no modificado.

Próximas mejoras recomendadas: V11.22 UX real probada en iPhone/Windows y corrección de incidencias; V11.23 integración progresiva de capacidades ficticias y seguridad; V11.24 QA de migración sin datos reales; eventual V12 plan de cuentas/privacidad bajo revisión. No prometer equivalencia funcional V10.6 hasta completar la integración.

**Hotfix de ruta:** la URL V11.21 no estaba publicada; el estado remoto verificado devolvió V11.17 y /v11.18/ devolvió 404. Nuevo paquete instalable acepta transición directa V11.17 -> V11.21 o V11.18 -> V11.21 (misma V11.21 final, precheck y mensajes actualizados; Worker y base intactos). No se realizó despliegue desde ChatGPT.

**Hotfix Windows ESM:** el test de precheck con importación dinámica fallaba en C:; ahora transforma la ruta con `pathToFileURL`. El cambio es solo de test/doc; todos los módulos, workers y bases permanecen intactos.
