
import { Client, Databases } from 'node-appwrite';

const client = new Client();
client
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27');

const databases = new Databases(client);

async function checkSettings() {
    try {
        const response = await databases.listDocuments('main_db', 'settings');
        console.log('--- Debug de URLs ---');
        response.documents.forEach(doc => {
            if (doc.key === 'whatsapp_api_url') {
                console.log(`${doc.key}: ${doc.value}`);
            }
        });
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

checkSettings();
