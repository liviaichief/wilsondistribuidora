const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function checkCollections() {
    try {
        const collections = await databases.listCollections(process.env.DATABASE_ID);
        console.log('Collections:', collections.collections.map(c => c.$id));

        // Also try to list documents in settings if it exists
        try {
            const docs = await databases.listDocuments(process.env.DATABASE_ID, 'settings');
            console.log('Settings docs:', docs.documents.map(d => ({ id: d.$id, key: d.key, value: d.value })));
        } catch (e) {
            console.error('Settings collection error:', e.message);
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkCollections();
