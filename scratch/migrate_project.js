
import { Client, Databases, Storage, ID, Permission, Role } from 'node-appwrite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURAÇÕES DA CONTA ANTIGA (ORIGEM)
const OLD_ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const OLD_PROJECT_ID = '69d59db800358cca9f27';
const OLD_API_KEY = 'standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140';
const OLD_DB_ID = 'main_db';

// CONFIGURAÇÕES DA CONTA NOVA (DESTINO)
const NEW_ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const NEW_PROJECT_ID = '69ebf93f000372e879ff';
const NEW_API_KEY = 'standard_06684859eef23fe37b1b2b5e69fba753f7637355c69fe55c029cd878bcc2ef835e1deb4b4f9fed425e938d81245cec097cffe9e3bd18692f28b3434cc5b73edc3b10dd447f75aec2c4f381bce89c56688ad8bed3bdaac0c0ec1876722e6259578a3a99aeb3802544082dd77cf6f438eedd16ee5a0a95e4b863cad153f5471e46';
const NEW_DB_ID = 'main_db';

// Clients
const oldClient = new Client().setEndpoint(OLD_ENDPOINT).setProject(OLD_PROJECT_ID).setKey(OLD_API_KEY);
const newClient = new Client().setEndpoint(NEW_ENDPOINT).setProject(NEW_PROJECT_ID).setKey(NEW_API_KEY);

