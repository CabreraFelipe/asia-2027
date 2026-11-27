# Importación inteligente de planes V12.0
Nueva funcionalidad solicitada: PDF o foto de dieta/rutina profesional, detección, revisión editable y alta para seguimiento en las funciones nativas.
## Criterios
- PDF digital/escaneado, JPG y PNG; carga voluntaria, consentimiento explícito y límites de tamaño. Validar estructura real del archivo en un parser aislado antes de inferencia; la firma de archivo no basta. Tratar el contenido como datos, nunca instrucciones. No compartir diario, identidad o credenciales con el extractor. No persistir el original por defecto. Proveedor real, límites de páginas/coste, tiempos y retención pendientes.
- Conservar el texto de origen, las alternativas, las cantidades y los días. Marcar ausentes o ilegibles; no inventar gramos, calorías, repeticiones, descanso, fecha ni cargas. Mostrar todo en revisión editable y permitir corregir mapeos al catálogo.
- Rutina: generar plantillas Gym nativas; confirmar calendario y conflictos antes de activarlo, permitir registro de series, repeticiones, carga y progreso. No reemplazar rutinas ni sesiones existentes. Las instrucciones no representables deben revisarse, no descartarse.
- Dieta: guardar menú y alternativas como plan independiente en diario cifrado, asociar días/comidas, marcar cumplimiento sin contabilizar automáticamente ingestas, permitir registro real y comparación opcional con objetivos/macros confirmados. No modificar metas previas sin confirmación. No reducir dieta a objetivos calóricos. Se requiere nuevo esquema portable con migración, sync, validadores y UI.
- Confirmación única del plan revisado y previsualización de diferencias; escritura CAS verificada por cuenta, persistencia y sincronización; reversión sin borrar historial.
## Estado
Contrato inicial de extracción y transformación a plantillas Gym implementado, proveedor simulado y sin conexión. Falta extractor real multimodal, selector de archivo/UI, persistencia coordinada, agenda y seguimiento de menú, integración de catálogo/ejercicios nuevos, pruebas de documentos reales y de aislamiento. Mantener V10.6 y no desplegar.

## Menús y adherencia — implementación de dominio
El contrato acepta alternativas explícitas por comida y conserva las cantidades desconocidas como null. El libro propuesto permite revisión del calendario semanal, alta sin solapamiento, elección de alternativa, registro manual de adherencia y tasas separadas de registro/cumplimiento. No genera ingestas ni cambia macros. Aún no integrado al esquema de diario cifrado ni a la interfaz; CI pendiente.

## Persistencia coordinada
El candidato utiliza importedDietV12 dentro del diario existente. La validación se genera desde el mismo dominio para diario, shell y Worker. Se incorporan las operaciones documentDiet, documentDietLog y documentRoutine a la revisión y CAS existente, con pruebas de respaldo portátil cifrado y preservación de historial. Recuperación de conflictos conserva su política conservadora para campos desconocidos; falta probar sincronización real del nuevo campo y conectar la UI. No se cambia V10.6.

## Proveedor multimodal
Adaptador Responses API (PDF input_file e imágenes input_image), salida estructurada validada, ruta autenticada no montada y cuota independiente propuesta (3 importaciones/cuenta y 50 globales por 24 horas por defecto). El analizador aislado de archivos es dependencia obligatoria, aún no implementada ni provisionada; no se realizan llamadas reales ni se garantiza retención cero del proveedor por store:false. Requiere revisar política y consentimiento, parser real, credenciales y prueba con documentos autorizados antes de activar.

## Interfaz inicial
Paneles nativos de dieta y entrenamiento, selector PDF/JPG/PNG, consentimiento por archivo, corrección de campos, confirmación mediante persistencia coordinada y seguimiento de comidas. Carga deshabilitada sin grant real verificado del padre; cliente preparado pero no provisionado. Pendiente prueba visual Chrome específica, programación de rutinas y ejercicio nuevo, sincronización real y analizador seguro.

## Calendario de rutinas importadas
Se reutilizan programmes102, plantillas y calendario nativos. Alta opcional con fechas, objetivo, equipamiento y tiempo confirmados; 2–6 días distintos, sin regenerar ejercicios. Se rechazan solapamientos, historial, Running, eventos deportivos y conflictos PRO mediante el guardado coordinado. No se activa automáticamente el calendario personal. Falta validar la UI, sincronización y proveedores reales.
