require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

async function deleteAllOrders() {
    const client = new Client()
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '698e695d001d446b21d9')
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const databaseId = process.env.DATABASE_ID || 'boutique_carne_db';
    const collectionId = process.env.VITE_COLLECTION_ORDERS || 'orders';

    try {
        console.log(`Buscando pedidos para excluir no banco ${databaseId}, coleção ${collectionId}...`);

        let totalDeleted = 0;
        let hasMore = true;

        while (hasMore) {
            const response = await databases.listDocuments(databaseId, collectionId);
            const documents = response.documents;

            if (documents.length === 0) {
                hasMore = false;
                break;
            }

            console.log(`Encontrados ${documents.length} pedidos nesta página. Excluindo...`);

            for (const doc of documents) {
                await databases.deleteDocument(databaseId, collectionId, doc.$id);
                console.log(`✅ Pedido excluído: ${doc.$id}`);
                totalDeleted++;
            }
        }

        console.log(`\n🎉 Processo concluído. Total de pedidos excluídos: ${totalDeleted}`);
        console.log(`O Dashboard foi automaticamente zerado!`);

    } catch (e) {
        console.error("Erro ao excluir pedidos:", e);
    }
}

deleteAllOrders();
