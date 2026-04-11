
import { Client, Databases, ID, Permission, Role } from 'appwrite';

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27');

const databases = new Databases(client);
const DATABASE_ID = 'main_db';

async function testCreateOrder() {
    try {
        console.log("Attempting to create a test order directly...");
        const res = await databases.createDocument(DATABASE_ID, 'orders', ID.unique(), {
            customer_name: "Test Antigravity",
            customer_phone: "(11) 99999-9999",
            total: 150.50,
            status: "pending",
            items: JSON.stringify([{name: "Teste", price: 150.50, quantity: 1}]),
            user_id: "test_user_id"
        });
        console.log("Order created successfully!", res.$id);
    } catch (error) {
        console.error("Order creation failed:", error);
    }
}

testCreateOrder();
