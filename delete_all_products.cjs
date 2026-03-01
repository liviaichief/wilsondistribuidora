require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

async function deleteAllProducts() {
    const client = new Client()
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '698e695d001d446b21d9')
        .setKey(process.env.APPWRITE_API_KEY); // Must have a backend API key with permissions

    const databases = new Databases(client);
    const databaseId = process.env.DATABASE_ID || 'boutique_carne_db';
    const collectionId = process.env.VITE_COLLECTION_PRODUCTS || 'products';

    try {
        console.log(`Buscando produtos para excluir no banco ${databaseId}, coleção ${collectionId}...`);

        // Appwrite limit is 100 max per request, we'll loop to handle if there are more
        let totalDeleted = 0;
        let hasMore = true;

        while (hasMore) {
            const response = await databases.listDocuments(databaseId, collectionId);
            const documents = response.documents;

            if (documents.length === 0) {
                hasMore = false;
                break;
            }

            console.log(`Encontrados ${documents.length} produtos nesta página. Excluindo...`);

            for (const doc of documents) {
                await databases.deleteDocument(databaseId, collectionId, doc.$id);
                console.log(`✅ Produto excluído: ${doc.name || doc.$id}`);
                totalDeleted++;
            }
        }

        console.log(`\n🎉 Processo concluído. Total de produtos excluídos: ${totalDeleted}`);

    } catch (e) {
        console.error("Erro ao excluir produtos:", e);
    }
}

deleteAllProducts();
