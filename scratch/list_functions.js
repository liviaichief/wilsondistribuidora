
import { Client, Functions } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const functions = new Functions(client);

async function listFunctions() {
    try {
        const response = await functions.list();
        console.log('Total funções:', response.total);
        response.functions.forEach(f => {
            console.log(`- ${f.name} ($id: ${f.$id})`);
        });
    } catch (e) {
        console.error('Erro ao listar funções:', e);
    }
}
listFunctions();
