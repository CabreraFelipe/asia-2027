# Continuidad V11.37 — trabajo offline cifrado y conciliación
Base 9525b77d1db31542429430f7cf4724d683e84dbe. V11.36 Worker, fuentes/smoke y regresión V11.34 SUCCESS; dos intentos Chrome 45545928495 fallaron antes de aserciones por CDP. Se corrige harness: arranque en about:blank, diagnóstico stderr, hasta 3 intentos exclusivamente de arranque; navega una vez tras CDP y nunca reintenta aserciones. CI offline y regresión sincronización SUCCESS.

Rama offline aislada en IndexedDB sintético; copia de ambos sobres confirmados y marcador, ediciones de diario, relojes y módulos con CAS en rama cifrada. Apertura requiere identidad online y desbloqueo de ambas bóvedas; permiso local en memoria limitado a 15 min, no token de servidor persistido, no cold start offline. No se utiliza identidad local para solicitudes HTTP. Rotación de lease excluye escritores anteriores. Reapertura tras verificación online recupera rama persistente; cierre no garantiza datos aún no confirmados. Conciliación explícita con UI desmontada, congelación, validación identidad y frase, CAS de ambas ramas respecto al estado base, idempotencia si el commit ya ocurrió. Conflicto conserva rama congelada y permite exportar sobre cifrado; inspección/importación y resolución selectiva de ese formato pendientes. No borrar automáticamente. No garantiza detectar revocación sin red; bloqueo por caducidad local; protección frente a manipulación same-origin/clock, guardado tras cierre abrupto, UX y prueba física pendientes. La nube no recibe credenciales ni relojes por esta función. No se afirma funcionalidad offline completa de app instalada.

CI: Chrome offline, regresión V11.36, V11.34 y fuentes por cambios de dependencia. main 061bb34dc3735d38dfd14eeb77f1054f34b63578; 110 fuentes originales; V11.24 instalada según continuidad. Sin despliegue ni datos reales.

Siguiente: cerrar pruebas, integración del modo offline y recuperación en shell original, aumentar límite remoto de 1,4 MB y empaquetar recursos autenticados, servicios por cuenta, PWA y pruebas físicas.

Validación sobre 42c3668: Chrome real offline y regresión V11.36 SUCCESS. El lanzador corregido permitió ejecutar las aserciones, sin reintentar fallos funcionales. 110/110 archivos originales intactos por comparación de árboles Git. Resultados:
- [Asia 2027 - sincronización y puerta servidor V11.36](https://github.com/CabreraFelipe/asia-2027/actions/runs/45546265327): SUCCESS confirmado posteriormente
- [Asia 2027 - integración V11.26](https://github.com/CabreraFelipe/asia-2027/actions/runs/45546265265): success
- [Asia 2027 - migración integral atómica V11.34](https://github.com/CabreraFelipe/asia-2027/actions/runs/45546265343): success
- [Asia 2027 - integración original V11.27](https://github.com/CabreraFelipe/asia-2027/actions/runs/45546265354): success
- [Asia 2027 - offline cifrado y regresión sincronización V11.37](https://github.com/CabreraFelipe/asia-2027/actions/runs/45546265438): success
- [Asia 2027 - CI de fuentes y smoke real](https://github.com/CabreraFelipe/asia-2027/actions/runs/45546265317): success
- [Asia 2027 - candidato explícito V11.29](https://github.com/CabreraFelipe/asia-2027/actions/runs/45546265249): success
