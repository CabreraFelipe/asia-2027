# Criterio obligatorio de notificaciones V12.0
Estado: BLOQUEANTE PARA PRODUCCIÓN Y MIGRACIÓN REAL. Piloto sintético únicamente.
## Invariantes
- No editar ni sustituir los archivos de V10.6, su Service Worker, cron de pesaje, secretos, suscripciones, Worker REST ni agendas actuales. No disparar su workflow manual de prueba desde el piloto.
- No usar tokens históricos ni importar suscripciones push del origen anterior. Push depende del origen, del Service Worker y del dispositivo. El nuevo origen requiere consentimiento y suscripción propios.
- Las preferencias de horario, canales, rutina y agenda contenidas en el diario cifrado se conservan al importar y sincronizar. No enviar registros médicos o nutricionales al servicio de avisos: solo tipos, vencimientos y datos técnicos de entrega.
- El reloj local y la señal de fin de descanso no dependen de red. Pausar, reanudar, sumar/restar tiempo, omitir, finalizar y descartar deben programar/cancelar correctamente sin avisos obsoletos. La entrega push con app cerrada requiere backend.
## Inventario de paridad
- Recordatorio de pesaje diario, calendario original, reducción en vacaciones y revisión semanal; evitar duplicados entre cron histórico y agenda nueva.
- Agenda inteligente: pesaje, Gym, dieta y control semanal; horarios Uruguay, canales optativos, renovación, consulta, cancelación, historial, prueba y diagnóstico.
- Avisos contextuales locales: bienestar, estrategias, tendencia de peso, navegación al registro correcto.
- Gym clásico y PRO: cuenta regresiva, persistencia de relojes, pausa/reanudación, extensión/reducción, omisión, cancelación, fin de sesión, aviso visible y vibración donde soportada.
- Web Push: entrega con pantalla bloqueada y app cerrada, notificación pulsable que abre acción correcta sin saltarse autenticación; Apple Watch si el dispositivo y la configuración de duplicación de avisos lo permiten.
## Diseño requerido antes de activar push
Servicio nuevo aislado por cuenta y dispositivo; suscripción propia y revocación por cuenta/dispositivo; identidad verificada, CSRF, revisión monotónica y cancelaciones idempotentes. Cola durable con vencimientos y deduplicación, pruebas de reconexión, sustitución de agenda y revocación. No envío a destinatarios no autorizados ni datos privados en pantalla bloqueada por defecto. No compartir el backend REST personal.
## Evidencia obligatoria
- CI de fuentes, Worker, Chrome normal y lento; pruebas de temporizadores con reloj controlado y callback de planificación sintético (no acredita entrega push).
- Pruebas de servidor: dos cuentas/dos dispositivos, CAS de revisiones, cancelación y reintentos, vencimientos, revocación, no duplicados, permisos, rechazo de destino no autorizado.
- Pruebas físicas: iPhone instalado en pantalla de inicio, Android instalado y Apple Watch vinculado; app abierta, segundo plano, cerrada y pantalla bloqueada; aviso diario de prueba, descanso, pausa, reanudación, extensión y cancelación. Comprobar que toca abrir el destino correcto. La aceptación por proveedor no equivale a recepción.
- La migración y el reemplazo de V10.6 están prohibidos hasta que todos estos requisitos estén verificados y el usuario apruebe una transición explícita sin duplicados. Mantener V10.6 activa hasta entonces.
## Situación actual
El SW piloto solo cachea el aviso offline; no tiene handler push. CSP del diario bloquea transporte histórico. Los controles originales se conservan pero entrega remota no habilitada. Ninguna afirmación de paridad de push real está justificada todavía.
