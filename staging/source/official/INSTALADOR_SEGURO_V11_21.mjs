#!/usr/bin/env node
// Asia 2027 V11.21 - Windows entry point. The release payload in V11.21-STAGING is unchanged.
// Only staging. No migrations. No data mutation until an explicit affirmative confirmation.
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { randomBytes } from 'node:crypto';

const base = dirname(fileURLToPath(import.meta.url));
const root = join(base, 'V11.21-STAGING');
const pathTo = name => join(root, name);
const diag = process.argv.includes('--diagnostico');
const noRemote = process.argv.includes('--solo-preflight');
let startedDeploy = false;

function fail(message) {
  console.error('\nERROR: ' + message);
  if (startedDeploy) console.error('DESPLIEGUE INICIADO: NO REPITAS el instalador sin revisar el estado remoto.');
  process.exitCode = 1;
}

async function run(command, args, options = {}) {
  console.log('\n>>> ' + options.label);
  const execName = command === 'node' ? process.execPath : command;
  const isCmd = command === 'npx.cmd';
  return await new Promise(resolvePromise => {
    const child = spawn(execName, args, {
      cwd: root,
      stdio: 'inherit',
      windowsHide: false,
      // Node cannot execute .cmd directly on Windows without a shell.
      shell: isCmd,
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
    });
    child.once('error', err => {console.error('No se pudo iniciar ' + command + ': ' + err.message);resolvePromise(false);});
    child.once('close', (code, signal) => {resolvePromise(code === 0 && !signal);});
  });
}

async function main() {
  console.log('==============================================');
  console.log('ASIA 2027 - V11.21 - INSTALADOR WINDOWS SEGURO');
  console.log('==============================================');
  console.log('Produccion V10.6: no se modifica');
  console.log('Destino unico: asia-v1111-identity-staging');
  console.log('Base D1 de pruebas: asia-v11-db-staging');
  console.log('No usar informacion personal ni datos de Salud.');
  if (process.versions.node.split('.')[0] < 22) {fail('Se necesita Node.js 22 o superior. Version actual: '+process.version);return;}
  for (const file of ['scripts/preflight1121.mjs','scripts/precheck1121.mjs','scripts/smoke1121.mjs','wrangler.preview.toml']) {
    if (!existsSync(pathTo(file))) { fail('Falta '+file+'. Extrae completamente el ZIP en una carpeta nueva.'); return; }
  }
  if (diag) {console.log('DIAGNOSTICO OK: Node '+process.version+'; estructura del ZIP reconocida.');return;}
  if (process.platform !== 'win32' && !noRemote) {
    fail('El instalador normal esta reservado para Windows; usa --solo-preflight para probar fuera de Windows.');return;
  }
  if (!await run('node', [join(base, 'PREFLIGHT_PORTABLE_V11_21.mjs')], {label:'Preflight offline aislado: hashes + pruebas + regresiones'})) {
    fail('No paso el preflight. Nada fue enviado a Cloudflare.');return;
  }
  if (noRemote) {console.log('PREFLIGHT LOCAL OK. Modo sin red; no se desplego nada.');return;}
  if (!await run('node', [pathTo('scripts/precheck1121.mjs')], {label:'Verificacion remota V11.17 o V11.18 (SOLO staging)'})) {
    fail('No se pudo confirmar V11.17/V11.18 en STAGING. Nada fue desplegado.');return;
  }
  const rl = createInterface({input:process.stdin,output:process.stdout});
  let answer = '';
  try {answer = (await rl.question('\nConfirmar respaldo D1 y actualizacion SOLO de staging? Escribi S para continuar, N para cancelar: ')).trim().toUpperCase();}
  finally {rl.close();}
  if (answer !== 'S') {console.log('Cancelado. No se modifico Cloudflare.');return;}
  // The local backup is a strict dependency for deployment.
  const backDir = join(base,'BACKUP_STAGING');
  mkdirSync(backDir,{recursive:true});
  const backName = 'asia-v11-db-staging-pre121-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomBytes(4).toString('hex')+'.sql';
  const backFile = join(backDir,backName);
  const relativeBackup = '../BACKUP_STAGING/'+backName;
  const backupArgs = ['--yes','wrangler@4.165.0','d1','export','asia-v11-db-staging','--config','wrangler.preview.toml','--remote','--output',relativeBackup];
  if (!await run('npx.cmd', backupArgs, {label:'Respaldo de Cloudflare D1 de pruebas ANTES de actualizar'})) {
    fail('Fallo el respaldo D1. No se desplego.');return;
  }
  if (!existsSync(backFile) || statSync(backFile).size === 0) {
    fail('Respaldo D1 no existe o esta vacio; NO se desplego.');return;
  }
  console.log('Respaldo verificado: '+backName+' ('+statSync(backFile).size+' bytes)');
  // Verify source hashes once more immediately before starting the deployment.
  if (!await run('node', [join(base,'PREFLIGHT_PORTABLE_V11_21.mjs'),'--solo-integridad'], {label:'Ultima verificacion de integridad antes de desplegar'})) {
    fail('Los archivos cambiaron desde el preflight. No se desplego.');return;
  }
  startedDeploy = true;
  if (!await run('npx.cmd', ['--yes','wrangler@4.165.0','deploy','--config','wrangler.preview.toml'], {label:'Despliegue exclusivo del Worker de STAGING'})) {
    fail('El despliegue puede haber quedado parcial. Revisar estado remoto sin repetir a ciegas.');return;
  }
  if (!await run('node', [pathTo('scripts/smoke1121.mjs')], {label:'Comprobacion GET tras el despliegue'})) {
    fail('Smoke remoto fallido. Revisar antes de reintentar.');return;
  }
  console.log('\nV11.21 INSTALADA EN STAGING.');
  console.log('URL: https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev/v11.21/');
  console.log('V10.6 PERSONAL SIN CAMBIOS.');
}

try { await main(); }
catch (err) { fail(err?.stack || String(err)); }
