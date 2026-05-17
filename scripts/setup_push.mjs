/**
 * setup_push.mjs
 * Cria a coleção push_subscriptions, adiciona as env vars VAPID na Function
 * send-campanha e faz redeploy com web-push incluído.
 *
 * Uso: node scripts/setup_push.mjs
 */

import { Client, Databases, Functions, Permission, Role, ID } from 'node-appwrite';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const ENDPOINT    = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID  = '69ebf93f000372e879ff';
const API_KEY     = 'standard_06684859eef23fe37b1b2b5e69fba753f7637355c69fe55c029cd878bcc2ef835e1deb4b4f9fed425e938d81245cec097cffe9e3bd18692f28b3434cc5b73edc3b10dd447f75aec2c4f381bce89c56688ad8bed3bdaac0c0ec1876722e6259578a3a99aeb3802544082dd77cf6f438eedd16ee5a0a95e4b863cad153f5471e46';
const DATABASE_ID    = 'main_db';
const COLLECTION_ID  = 'push_subscriptions';
const FUNCTION_ID    = 'send-campanha';

const VAPID_PUBLIC_KEY  = 'BLNsZOp4Ef9YbYjcXmdJBUmrsEIMPmWChywU5BjUfnn21XIRcF-mO-9paltI5NepUpFmG_RBc6IWftlAm_X78b0';
const VAPID_PRIVATE_KEY = 'V3B0cvfnqvWSg6e4lhcFZIBVrpBTYOSQQ9gXNmX-sOA';
const VAPID_MAILTO      = 'mailto:contato@wilsondistribuidora.com.br';

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db  = new Databases(client);
const fns = new Functions(client);

function log(msg)  { console.log(`  ✓ ${msg}`); }
function info(msg) { console.log(`  → ${msg}`); }
function warn(msg) { console.log(`  ⚠ ${msg}`); }

async function ignoreDuplicate(fn) {
  try { return await fn(); }
  catch (e) {
    if (e.code === 409 || (e.message || '').includes('already exists') || (e.message || '').includes('duplicate')) {
      warn(`Já existe — pulando`);
      return null;
    }
    throw e;
  }
}

// ── 1. Coleção push_subscriptions ─────────────────────────────────
async function criarColecao() {
  console.log('\n📦 Criando coleção push_subscriptions...');

  await ignoreDuplicate(() =>
    db.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      'Push Subscriptions',
      [
        Permission.create(Role.any()),   // qualquer device pode registrar
        Permission.read(Role.any()),     // a function (com API key) pode listar
        Permission.delete(Role.any()),   // a function pode remover subscrições expiradas
      ],
      false, // documentSecurity = false
    )
  );
  log('Coleção criada (ou já existia)');

  console.log('\n📝 Criando atributos...');

  await ignoreDuplicate(() =>
    db.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'endpoint', 500, true)
  );
  log('endpoint (string 500, obrigatório)');

  await ignoreDuplicate(() =>
    db.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'p256dh', 200, true)
  );
  log('p256dh (string 200, obrigatório)');

  await ignoreDuplicate(() =>
    db.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'auth', 100, true)
  );
  log('auth (string 100, obrigatório)');

  info('Aguardando atributos ficarem disponíveis (5s)...');
  await new Promise(r => setTimeout(r, 5000));

  // Índice único em endpoint para evitar duplicatas
  await ignoreDuplicate(() =>
    db.createIndex(
      DATABASE_ID, COLLECTION_ID,
      'idx_endpoint_unique',
      'unique',
      ['endpoint'],
    )
  );
  log('Índice único em endpoint criado');

  console.log('\n✅ Coleção push_subscriptions configurada!');
}

