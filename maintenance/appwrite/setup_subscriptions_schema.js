
import { Client, Databases, Permission, Role, ID } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_DATABASE_ID || 'boutique_carne_db';
const COLLECTION_ID = 'subscriptions';

async function setupSubscriptionsSchema() {
    console.log('🚀 Iniciando criação da coleção de Assinaturas (Subscriptions)...');

    try {
        // 1. Criar Coleção
        try {
            await databases.createCollection(
                DATABASE_ID,
                COLLECTION_ID,
                'Subscriptions',
                [
                    Permission.read(Role.any()), // Permitir leitura para o middleware
                    Permission.write(Role.team('admins')), // Apenas admins criam/editam
                ]
            );
            console.log('✅ Coleção Subscriptions criada.');
        } catch (e) {
            console.log('ℹ️ Coleção Subscriptions já existe ou erro:', e.message);
        }

        // 2. Criar Atributos
        const attributes = [
            { key: 'status', type: 'enum', elements: ['ACTIVE', 'PAST_DUE', 'BLOCKED', 'CANCELED'], required: false, default: 'ACTIVE' },
            { key: 'expires_at', type: 'datetime', required: true },
            { key: 'grace_period_days', type: 'integer', required: false, default: 5 },
            { key: 'system_id', type: 'string', size: 100, required: true },
            { key: 'client_id', type: 'string', size: 255, required: true },
            { key: 'client_email', type: 'string', size: 255, required: false },
            { key: 'is_active', type: 'boolean', required: false, default: true }
        ];

        for (const attr of attributes) {
            console.log(`🔹 Criando atributo: ${attr.key}...`);
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, attr.key, attr.size, attr.required);
                } else if (attr.type === 'integer') {
                    await databases.createIntegerAttribute(DATABASE_ID, COLLECTION_ID, attr.key, attr.required, null, null, attr.default);
                } else if (attr.type === 'boolean') {
                    await databases.createBooleanAttribute(DATABASE_ID, COLLECTION_ID, attr.key, attr.required, attr.default);
                } else if (attr.type === 'datetime') {
                    await databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, attr.key, attr.required);
                } else if (attr.type === 'enum') {
                    await databases.createEnumAttribute(DATABASE_ID, COLLECTION_ID, attr.key, attr.elements, attr.required, attr.default);
                }
                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay para consistência no Appwrite
            } catch (e) {
                console.log(`   ⚠️ Erro no atributo ${attr.key}:`, e.message);
            }
        }

        // 3. Criar Índices
        console.log('📊 Criando índices...');
        try {
            await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'idx_client_system', 'unique', ['client_id', 'system_id']);
            await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'idx_status', 'key', ['status']);
        } catch (e) {
            console.log('   ⚠️ Erro nos índices:', e.message);
        }

        console.log('✅ Setup de Subscriptions concluído!');

    } catch (error) {
        console.error('❌ Falha crítica no setup:', error);
    }
}

setupSubscriptionsSchema();
