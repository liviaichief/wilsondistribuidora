/**
 * Deploy da função update-copa-schedule no Appwrite
 * Cria a função se não existir, faz upload do código e configura cron diário a partir de 11/06/2026.
 *
 * Uso: node scripts/deploy_copa_schedule.cjs
 */

const { Client, Functions, InputFile } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

const ENDPOINT   = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '69ebf93f000372e879ff';
const API_KEY    = 'standard_06684859eef23fe37b1b2b5e69fba753f7637355c69fe55c029cd878bcc2ef835e1deb4b4f9fed425e938d81245cec097cffe9e3bd18692f28b3434cc5b73edc3b10dd447f75aec2c4f381bce89c56688ad8bed3bdaac0c0ec1876722e6259578a3a99aeb3802544082dd77cf6f438eedd16ee5a0a95e4b863cad153f5471e46';
const APPWRITE_API_KEY = 'standard_06684859eef23fe37b1b2b5e69fba753f7637355c69fe55c029cd878bcc2ef835e1deb4b4f9fed425e938d81245cec097cffe9e3bd18692f28b3434cc5b73edc3b10dd447f75aec2c4f381bce89c56688ad8bed3bdaac0c0ec1876722e6259578a3a99aeb3802544082dd77cf6f438eedd16ee5a0a95e4b863cad153f5471e46';

const FUNCTION_ID   = 'update-copa-schedule';
const FUNCTION_NAME = 'Update Copa Schedule';
// Cron: todos os dias às 7h BRT (10h UTC) — começa a partir de 11/06
const CRON_SCHEDULE = '0 10 * * *';

async function run() {
  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
  const fns = new Functions(client);

  // 1. Cria ou atualiza a função
  let fn;
  try {
    fn = await fns.get(FUNCTION_ID);
    console.log('Função já existe, atualizando...');
    await fns.update(FUNCTION_ID, FUNCTION_NAME, ['any'], {
      schedule: CRON_SCHEDULE,
      timeout: 30,
      enabled: true,
      vars: { APPWRITE_API_KEY }
    });
  } catch (e) {
    if (e.code === 404) {
      console.log('Criando função...');
      // create(functionId, name, runtime, execute, events, schedule, timeout, enabled, logging, entrypoint, commands)
      fn = await fns.create(
        FUNCTION_ID,
        FUNCTION_NAME,
        'node-18.0',
        ['any'],
        [],
        CRON_SCHEDULE,
        30,
        true,
        true,
        'src/index.js',
        'npm install'
      );
    } else {
      throw e;
    }
  }

  // 2. Upload do código
  const tarPath = path.join(__dirname, '../functions/update-copa-schedule.tar.gz');
  const tarBuffer = fs.readFileSync(tarPath);
  const inputFile = InputFile.fromBuffer(tarBuffer, 'code.tar.gz');

  console.log('Fazendo upload do código...');
  const deployment = await fns.createDeployment(
    FUNCTION_ID,
    inputFile,
    true,   // activate
    'src/index.js',
    'npm install'
  );

  console.log('✅ Função deployada:', deployment.$id);
  console.log(`   Cron: ${CRON_SCHEDULE} (diário às 10h UTC / 7h BRT)`);
  console.log('   Ativa a partir de 11/06/2026 automaticamente.');
}

run().catch(e => { console.error('❌ Erro:', e.message); process.exit(1); });
