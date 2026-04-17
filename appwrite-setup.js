import { Client, Databases, Storage, ID, Permission, Role } from 'node-appwrite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis se precisar, ou já usar diretas
const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '69d59db800358cca9f27';
const API_KEY = 'standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
    console.log("Iniciando setup do Appwrite...");

    // 1. DATABASE
    let dbId = 'main_db';
    try {
        await databases.get(dbId);
        console.log(`Database '${dbId}' already exists.`);
    } catch (e) {
        if (e.code === 404) {
            console.log(`Criando database '${dbId}'...`);
            await databases.create(dbId, 'Principal DB');
        } else {
            throw e;
        }
    }

    // 2. BUCKET
    let bucketId = 'images_bucket';
    try {
        await storage.getBucket(bucketId);
        console.log(`Bucket '${bucketId}' already exists.`);
    } catch (e) {
        if (e.code === 404) {
            console.log(`Criando bucket '${bucketId}'...`);
            await storage.createBucket(bucketId, 'Imagens Globais');
        } else {
            throw e;
        }
    }

    const createdCollections = {};

    // Helper to create collection
    async function createColl(colId, name) {
        try {
            await databases.getCollection(dbId, colId);
            console.log(`Collection '${name}' (${colId}) já existe.`);
        } catch (e) {
            if (e.code === 404) {
                console.log(`Criando collection '${name}'...`);
                // Permissões padrão para e-commerce (Livre leitura, Admin writes - simplificado)
                await databases.createCollection(dbId, colId, name, [
                    Permission.read(Role.any()),
                    Permission.create(Role.any()),
                    Permission.update(Role.any()),
                    Permission.delete(Role.any())
                ]);
            } else {
                throw e;
            }
        }
        createdCollections[name] = colId;
    }

    await createColl('products', 'Products');
    await createColl('banners', 'Banners');
    await createColl('orders', 'Orders');
    await createColl('profiles', 'Profiles');
    await createColl('settings', 'Settings');

    console.log('--- Atributos ---');
    // Function to handle attr creation silently if exists
    async function createString(colId, key, size, required = false) {
        try { await databases.createStringAttribute(dbId, colId, key, size, required); console.log(`+ attr: ${key}`); await delay(500); } catch (e) { if (e.code !== 409) console.log(e); }
    }
    async function createFloat(colId, key, required = false) {
        try { await databases.createFloatAttribute(dbId, colId, key, required); console.log(`+ attr: ${key}`); await delay(500); } catch (e) { if (e.code !== 409) console.log(e); }
    }
    async function createBoolean(colId, key, required = false, def = false) {
        try { await databases.createBooleanAttribute(dbId, colId, key, required, def); console.log(`+ attr: ${key}`); await delay(500); } catch (e) { if (e.code !== 409) console.log(e); }
    }
    async function createInteger(colId, key, required = false, def = 0) {
        try { await databases.createIntegerAttribute(dbId, colId, key, required, 0, 1000000, def); console.log(`+ attr: ${key}`); await delay(500); } catch (e) { if (e.code !== 409) console.log(e); }
    }

    // Products Attrs
    console.log("Configurando products...");
    await createString('products', 'sku', 50, true);
    await createString('products', 'title', 255, true);
    await createString('products', 'description', 2000, false);
    await createFloat('products', 'price', true);
    await createString('products', 'category', 100, true);
    await createString('products', 'image', 255, false);
    await createString('products', 'uom', 20, false);
    await createBoolean('products', 'is_promotion', false, false);
    await createFloat('products', 'promo_price', false);
    await createBoolean('products', 'active', false, true);

    // Banners Attrs
    console.log("Configurando banners...");
    await createString('banners', 'title', 255, true);
    await createString('banners', 'image_url', 2048, true);
    await createString('banners', 'product', 255, false); // as string reference
    await createBoolean('banners', 'active', false, true);
    await createInteger('banners', 'display_order', false, 0);
    await createInteger('banners', 'duration', false, 5);

    // Orders Attrs
    console.log("Configurando orders...");
    await createString('orders', 'order_number', 50, false);
    await createString('orders', 'status', 50, false);
    await createFloat('orders', 'total', true);
    await createString('orders', 'items', 10000, false); // JSON
    await createString('orders', 'user_id', 255, false);
    await createString('orders', 'customer_name', 255, false);
    await createString('orders', 'customer_phone', 50, false);
    await createString('orders', 'payment_method', 50, false);

    // Settings Attrs
    console.log("Configurando settings...");
    await createString('settings', 'key', 50, true);
    await createString('settings', 'value', 5000, true);

    // Wait for attributes to be ready before creating indexes
    console.log("Aguardando 10s para finalização dos atributos antes dos índices...");
    await delay(10000);

    console.log('--- Indexes ---');
    async function createIndex(colId, key, type, attrs) {
        try { await databases.createIndex(dbId, colId, key, type, attrs); console.log(`+ index: ${key}`); await delay(500); } catch (e) { if (e.code !== 409) console.log(e); }
    }
    await createIndex('products', 'idx_cat', 'key', ['category']);
    await createIndex('products', 'idx_sku', 'unique', ['sku']);
    
    // Injecting into .env
    console.log("Atualizando arquivo .env...");
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    try {
        envContent = fs.readFileSync(envPath, 'utf8');
    } catch { }

    const updateEnv = (key, value) => {
        const regex = new RegExp(`^${key}=.*`, 'm');
        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}="${value}"`);
        } else {
            envContent += `\n${key}="${value}"`;
        }
    };

    updateEnv('DATABASE_ID', dbId);
    updateEnv('VITE_DATABASE_ID', dbId);
    updateEnv('VITE_APPWRITE_BUCKET_ID', bucketId);
    updateEnv('VITE_COLLECTION_PRODUCTS', 'products');
    updateEnv('VITE_COLLECTION_BANNERS', 'banners');
    updateEnv('VITE_COLLECTION_ORDERS', 'orders');
    updateEnv('VITE_COLLECTION_PROFILES', 'profiles');

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
    console.log('.env atualizado!');

    // Inject 1 test product and 1 settings record to avoid errors
    console.log("Injetando dados de teste básicos...");
    try {
        await databases.createDocument(dbId, 'products', ID.unique(), {
            sku: 'SKU-00100',
            title: 'Picanha Uruguaia Grill',
            price: 65.90,
            category: 'carnes',
            active: true
        });
        console.log("Produto inserido.");
    } catch (e) {
        console.log("Produto teste talvez já exista.");
    }

    try {
        await databases.createDocument(dbId, 'settings', 'system_blocked', {
            key: 'system_blocked',
            value: 'false'
        });
        console.log("Settings 'system_blocked' inserido.");
    } catch (e) {
        console.log("Settings talvez já exista.");
    }

    console.log("TUDO PRONTO! Schema inicializado e .env atualizado com os novos IDs.");
}

run().catch(console.error);
