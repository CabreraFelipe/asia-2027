# Contrato offline V11.9 — respaldo histórico, importación y puente D1

## Exportación histórica de cuentas ficticias

```text
format: 'asia119-demo-history-v1'
accountId: 'demo_<32 hex>'
salt: base64 de 16 bytes
headRevision: entero 1..100
historyComplete: boolean
versions: [{id,revision,createdAt,envelope}]
drafts: [{id,accountId,expectedRevision,createdAt,envelope}]
index: AES-GCM {format,iv,cipher} vinculado al id, clase 'archive-index', revisión 0
```

Los sobres históricos siguen usando `asia117-browser-vault-v1`, AES-256-GCM, IV aleatorio de 96 bits, PBKDF2-HMAC-SHA256 con 160.000 iteraciones en el **navegador**, AAD para id/tipo/revisión. La contraseña se usa solo para derivar la clave en memoria.

El `index` cifra `{format:'asia119-index-v1',digest:SHA256(JSON.stringify({accountId,salt,headRevision,historyComplete,versions,drafts}))}`; impide quitar, sustituir, duplicar, reordenar o modificar registros del archivo sin ser detectado. Cada sobre también se descifra y valida individualmente antes de confirmar una importación. **No impide que alguien sustituya el archivo entero por una copia anterior legítima** (rollback externo), ni protege contra código malicioso en el mismo origen; esa amenaza exige un registro remoto autenticado.

Importación: se valida la forma y los límites (**20 MB** por archivo, máximo 100 revisiones y 100 borradores), se comprueba integridad, AAD, frase y contenido en memoria; luego se escribe todo de forma atómica o nada. Se rechaza ID y etiqueta duplicados; nunca se hace merge automático. El estado anterior del navegador de origen no se modifica.

`historyComplete=false` si la base de origen ya era incompleta, por ejemplo importación anterior de V11.8 solo HEAD. El laboratorio V11.9 no puede recuperar datos ausentes.

## Puente criptográfico para el Worker V11.2

`cloud-bridge119.mjs` demuestra el uso del *wire format* D1 existente:

```text
{format:'asia84-encrypted-v1',salt,iv,cipher}
```

El texto cifrado contiene el payload tipado `asia119-lab-cloud-bridge-v1` (estado sintético, id de laboratorio, revisión local), un checksum SHA-256 verificado tras descifrar y una separación explícita del formato del respaldo personal V10.6. Usa el cifrado `encrypt84` existente (600.000 iteraciones PBKDF2 **solo en el cliente**). Esta demostración es compatible con la validación sintáctica de la API de staging, pero no garantiza integridad semántica para servidor ciego ni autenticación del propietario. El Worker **no debe derivar contraseñas** con 600.000 iteraciones (restricción de WebCrypto Workers). Nunca se debe enviar a producción sin un contrato de cuenta, recuperación de claves y sincronización segura auditados.

## Invariantes

- Los archivos cifrados pueden contener **únicamente datos ficticios** en esta etapa.
- Ninguna exportación se declara completa si la fuente solo contiene una revisión.
- El archivo antiguo nunca se borra al restaurar, ni se sobrescribe una cuenta existente al importar.
- La API y la UI no suben claves, contraseñas ni contenido descifrado.
- Una pérdida de respuesta, modificación simultánea o error de integridad **no autoriza a borrar nada**.
