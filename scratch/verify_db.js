
import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_DATABASE_ID || 'main_db';

const collectionsToCheck = [
    { id: process.env.VITE_COLLECTION_PRODUCTS || 'products', name: 'Produtos' },
    { id: process.env.VITE_COLLECTION_BANNERS || 'banners', name: 'Banners' },
    { id: process.env.VITE_COLLECTION_ORDERS || 'orders', name: 'Pedidos' },
    { id: process.env.VITE_COLLECTION_PROFILES || 'profiles', name: 'Perfis de Usuários' },
    { id: 'settings', name: 'Configurações' }
];

async function verify() {
    console.log("=== Verificando Integração Appwrite ===");
    console.log(`Endpoint: ${process.env.VITE_APPWRITE_ENDPOINT}`);
    console.log(`Projeto: ${process.env.VITE_APPWRITE_PROJECT_ID}`);
    console.log(`Database: ${DATABASE_ID}`);
    console.log("---------------------------------------");

    for (const col of collectionsToCheck) {
        try {
            const result = await databases.listDocuments(DATABASE_ID, col.id);
            console.log(`✅ [${col.name}] (${col.id}): Conectado. (${result.total} documentos encontrados)`);
            
            // Se for a tabela de produtos, vamos verificar os atributos específicos que adicionei recentemente
            if (col.id === 'products') {
                const attrCheck = await databases.listAttributes(DATABASE_ID, col.id);
                const attrs = attrCheck.attributes.map(a => a.key);
                
                const expectedAttrs = ['has_bundle_option', 'unit_price', 'has_assorted_min', 'assorted_min_qty', 'external_code'];
                console.log("   Verificando Atributos Específicos:");
                expectedAttrs.forEach(at => {
                    if (attrs.includes(at)) {
                        console.log(`   - ${at}: ✅ Existe`);
                    } else {
                        console.log(`   - ${at}: ❌ Faltando`);
                    }
                });
            }
        } catch (error) {
            console.log(`❌ [${col.name}] (${col.id}): Falha na conexão ou Tabela inexistente.`);
            console.log(`   Erro: ${error.message}`);
        }
    }
    console.log("---------------------------------------");
}

verify();
