
import { Client, Databases } from 'appwrite';

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27');

const databases = new Databases(client);
const DATABASE_ID = 'main_db';

async function deleteOrder() {
    try {
        await databases.deleteDocument(DATABASE_ID, 'orders', '69d9bb3c0037cd4e3b44');
        console.log("Test order deleted.");
    } catch (e) {
        console.error(e);
    }
}

deleteOrder();
