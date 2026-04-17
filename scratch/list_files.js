
import { Client, Storage } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);

async function listFiles() {
    try {
        const response = await storage.listFiles(process.env.VITE_APPWRITE_BUCKET_ID || 'images_bucket');
        console.log('Total arquivos no bucket:', response.total);
        response.files.slice(0, 5).forEach(f => {
            console.log(`- ${f.name} ($id: ${f.$id})`);
        });
    } catch (e) {
        console.error(e);
    }
}
listFiles();
