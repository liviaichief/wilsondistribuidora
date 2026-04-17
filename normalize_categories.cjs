
const { Client, Databases, Query } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27')
    .setKey('standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140');

const databases = new Databases(client);
const DATABASE_ID = 'main_db';
const COLLECTION_ID = 'products';

async function normalizeCategories() {
    console.log("🚀 Iniciando normalização de categorias...");

    try {
        const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.limit(5000)]);
        const products = response.documents;

        console.log(`📦 Encontrados ${products.length} produtos.`);

        let updated = 0;

        for (const product of products) {
            let newCategory = product.category;
            const currentCat = (product.category || '').toLowerCase();

            // Mapeamento
            if (currentCat === 'carne' || currentCat === 'carnes') {
                newCategory = 'bovinos';
            } else if (currentCat === 'kit resenha' || currentCat === 'kit' || currentCat === 'kits') {
                newCategory = 'kits';
            } else if (currentCat === 'frango' || currentCat === 'aves') {
                newCategory = 'aves';
            } else if (currentCat === 'suinos' || currentCat === 'suínos' || currentCat === 'porco') {
                newCategory = 'suinos';
            } else if (['bebidas', 'acessorios', 'insumos', 'acompanhamentos', 'pescados', 'caixas', 'eventos', 'espetinhos'].includes(currentCat)) {
                newCategory = 'mercado';
            }

            if (newCategory !== product.category) {
                console.log(`🔄 Atualizando: "${product.title}" (${product.category} -> ${newCategory})`);
                await databases.updateDocument(DATABASE_ID, COLLECTION_ID, product.$id, {
                    category: newCategory
                });
                updated++;
            }
        }

        console.log(`✅ Concluído! ${updated} produtos foram reclassificados.`);

    } catch (error) {
        console.error("❌ Erro durante a migração:", error);
    }
}

normalizeCategories();
