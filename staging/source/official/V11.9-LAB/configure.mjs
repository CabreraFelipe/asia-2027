import {writeFileSync,existsSync} from 'node:fs';
const id=process.argv[2]?.toLowerCase();
const prod='a7203465-2b38-4152-a43c-4cdcdeaa6454';
if(!id||!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id)||id===prod)throw Error('Usá únicamente el ID de la NUEVA base asia-v11-db-staging.');
if(existsSync('wrangler.api.toml'))throw Error('Ya existe wrangler.api.toml. Revisalo antes de modificarlo manualmente.');
writeFileSync('wrangler.api.toml',`name = "asia-v11-api-staging"
main = "api-staging.mjs"
compatibility_date = "2026-11-20"
workers_dev = true
preview_urls = false
[vars]
STAGING_MODE = "asia-v11-staging-110"
[[d1_databases]]
binding = "STAGING_DB"
database_name = "asia-v11-db-staging"
database_id = "${id}"
migrations_dir = "migrations"
`,{flag:'wx'});
console.log('Creado wrangler.api.toml para staging. Comprobá que el ID coincide con la NUEVA base.');