const oldDB = new Databases(oldClient);
const newDB = new Databases(newClient);
const newStorage = new Storage(newClient);

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function migrate() {
    console.log('🚀 Iniciando Migração Master...');

    // 1. CRIAR DATABASE NO DESTINO
    try {
        await newDB.create(NEW_DB_ID, 'Wilson Distribuidora DB');
        console.log('✅ Banco de dados criado no destino.');
    } catch (e) {
        console.log('ℹ️ Banco de dados já existe ou erro:', e.message);
    }

    // 2. CRIAR BUCKET NO DESTINO
    const BUCKET_ID = 'images_bucket';
    try {
        await newStorage.createBucket(BUCKET_ID, 'Imagens', [
            Permission.read(Role.any()),
            Permission.create(Role.any()),
            Permission.update(Role.any()),
            Permission.delete(Role.any())
        ]);
        console.log('✅ Bucket criado no destino.');
    } catch (e) {
        console.log('ℹ️ Bucket já existe ou erro:', e.message);
    }

    // 3. DEFINIÇÃO DE COLEÇÕES E ATRIBUTOS
    const schema = {
        products: {
            name: 'Products',
            attrs: [
                { key: 'sku', type: 'string', size: 50, req: true },
                { key: 'title', type: 'string', size: 255, req: true },
                { key: 'description', type: 'string', size: 2000, req: false },
                { key: 'price', type: 'float', req: true },
                { key: 'category', type: 'string', size: 100, req: true },
                { key: 'image', type: 'string', size: 255, req: false },
                { key: 'uom', type: 'string', size: 20, req: false },
                { key: 'is_promotion', type: 'boolean', req: false, def: false },
                { key: 'promo_price', type: 'float', req: false },
                { key: 'active', type: 'boolean', req: false, def: true },
                { key: 'manage_stock', type: 'boolean', req: false, def: false },
                { key: 'stock_quantity', type: 'integer', req: false, def: 0 },
                { key: 'allow_backorder', type: 'boolean', req: false, def: false },
                { key: 'disable_on_zero_stock', type: 'boolean', req: false, def: false }
            ],
            indexes: [
                { key: 'idx_sku', type: 'unique', attrs: ['sku'] },
                { key: 'idx_cat', type: 'key', attrs: ['category'] }
            ]
        },
        banners: {
            name: 'Banners',
            attrs: [
                { key: 'title', type: 'string', size: 255, req: true },
                { key: 'image_url', type: 'string', size: 2048, req: true },
                { key: 'product', type: 'string', size: 255, req: false },
                { key: 'active', type: 'boolean', req: false, def: true },
                { key: 'display_order', type: 'integer', req: false, def: 0 },
                { key: 'duration', type: 'integer', req: false, def: 5 }
            ]
        },
        orders: {
            name: 'Orders',
            attrs: [
                { key: 'order_number', type: 'string', size: 50, req: false },
                { key: 'status', type: 'string', size: 50, req: false },
                { key: 'total', type: 'float', req: true },
                { key: 'items', type: 'string', size: 10000, req: false },
                { key: 'user_id', type: 'string', size: 255, req: false },
                { key: 'customer_name', type: 'string', size: 255, req: false },
                { key: 'customer_phone', type: 'string', size: 50, req: false },
                { key: 'payment_method', type: 'string', size: 50, req: false },
                { key: 'delivery_mode', type: 'string', size: 50, req: false },
                { key: 'delivery_address', type: 'string', size: 2000, req: false }
            ]
        },
        profiles: {
            name: 'Profiles',
            attrs: [
                { key: 'email', type: 'string', size: 255, req: true },
                { key: 'full_name', type: 'string', size: 255, req: false },
                { key: 'role', type: 'string', size: 50, req: false },
                { key: 'user_id', type: 'string', size: 255, req: false },
                { key: 'phone', type: 'string', size: 50, req: false },
                { key: 'whatsapp', type: 'string', size: 50, req: false },
                { key: 'birthday', type: 'string', size: 50, req: false },
                { key: 'last_login', type: 'string', size: 50, req: false },
                { key: 'address_cep', type: 'string', size: 20, req: false },
                { key: 'address_street', type: 'string', size: 255, req: false },
                { key: 'address_number', type: 'string', size: 50, req: false },
                { key: 'address_neighborhood', type: 'string', size: 255, req: false },
                { key: 'address_city', type: 'string', size: 255, req: false },
                { key: 'address_state', type: 'string', size: 50, req: false },
                { key: 'address_complement', type: 'string', size: 255, req: false },
                { key: 'address', type: 'string', size: 1000, req: false }
            ]
        },
        settings: {
            name: 'Settings',
            attrs: [
                { key: 'key', type: 'string', size: 100, req: true },
                { key: 'value', type: 'string', size: 15000, req: true }
            ]
        }
    };

    // Criar Coleções e Atributos
    for (const [colId, config] of Object.entries(schema)) {
        console.log(`\n📦 Configurando coleção: ${config.name}...`);
        try {
            await newDB.createCollection(NEW_DB_ID, colId, config.name, [
                Permission.read(Role.any()),
                Permission.create(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any())
            ]);
            console.log(`✅ Coleção ${colId} criada.`);
        } catch (e) {
            console.log(`ℹ️ Coleção ${colId} já existe.`);
        }

        for (const attr of config.attrs) {
            try {
                if (attr.type === 'string') await newDB.createStringAttribute(NEW_DB_ID, colId, attr.key, attr.size, attr.req);
                else if (attr.type === 'float') await newDB.createFloatAttribute(NEW_DB_ID, colId, attr.key, attr.req);
                else if (attr.type === 'boolean') await newDB.createBooleanAttribute(NEW_DB_ID, colId, attr.key, attr.req, attr.def);
                else if (attr.type === 'integer') await newDB.createIntegerAttribute(NEW_DB_ID, colId, attr.key, attr.req, 0, 1000000, attr.def);
                console.log(`  + Atributo: ${attr.key}`);
                await delay(300);
            } catch (e) { if (e.code !== 409) console.log(`  ! Erro no atributo ${attr.key}:`, e.message); }
        }
    }

    console.log('\n⏳ Aguardando 10 segundos para processamento dos atributos...');
    await delay(10000);

    // Índices
    for (const [colId, config] of Object.entries(schema)) {
        if (config.indexes) {
            for (const idx of config.indexes) {
                try {
                    await newDB.createIndex(NEW_DB_ID, colId, idx.key, idx.type, idx.attrs);
                    console.log(`✅ Índice ${idx.key} criado em ${colId}.`);
                } catch (e) { if (e.code !== 409) console.log(`  ! Erro no índice ${idx.key}:`, e.message); }
            }
        }
    }

    // 4. MIGRAÇÃO DE DADOS (DOCS)
    console.log('\n📥 Migrando dados do banco antigo...');
    const collectionsToMigrate = ['products', 'banners', 'settings'];
    
    for (const colId of collectionsToMigrate) {
        try {
            console.log(`\nMigrando ${colId}...`);
            const docs = await oldDB.listDocuments(OLD_DB_ID, colId);
            console.log(`Encontrados ${docs.total} documentos.`);

            for (const doc of docs.documents) {
                const { $id, $permissions, $collectionId, $databaseId, $createdAt, $updatedAt, ...data } = doc;
                try {
                    await newDB.createDocument(NEW_DB_ID, colId, $id, data);
                    console.log(`  ✅ Doc ${$id} migrado.`);
                } catch (e) {
                    if (e.code === 409) console.log(`  ℹ️ Doc ${$id} já existe no destino.`);
                    else console.log(`  ❌ Erro no doc ${$id}:`, e.message);
                }
            }
        } catch (e) {
            console.error(`❌ Falha ao migrar coleção ${colId}:`, e.message);
            if (e.code === 402) console.error('  (O limite de banda da conta antiga impediu a leitura desta coleção)');
        }
    }

    // 5. ATUALIZAR .ENV
    console.log('\n📝 Atualizando arquivo .env...');
    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    const replacements = {
        'VITE_APPWRITE_PROJECT_ID': NEW_PROJECT_ID,
        'APPWRITE_API_KEY': NEW_API_KEY,
        'VITE_APPWRITE_ENDPOINT': NEW_ENDPOINT,
        'VITE_DATABASE_ID': NEW_DB_ID,
        'DATABASE_ID': NEW_DB_ID
    };

    for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(`^${key}=.*`, 'm');
        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}="${value}"`);
        } else {
            envContent += `\n${key}="${value}"`;
        }
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
    console.log('✅ Arquivo .env atualizado!');

    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('Próximo passo: Rodar node create-admin.js para garantir acesso ao novo painel.');
}

migrate().catch(console.error);
