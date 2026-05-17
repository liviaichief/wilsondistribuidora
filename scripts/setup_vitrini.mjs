/**
 * setup_vitrini.mjs
 * Cria a coleção campanhas_comunicacao + faz deploy da Function send-campanha
 * no Appwrite Cloud via node-appwrite SDK.
 *
 * Uso: node scripts/setup_vitrini.mjs
 */

import { Client, Databases, Functions, Permission, Role, ID } from 'node-appwrite';
import { readFileSync, createReadStream } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Config ───────────────────────────────────────────────────────
const ENDPOINT    = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID  = '69ebf93f000372e879ff';
const API_KEY     = 'standard_06684859eef23fe37b1b2b5e69fba753f7637355c69fe55c029cd878bcc2ef835e1deb4b4f9fed425e938d81245cec097cffe9e3bd18692f28b3434cc5b73edc3b10dd447f75aec2c4f381bce89c56688ad8bed3bdaac0c0ec1876722e6259578a3a99aeb3802544082dd77cf6f438eedd16ee5a0a95e4b863cad153f5471e46';
const DATABASE_ID = 'main_db';
const COLLECTION_ID = 'campanhas_comunicacao';
const FUNCTION_ID   = 'send-campanha';

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db  = new Databases(client);
const fns = new Functions(client);

// ── Helpers ───────────────────────────────────────────────────────
function log(msg)  { console.log(`  ✓ ${msg}`); }
function info(msg) { console.log(`  → ${msg}`); }
function warn(msg) { console.log(`  ⚠ ${msg}`); }

async function ignoreDuplicate(fn) {
  try { return await fn(); }
  catch (e) {
    if (e.code === 409 || (e.message || '').includes('already exists') || (e.message || '').includes('duplicate')) {
      warn(`Já existe — pulando (${e.message})`);
      return null;
    }
    throw e;
  }
}

// ── 1. Coleção ────────────────────────────────────────────────────
async function criarColecao() {
  console.log('\n📦 Criando coleção campanhas_comunicacao...');

  await ignoreDuplicate(() =>
    db.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      'Campanhas de Comunicação',
      [
        Permission.read(Role.any()),          // qualquer um pode ler (Realtime)
      ],
      false,  // documentSecurity = false (permissões em nível de coleção)
    )
  );
  log('Coleção criada (ou já existia)');

  // Atributos
  console.log('\n📝 Criando atributos...');

  await ignoreDuplicate(() =>
    db.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'titulo', 80, true)
  );
  log('titulo (string, 80, obrigatório)');

  await ignoreDuplicate(() =>
    db.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'conteudo', 300, true)
  );
  log('conteudo (string, 300, obrigatório)');

  await ignoreDuplicate(() =>
    db.createEnumAttribute(
      DATABASE_ID, COLLECTION_ID,
      'categoria',
      ['anuncio', 'comunicado_geral'],
      true        // required=true → sem default (Appwrite não permite os dois juntos)
    )
  );
  log('categoria (enum: anuncio|comunicado_geral, obrigatório)');

  await ignoreDuplicate(() =>
    db.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'midia_url', 500, false)
  );
  log('midia_url (string, 500, opcional)');

  // Aguarda os atributos ficarem ativos
  info('Aguardando atributos ficarem disponíveis (5s)...');
  await new Promise(r => setTimeout(r, 5000));

  // Índice para ordenação por data
  await ignoreDuplicate(() =>
    db.createIndex(
      DATABASE_ID, COLLECTION_ID,
      'idx_created_at',
      'key',
      ['$createdAt'],
      ['DESC']
    )
  );
  log('Índice $createdAt DESC criado');

  console.log('\n✅ Coleção configurada com sucesso!');
}

// ── 2. Function ────────────────────────────────────────────────────
async function criarFunction() {
  console.log('\n⚡ Configurando Function send-campanha...');

  // Cria ou ignora se já existe
  // Assinatura: create(id, name, runtime, execute?, events?, schedule?, timeout?, enabled?, logging?, entrypoint?, commands?)
  await ignoreDuplicate(() =>
    fns.create(
      FUNCTION_ID,        // functionId
      'send-campanha',    // name
      'node-18.0',        // runtime
      [],                 // execute: [] = só via API Key
      [],                 // events: sem triggers automáticos
      '',                 // schedule: sem cron
      600,                // timeout (segundos)
      true,               // enabled
      true,               // logging
      'src/index.js',     // entrypoint
    )
  );
  log('Function registrada no Appwrite');

  // Variável de ambiente DATABASE_ID
  await ignoreDuplicate(() =>
    fns.createVariable(FUNCTION_ID, 'DATABASE_ID', 'main_db')
  );
  log('Variável DATABASE_ID=main_db configurada');

  // Zip da pasta da function
  console.log('\n📦 Compactando código da function...');
  const funcDir = resolve(ROOT, 'functions', 'send-campanha');
  const zipPath = resolve(ROOT, 'functions', 'send-campanha.tar.gz');

  // Instala dependências da function
  info('Instalando dependências (node-appwrite)...');
  execSync('npm install --omit=dev', { cwd: funcDir, stdio: 'pipe' });
  log('Dependências instaladas');

  // Cria tar.gz com paths relativos (evita problema de drive letter C: no Windows)
  execSync(
    'tar -czf ../send-campanha.tar.gz src node_modules package.json',
    { cwd: funcDir, stdio: 'pipe' }
  );
  log(`Archive criado: ${zipPath}`);

  // Faz upload do deployment
  console.log('\n🚀 Fazendo deploy...');
  const tarBuffer = readFileSync(zipPath);
  const InputFile = (await import('node-appwrite/file')).InputFile;
  const inputFile = InputFile.fromBuffer(tarBuffer, 'send-campanha.tar.gz');

  const deployment = await fns.createDeployment(
    FUNCTION_ID,
    inputFile,
    true  // activate = true
  );
  log(`Deployment criado: ${deployment.$id}`);

  // Aguarda o build completar
  info('Aguardando build do deployment...');
  let status = deployment.status;
  let attempts = 0;
  while (status !== 'ready' && status !== 'failed' && attempts < 30) {
    await new Promise(r => setTimeout(r, 3000));
    const dep = await fns.getDeployment(FUNCTION_ID, deployment.$id);
    status = dep.status;
    info(`Status: ${status}`);
    attempts++;
  }

  if (status === 'ready') {
    log(`Deployment ativo! Function "${FUNCTION_ID}" está pronta.`);
  } else if (status === 'failed') {
    throw new Error('Build do deployment falhou. Verifique os logs no Console Appwrite.');
  } else {
    warn('Timeout aguardando build — verifique no Console Appwrite se o deployment ficou ativo.');
  }

  console.log('\n✅ Function configurada com sucesso!');
}

// ── Main ───────────────────────────────────────────────────────────
(async () => {
  console.log('🚀 Setup Vitrini Digital — Wilson Distribuidora');
  console.log('━'.repeat(50));

  try {
    await criarColecao();
    await criarFunction();

    console.log('\n' + '━'.repeat(50));
    console.log('🎉 Setup completo! O canal de anúncios está pronto.');
    console.log('\nPróximo passo:');
    console.log('  → Abra /admin/comunicacao e envie seu primeiro anúncio.');
    console.log('  → Os clientes conectados verão o popup em tempo real.\n');
  } catch (err) {
    console.error('\n❌ Erro durante o setup:', err.message);
    if (err.response) console.error('   Detalhe:', JSON.stringify(err.response, null, 2));
    process.exit(1);
  }
})();
