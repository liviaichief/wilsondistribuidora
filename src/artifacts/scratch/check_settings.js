
import { Client, Databases } from 'node-appwrite';

const client = new Client();
client
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27');

const databases = new Databases(client);

async function checkSettings() {
    try {
        const response = await databases.listDocuments('main_db', 'settings');
        console.log('--- Configurações Atuais ---');
        response.documents.forEach(doc => {
            const displayValue = (doc.key.includes('key') || doc.key.includes('token') || doc.key.includes('url')) ? '********' : doc.value;
            console.log(`${doc.key}: ${displayValue}`);
        });
    } catch (error) {
        console.error('Erro ao ler configurações:', error.message);
    }
}

checkSettings();
