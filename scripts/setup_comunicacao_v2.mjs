/**
 * setup_comunicacao_v2.mjs
 * Cria/expande as coleções para a Central de Comunicações V2:
 *   - Adiciona campo `actions` em campanhas_comunicacao
 *   - Cria coleção `comunicacoes`
 *   - Cria coleção `templates_mensagens` com seed de 10 templates
 *   - Cria e faz deploy da Function `process-agendadas` (cron * * * * *)
 *
 * Uso: node scripts/setup_comunicacao_v2.mjs
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
const DATABASE_ID = 'main_db';

const VAPID_PUBLIC_KEY  = 'BLNsZOp4Ef9YbYjcXmdJBUmrsEIMPmWChywU5BjUfnn21XIRcF-mO-9paltI5NepUpFmG_RBc6IWftlAm_X78b0';
const VAPID_PRIVATE_KEY = 'V3B0cvfnqvWSg6e4lhcFZIBVrpBTYOSQQ9gXNmX-sOA';
const VAPID_MAILTO      = 'mailto:contato@wilsondistribuidora.com.br';

const TIPOS_ENUM = ['promocao', 'lembrete', 'transacional', 'geral', 'sistema'];
const STATUS_ENUM = ['rascunho', 'agendada', 'processando', 'enviada', 'falhada'];

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const db  = new Databases(client);
const fns = new Functions(client);

function log(msg)  { console.log(`  ✓ ${msg}`); }
function info(msg) { console.log(`  → ${msg}`); }
function warn(msg) { console.log(`  ⚠ ${msg}`); }

async function ignoreDuplicate(fn) {
  try { return await fn(); }
  catch (e) {
    if (e.code === 409 || (e.message || '').toLowerCase().includes('already exists') || (e.message || '').includes('duplicate')) {
      warn(`Já existe — pulando`);
      return null;
    }
    throw e;
  }
}

// ── 1. Adiciona campo actions em campanhas_comunicacao ────────────
async function expandirCampanhas() {
  console.log('\n📦 Expandindo campanhas_comunicacao...');
  await ignoreDuplicate(() =>
    db.createStringAttribute(DATABASE_ID, 'campanhas_comunicacao', 'actions', 1000, false)
  );
  log('actions (string 1000, opcional)');
}

// ── 2. Coleção comunicacoes ───────────────────────────────────────
async function criarColecaoComunicacoes() {
  console.log('\n📦 Criando coleção comunicacoes...');

  await ignoreDuplicate(() =>
    db.createCollection(DATABASE_ID, 'comunicacoes', 'Comunicações', [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
    ], false)
  );
  log('Coleção criada');

  info('Aguardando 2s...');
  await new Promise(r => setTimeout(r, 2000));

  await ignoreDuplicate(() => db.createEnumAttribute(DATABASE_ID, 'comunicacoes', 'tipo', TIPOS_ENUM, true));
  log('tipo (enum)');
  await ignoreDuplicate(() => db.createStringAttribute(DATABASE_ID, 'comunicacoes', 'titulo', 80, true));
  log('titulo');
  await ignoreDuplicate(() => db.createStringAttribute(DATABASE_ID, 'comunicacoes', 'conteudo', 300, true));
  log('conteudo');
  await ignoreDuplicate(() => db.createStringAttribute(DATABASE_ID, 'comunicacoes', 'midia_url', 500, false));
  log('midia_url');
  await ignoreDuplicate(() => db.createStringAttribute(DATABASE_ID, 'comunicacoes', 'actions', 1000, false));
  log('actions');
  await ignoreDuplicate(() => db.createStringAttribute(DATABASE_ID, 'comunicacoes', 'segmento', 30, false));
  log('segmento');
  await ignoreDuplicate(() => db.createStringAttribute(DATABASE_ID, 'comunicacoes', 'canal', 20, false));
  log('canal');
  await ignoreDuplicate(() => db.createDatetimeAttribute(DATABASE_ID, 'comunicacoes', 'agendada_para', false));
  log('agendada_para (datetime)');
  await ignoreDuplicate(() => db.createEnumAttribute(DATABASE_ID, 'comunicacoes', 'status', STATUS_ENUM, true));
  log('status (enum)');
  await ignoreDuplicate(() => db.createStringAttribute(DATABASE_ID, 'comunicacoes', 'campanha_ref', 50, false));
  log('campanha_ref');

  info('Aguardando atributos (6s)...');
  await new Promise(r => setTimeout(r, 6000));

  await ignoreDuplicate(() =>
    db.createIndex(DATABASE_ID, 'comunicacoes', 'idx_status_agendada', 'key', ['status', 'agendada_para'], ['ASC', 'ASC'])
  );
  log('Índice status+agendada_para');

  await ignoreDuplicate(() =>
    db.createIndex(DATABASE_ID, 'comunicacoes', 'idx_created', 'key', ['$createdAt'], ['DESC'])
  );
  log('Índice $createdAt DESC');

  console.log('\n✅ Coleção comunicacoes pronta!');
}

// ── 3. Coleção templates_mensagens ────────────────────────────────
async function criarColecaoTemplates() {
  console.log('\n📦 Criando coleção templates_mensagens...');

  await ignoreDuplicate(() =>
    db.createCollection(DATABASE_ID, 'templates_mensagens', 'Templates de Mensagens', [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ], false)
  );
  log('Coleção criada');

  info('Aguardando 2s...');
  await new Promise(r => setTimeout(r, 2000));

  await ignoreDuplicate(() => db.createStringAttribute(DATABASE_ID, 'templates_mensagens', 'nome', 100, true));
  log('nome');
  await ignoreDuplicate(() => db.createEnumAttribute(DATABASE_ID, 'templates_mensagens', 'tipo', TIPOS_ENUM, true));
  log('tipo');
  await ignoreDuplicate(() => db.createStringAttribute(DATABASE_ID, 'templates_mensagens', 'titulo', 80, true));
  log('titulo');
  await ignoreDuplicate(() => db.createStringAttribute(DATABASE_ID, 'templates_mensagens', 'conteudo', 300, true));
  log('conteudo');
  await ignoreDuplicate(() => db.createStringAttribute(DATABASE_ID, 'templates_mensagens', 'actions', 1000, false));
  log('actions');
  await ignoreDuplicate(() => db.createIntegerAttribute(DATABASE_ID, 'templates_mensagens', 'ordem', false));
  log('ordem');

  info('Aguardando atributos (6s)...');
  await new Promise(r => setTimeout(r, 6000));

  // Seed: 10 templates (2 por tipo)
  console.log('\n🌱 Inserindo templates iniciais...');
  const SEED = [
    { nome: 'Promoção Flash',       tipo: 'promocao',     ordem: 1,  titulo: '🔥 Promoção relâmpago hoje!',         conteudo: 'Só hoje! Preço especial em produtos selecionados. Corra antes que acabe! 🥩' },
    { nome: 'Desconto Fim de Semana', tipo: 'promocao',   ordem: 2,  titulo: '🎉 Descontos de fim de semana!',       conteudo: 'Aproveite os descontos especiais deste fim de semana. Qualidade Wilson com preço justo!' },
    { nome: 'Hora da Reposição',    tipo: 'lembrete',     ordem: 3,  titulo: '🔔 Hora de repor o estoque!',          conteudo: 'Seus cortes favoritos estão fresquinhos esperando por você. Que tal fazer um pedido? 🥩' },
    { nome: 'Promoção Encerrando',  tipo: 'lembrete',     ordem: 4,  titulo: '⏰ Promoção encerrando em breve!',     conteudo: 'Não perca! A oferta especial encerra hoje. Garante o seu agora antes que acabe!' },
    { nome: 'Pedido Pronto',        tipo: 'transacional', ordem: 5,  titulo: '✅ Seu pedido está pronto!',           conteudo: 'Seu pedido foi separado e está pronto para retirada. Pode vir buscar até 18h!' },
    { nome: 'Pedido Confirmado',    tipo: 'transacional', ordem: 6,  titulo: '✅ Pedido confirmado com sucesso!',    conteudo: 'Recebemos seu pedido e já estamos preparando tudo com carinho. Obrigado pela confiança!' },
    { nome: 'Novo Produto',         tipo: 'geral',        ordem: 7,  titulo: '🆕 Novidade chegou no açougue!',       conteudo: 'Acabou de chegar um novo produto fresquinho! Venha conferir o que separamos especialmente para você.' },
    { nome: 'Horário de Funcionamento', tipo: 'geral',   ordem: 8,  titulo: '📋 Horário de funcionamento',          conteudo: 'Atendemos Seg a Sáb das 7h às 19h e domingo das 7h às 12h. Estamos esperando por você!' },
    { nome: 'Alerta Estoque Baixo', tipo: 'sistema',      ordem: 9,  titulo: '⚙️ Produtos com estoque baixo',        conteudo: 'Atenção: alguns produtos estão com estoque baixo. Acesse o painel de produtos para verificar.' },
    { nome: 'Aniversariante do Dia', tipo: 'sistema',     ordem: 10, titulo: '🎂 Aniversariante do dia!',            conteudo: 'Verifique a lista de clientes aniversariantes hoje e envie uma saudação especial!' },
  ];

  for (const tpl of SEED) {
    await ignoreDuplicate(() =>
      db.createDocument(DATABASE_ID, 'templates_mensagens', ID.unique(), tpl)
    );
    log(`Template: "${tpl.nome}"`);
  }

  console.log('\n✅ Coleção templates_mensagens pronta com 10 templates!');
}

// ── 4. Function process-agendadas ─────────────────────────────────
async function criarFunctionProcessAgendadas() {
  console.log('\n⚡ Configurando Function process-agendadas (cron * * * * *)...');

  await ignoreDuplicate(() =>
    fns.create(
      'process-agendadas',   // functionId
      'process-agendadas',   // name
      'node-18.0',           // runtime
      [],                    // execute: cron trigger only
      [],                    // events
      '* * * * *',           // schedule: every minute
      300,                   // timeout
      true,                  // enabled
      true,                  // logging
      'src/index.js',        // entrypoint
    )
  );
  log('Function registrada');

  // Variáveis de ambiente
  const upsertVar = async (key, value) => {
    try {
      const vars = await fns.listVariables('process-agendadas');
      const existing = (vars.variables || []).find(v => v.key === key);
      if (existing) {
        await fns.updateVariable('process-agendadas', existing.$id, key, value);
        return log(`${key} atualizado`);
      }
    } catch { /* não existe */ }
    await fns.createVariable('process-agendadas', ID.unique(), key, value);
    log(`${key} criado`);
  };

  await upsertVar('DATABASE_ID',     DATABASE_ID);
  await upsertVar('ADMIN_API_KEY',   API_KEY);
  await upsertVar('VAPID_PUBLIC_KEY',  VAPID_PUBLIC_KEY);
  await upsertVar('VAPID_PRIVATE_KEY', VAPID_PRIVATE_KEY);
  await upsertVar('VAPID_MAILTO',      VAPID_MAILTO);

  // Deploy
  const funcDir = resolve(ROOT, 'functions', 'process-agendadas');
  const zipPath  = resolve(ROOT, 'functions', 'process-agendadas.tar.gz');

  info('Instalando dependências...');
  execSync('npm install --omit=dev', { cwd: funcDir, stdio: 'inherit' });
  log('Dependências instaladas');

  info('Criando archive...');
  execSync('tar -czf ../process-agendadas.tar.gz src node_modules package.json', { cwd: funcDir, stdio: 'pipe' });
  log(`Archive: ${zipPath}`);

  console.log('\n🚀 Fazendo upload do deployment...');
  const tarBuffer = readFileSync(zipPath);
  const InputFile  = (await import('node-appwrite/file')).InputFile;
  const inputFile  = InputFile.fromBuffer(tarBuffer, 'process-agendadas.tar.gz');

  const deployment = await fns.createDeployment('process-agendadas', inputFile, true);
  log(`Deployment criado: ${deployment.$id}`);

  info('Aguardando build...');
  let status = deployment.status, attempts = 0;
  while (status !== 'ready' && status !== 'failed' && attempts < 30) {
    await new Promise(r => setTimeout(r, 3000));
    const dep = await fns.getDeployment('process-agendadas', deployment.$id);
    status = dep.status;
    info(`Status: ${status}`);
    attempts++;
  }

  if (status === 'ready') log('process-agendadas ativa com cron * * * * *!');
  else if (status === 'failed') throw new Error('Build falhou — verifique no Console Appwrite.');
  else warn('Timeout — verifique no Console Appwrite.');

  console.log('\n✅ Function process-agendadas pronta!');
}

// ── Main ──────────────────────────────────────────────────────────
(async () => {
  console.log('📣 Setup Central de Comunicações V2 — Wilson Distribuidora');
  console.log('━'.repeat(56));

  try {
    await expandirCampanhas();
    await criarColecaoComunicacoes();
    await criarColecaoTemplates();
    await criarFunctionProcessAgendadas();

    console.log('\n' + '━'.repeat(56));
    console.log('🎉 Central de Comunicações V2 configurada!');
    console.log('\nO que está disponível agora:');
    console.log('  → 5 tipos de mensagem (promoção, lembrete, transacional, geral, sistema)');
    console.log('  → Geração de mensagens com ChatGPT');
    console.log('  → Biblioteca de 10 templates editáveis');
    console.log('  → Agendamento automático via cron (process-agendadas, a cada minuto)');
    console.log('  → Quick Actions nos popups de notificação\n');
  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    if (err.response) console.error('Detalhe:', JSON.stringify(err.response, null, 2));
    process.exit(1);
  }
})();
