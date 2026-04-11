
import { Client, Databases, Query } from 'appwrite';

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27');

const databases = new Databases(client);
const DATABASE_ID = 'main_db';

async function listOrders() {
    try {
        const res = await databases.listDocuments(DATABASE_ID, 'orders', [Query.limit(10)]);
        console.log(`Found ${res.total} orders.`);
        res.documents.forEach(d => {
            console.log(`Order: ${d.$id} | Status: ${d.status} | Total: ${d.total_amount}`);
        });
    } catch (e) {
        console.error(e);
    }
}

listOrders();
