require('dotenv').config();
const { Client, Databases, Query } = require('node-appwrite');

async function migrate() {
    const client = new Client()
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    try {
        console.log(`Connecting to DB: ${process.env.VITE_DATABASE_ID}`);
        let hasMore = true;
        let offset = 0;
        let totalMigrated = 0;

        while (hasMore) {
            const response = await databases.listDocuments(
                process.env.VITE_DATABASE_ID,
                process.env.VITE_COLLECTION_PRODUCTS,
                [Query.limit(100), Query.offset(offset)]
            );

            if (response.documents.length === 0) {
                hasMore = false;
                break;
            }

            for (const doc of response.documents) {
                if (doc.category === 'embutidos') {
                    await databases.updateDocument(
                        process.env.VITE_DATABASE_ID,
                        process.env.VITE_COLLECTION_PRODUCTS,
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
    } catch (e) {
        console.error('Migration failed:', e);
    }
}
migrate();
