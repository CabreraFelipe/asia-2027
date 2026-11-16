
const push = require('web-push');
const env = process.env;

const date = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Montevideo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());

const test = env.TEST_PUSH === 'true';

if (!test && (date < '2026-11-23' || date > '2027-03-08')) {
  console.log('Fuera del programa');
  process.exit(0);
}

const monday = new Date(date + 'T12:00:00Z').getUTCDay() === 1;
const vacation = date >= '2026-12-26' && date <= '2027-01-07';

push.setVapidDetails(
  env.VAPID_SUBJECT,
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY
);

const body = test
  ? '¡Funciona! Tu aplicación está conectada.'
  : vacation
  ? 'Estás de vacaciones. El registro de peso es opcional.'
  : monday
  ? 'Pesate y realizá tu control semanal de dieta y entrenamiento.'
  : '¡Buen día! Es hora de pesarte y registrar tu progreso.';

push.sendNotification(
  JSON.parse(env.PUSH_SUBSCRIPTION),
  JSON.stringify({
    title: 'Asia 2027',
    body: body
  }),
  { TTL: 3600 }
).then(() => {
  console.log('Notificación aceptada por el servicio push');
}).catch(error => {
  console.error('Error de envío, HTTP', error.statusCode || 'desconocido');
  process.exitCode = 1;
});
