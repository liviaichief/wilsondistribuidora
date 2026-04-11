
import { Client, Databases } from 'appwrite';

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27');

const databases = new Databases(client);
const DATABASE_ID = 'main_db';

async function checkValueType() {
    try {
        const response = await databases.listDocuments(DATABASE_ID, 'settings', []);
        if (response.total > 0) {
            const first = response.documents[0];
            console.log(`Key: ${first.key} | Value: ${first.value} | Type of Value: ${typeof first.value}`);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

checkValueType();
