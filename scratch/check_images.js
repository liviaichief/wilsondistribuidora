
import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function checkProducts() {
    try {
        const response = await databases.listDocuments(
            process.env.VITE_DATABASE_ID,
            'products',
            []
        );
        console.log('Total produtos:', response.total);
        response.documents.slice(0, 5).forEach(doc => {
            console.log(`- ${doc.title}: image="${doc.image}"`);
        });
    } catch (e) {
        console.error(e);
    }
}
checkProducts();
