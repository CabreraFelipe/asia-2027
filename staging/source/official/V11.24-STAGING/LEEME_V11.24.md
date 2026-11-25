# Instalación V11.24 (solo staging)

1. Extraer el ZIP completo en carpeta nueva, preferiblemente fuera de OneDrive.
2. Ejecutar `INSTALAR_V11_24.cmd`, o desde consola `node INSTALADOR_SEGURO_V11_24.mjs`.
3. El instalador verifica hashes, ejecuta pruebas y exige que staging sea V11.21.
4. Confirmar con `S`. Se exporta respaldo de D1 staging, luego se publica el Worker y se ejecuta smoke.
5. Si falla después de iniciar un deploy NO repetir sin verificar el estado; enviar salida de consola SIN credenciales.
6. URL de destino: https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev/v11.24/

**Sin datos reales.** No subir respaldos de V10.6 ni información de Salud. V10.6 original y sus Workers permanecen intocados.
