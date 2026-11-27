# Separación de configuraciones personales — inventario inicial V12.0
Fuentes inspeccionadas en cc2f0d0: core105.js, schedule829.js, nutrition103.js, v42.js, index.html, patch-planning1173.mjs y onboard1176.js. Solo candidato; no tocar raíz V10.6.
| Dependencia | Evidencia | Criterio de aceptación |
|---|---|---|
| Meta y plazo | core105.asia targetKg 72, deadline 2027-03-08; libro goals101 originalmente implícito | Libro no configurado vacío; no countdown sin fecha; preservar libros explícitos. |
| Fuerza | schedule829.base lunes/martes/jueves/viernes dentro de core105.active | Sin programa confirmado, no sesiones previstas; catálogo y registro manual siguen disponibles. Preservar programas, sesiones y referencias guardadas. |
| Calendario | core105.asia.start, deadline y vacationStart/End; v42.nextSession902 y renderExperience902 | No etiquetar vacaciones, inicio ni fin de programa de otra persona. Separar calendario histórico de planificación personal y comprobar conflictos de Running/deporte. |
| Nutrición | core105.defaults 2000 kcal / 150 g; nutrition103.applyPlan exige metas anteriores válidas; v42.nutritionDay871 vuelve a defaults | Sin objetivos explícitos, mostrar consumo registrado sin porcentajes ni adherencia contra metas ajenas; primer plan no debe inventar metas anteriores. Conservar registros y targets históricos. Revisar contrato de historial antes de modificar. |
| Peso y trayectoria | index.html muestra 72/70 kg; v42 usa trajectory887 | Mostrar mediciones reales, sin trayectoria hacia un peso ajeno. Revisar progress818 y campos del diario antes del cambio. |
| Límites del Coach | core105.coach 1900–2300 kcal, 130–170 g proteína | No presentar límites técnicos como recomendaciones personales; revisar contrato de propuestas antes de ampliar. |
| Formularios | nutrition103 inicializa kcal/proteína desde asiaGoals50 y grasas 60, reparto 10/35/20/35 | No aplicar valores sugeridos sin confirmación; indicar cuándo son ejemplos. |
Primero concluir hotfix visual. Después cambios de dominio y validadores coherentes en diario, shell y Worker, pruebas con cuenta sin configuración, con metas/planes explícitos, recuperación y registros históricos. No borrar valores persistidos ni inferir intención de borrado. Inventario parcial: no es implementación ni garantía de exhaustividad.
