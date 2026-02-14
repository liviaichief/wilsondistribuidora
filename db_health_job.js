
import { Client, Databases } from 'node-appwrite';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Configuration from .env
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '698e695d001d446b21d9';
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.DATABASE_ID || 'boutique_carne_db';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

const LOG_FILE = path.join(process.cwd(), 'db_health_log.txt');

/**
 * Perform health check
 */
async function checkHealth() {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] Inciando verificação de saúde do banco...`);

    let status = 'SUCCESS';
    let message = 'Conexão e leitura de produtos OK';

    try {
        // Simple read operation to verify database health
        const response = await databases.listDocuments(DATABASE_ID, 'products', []);

        const logEntry = `[${timestamp}] STATUS: ${status} | Produtos encontrados: ${response.total} | ${message}\n`;
        fs.appendFileSync(LOG_FILE, logEntry);
        console.log(`[${timestamp}] Verificação concluída com sucesso.`);

    } catch (error) {
        status = 'ERROR';
        message = error.message;
        const logEntry = `[${timestamp}] STATUS: ${status} | ERRO: ${message}\n`;
        fs.appendFileSync(LOG_FILE, logEntry);
        console.error(`[${timestamp}] Erro na verificação: ${message}`);
    }
}

// 12 hours interval in milliseconds
const INTERVAL = 12 * 60 * 60 * 1000;

console.log('--- Job de Verificação de Saúde do Banco ---');
console.log(`Configurado para rodar a cada 12 horas.`);
console.log(`Logs serão salvos em: ${LOG_FILE}`);

// Run immediately on start
checkHealth();

// Schedule repeat
setInterval(checkHealth, INTERVAL);
