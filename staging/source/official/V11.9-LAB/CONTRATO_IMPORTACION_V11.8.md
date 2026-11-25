# V11.8 — Contrato de exportación/importación de laboratorio

Este contrato solo permite transportar **una revisión de prueba cifrada** entre dos navegadores o perfiles, por medios que el usuario elija. No existe transferencia de red implementada en la app.

### Objeto admitido

```json
{
  "format": "asia117-demo-export-v1",
  "accountId": "demo_<32 caracteres hexadecimales>",
  "revision": 1,
  "salt": "<base64 de 16 bytes>",
  "envelope": {
    "format": "asia117-browser-vault-v1",
    "iv": "<base64 de 12 bytes>",
    "cipher": "<base64 de cifrado AES-GCM y tag>"
  }
}
```

Reglas: claves exactas, sin metadatos arbitrarios. Revisión entera 1–100. Archivo máximo 180 KB desde la UI. La clave se deriva de una frase ficticia original de 16–200 caracteres mediante PBKDF2-SHA256 (160.000 iteraciones en el **navegador local**) y sal de 16 bytes. El AAD vincula el criptograma al `accountId`, tipo `vault` y revisión. La importación valida además el estado descifrado del Coach/Salud/diario con los contratos anteriores. Ningún byte se guarda hasta completar validación y descifrado.

**Persistencia:** se crea una cuenta local con el **mismo** `accountId`, un nombre ficticio escogido durante la importación, un nuevo sobre verificador y una versión/head de igual revisión. Toda la operación en IndexedDB es una sola transacción `readwrite` (`accounts`, `heads`, `versions`). Si existe el ID, si excede el límite, si el nombre está duplicado o si hay fallo de almacenamiento, se rechaza sin sobrescribir una cuenta existente.

**Importante:** el archivo contiene un único snapshot actual, **NO** la colección de revisiones, borradores de conflicto ni dispositivo/cuenta real. Perder la frase significa no poder abrir el archivo. El nombre, ID y número de revisión son metadatos en claro; las entradas, Coach y Salud permanecen cifrados. Este laboratorio no se debe utilizar para información médica ni personal.

**Compatibilidad:** importación V11.7 → V11.8 verificada mediante el módulo de V11.7 original. No se incluye migración automática a la API V11.2 porque sus esquemas y el manejo de claves son distintos.
