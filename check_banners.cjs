require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

async function checkBanners() {
    const client = new Client()
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    try {
        const res = await databases.listDocuments(
            process.env.VITE_DATABASE_ID,
            process.env.VITE_COLLECTION_BANNERS
        );
        console.log("First banner:", JSON.stringify(res.documents[0], null, 2));
    } catch (e) {
        console.error('Failed:', e);
    }
}
checkBanners();
