const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function checkCollectionPerms() {
    try {
        const pColl = await databases.getCollection(process.env.DATABASE_ID, process.env.VITE_COLLECTION_PRODUCTS || 'products');
        console.log('Products Permissions:', pColl.$permissions);
        console.log('Document Security:', pColl.documentSecurity);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkCollectionPerms();