// ── 2. Variáveis VAPID na Function ────────────────────────────────
async function configurarVapid() {
  console.log('\n🔑 Configurando variáveis VAPID na Function send-campanha...');

  // Tenta criar; se já existe (409) ignora, se outro erro — relança
  const upsertVar = async (key, value) => {
    // node-appwrite v13: createVariable(functionId, variableId, key, value)
    try {
      const vars = await fns.listVariables(FUNCTION_ID);
      const existing = (vars.variables || []).find(v => v.key === key);
      if (existing) {
        // Atualiza variável existente
        await fns.updateVariable(FUNCTION_ID, existing.$id, key, value);
        log(`${key} atualizado`);
        return;
      }
    } catch { /* não existe ainda */ }
    // Cria nova variável (precisa de variableId explícito no v13)
    await fns.createVariable(FUNCTION_ID, ID.unique(), key, value);
    log(`${key} criado`);
  };

  await upsertVar('VAPID_PUBLIC_KEY',  VAPID_PUBLIC_KEY);
  await upsertVar('VAPID_PRIVATE_KEY', VAPID_PRIVATE_KEY);
  await upsertVar('VAPID_MAILTO',      VAPID_MAILTO);

  console.log('\n✅ Variáveis VAPID configuradas!');
}

// ── 3. Redeploy da Function com web-push ─────────────────────────
async function redeployFunction() {
  console.log('\n⚡ Fazendo redeploy da Function send-campanha (com web-push)...');

  const funcDir = resolve(ROOT, 'functions', 'send-campanha');
  const zipPath = resolve(ROOT, 'functions', 'send-campanha.tar.gz');

  info('Instalando dependências (node-appwrite + web-push)...');
  execSync('npm install --omit=dev', { cwd: funcDir, stdio: 'inherit' });
  log('Dependências instaladas');

  info('Criando archive...');
  execSync(
    'tar -czf ../send-campanha.tar.gz src node_modules package.json',
    { cwd: funcDir, stdio: 'pipe' }
  );
  log(`Archive criado: ${zipPath}`);

  console.log('\n🚀 Fazendo upload do deployment...');
  const tarBuffer = readFileSync(zipPath);
  const InputFile  = (await import('node-appwrite/file')).InputFile;
  const inputFile  = InputFile.fromBuffer(tarBuffer, 'send-campanha.tar.gz');

  const deployment = await fns.createDeployment(FUNCTION_ID, inputFile, true);
  log(`Deployment criado: ${deployment.$id}`);

  info('Aguardando build...');
  let status   = deployment.status;
  let attempts = 0;
  while (status !== 'ready' && status !== 'failed' && attempts < 30) {
    await new Promise(r => setTimeout(r, 3000));
    const dep = await fns.getDeployment(FUNCTION_ID, deployment.$id);
    status = dep.status;
    info(`Status: ${status}`);
    attempts++;
  }

  if (status === 'ready') {
    log('Deployment ativo! Function com web-push está pronta.');
  } else if (status === 'failed') {
    throw new Error('Build falhou — verifique os logs no Console Appwrite.');
  } else {
    warn('Timeout aguardando build — verifique no Console Appwrite.');
  }

  console.log('\n✅ Redeploy concluído!');
}

// ── Main ──────────────────────────────────────────────────────────
(async () => {
  console.log('🔔 Setup Push Notifications — Wilson Distribuidora');
  console.log('━'.repeat(52));

  try {
    await criarColecao();
    await configurarVapid();
    await redeployFunction();

    console.log('\n' + '━'.repeat(52));
    console.log('🎉 Push notifications pronto!');
    console.log('\nO que acontece agora:');
    console.log('  → Clientes abrem o painel de Notificações e clicam em');
    console.log('    "Ativar notificações no celular"');
    console.log('  → O dispositivo é registrado em push_subscriptions');
    console.log('  → Ao enviar um anúncio em /admin/comunicacao, todos os');
    console.log('    dispositivos registrados recebem a notificação nativa\n');
  } catch (err) {
    console.error('\n❌ Erro durante o setup:', err.message);
    if (err.response) console.error('   Detalhe:', JSON.stringify(err.response, null, 2));
    process.exit(1);
  }
})();
