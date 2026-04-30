import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function countUsers() {
    try {
        const response = await databases.listDocuments(
            process.env.DATABASE_ID || process.env.VITE_DATABASE_ID,
            process.env.VITE_COLLECTION_PROFILES
        );
        console.log(`Total de usuários (perfis) na base: ${response.total}`);
    } catch (error) {
        console.error("Erro ao contar usuários:", error.message);
    }
}

countUsers();
