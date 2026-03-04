const { Client, Databases, Query } = require('node-appwrite');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // Load .env from root

const client = new Client();
client
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '698e695d001d446b21d9')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_DATABASE_ID || 'boutique_carne_db';
const COLLECTION_ID = process.env.VITE_COLLECTION_PRODUCTS || 'products';

async function migrateCategories() {
    try {
        console.log(`Connecting to DB: ${DATABASE_ID}, Collection: ${COLLECTION_ID}`);
        let hasMore = true;
        let offset = 0;
        let totalMigrated = 0;

        while (hasMore) {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID,
                [Query.limit(100), Query.offset(offset)]
            );

            if (response.documents.length === 0) {
                hasMore = false;
                break;
            }

            for (const doc of response.documents) {
                if (doc.category === 'embutidos') {
                    await databases.updateDocument(
                        DATABASE_ID,
                        COLLECTION_ID,
                        doc.$id,
                        { category: 'suinos' }
                    );
                    console.log(`Updated product: ${doc.title}`);
                    totalMigrated++;
                }
            }

            offset += response.documents.length;
        }

        console.log(`Migration complete. Total updated: ${totalMigrated}`);
    } catch (error) {
        console.error('Error during migration:', error);
    }
}

migrateCategories();
