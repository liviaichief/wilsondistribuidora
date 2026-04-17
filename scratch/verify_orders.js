
import { Client, Databases, Query } from 'appwrite';

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27'); // Corrected project ID from .env

const databases = new Databases(client);
const DATABASE_ID = 'main_db';

async function checkOrders() {
    try {
        console.log("--- Checking Admin Side (All Orders) ---");
        const adminOrders = await databases.listDocuments(DATABASE_ID, 'orders', [
            Query.limit(5),
            Query.orderDesc('$createdAt')
        ]);
        
        console.log(`Total orders in DB: ${adminOrders.total}`);
        adminOrders.documents.forEach(o => {
            console.log(`Order #${o.order_number || o.$id.slice(-6).toUpperCase()} | Customer: ${o.customer_name} | UserID: ${o.user_id} | Total: ${o.total || o.total_amount}`);
        });

        const firstOrder = adminOrders.documents[0];
        if (firstOrder && firstOrder.user_id) {
            console.log(`\n--- Checking User Side (Orders for User: ${firstOrder.user_id}) ---`);
            const userOrders = await databases.listDocuments(DATABASE_ID, 'orders', [
                Query.equal('user_id', [firstOrder.user_id]),
                Query.limit(5)
            ]);
            console.log(`Orders found for this user: ${userOrders.total}`);
        } else {
            console.log("\nNo orders with user_id found to test user side filter.");
        }

    } catch (error) {
        console.error("Error during verification:", error);
    }
}

checkOrders();
