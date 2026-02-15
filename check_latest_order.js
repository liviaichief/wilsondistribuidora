
import { Client, Databases, Query } from 'node-appwrite';

const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '698e695d001d446b21d9';
const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';
const DATABASE_ID = 'boutique_carne_db';
const ORDERS_COLLECTION = 'orders';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function checkLatestOrder() {
    console.log("Checking latest orders...");
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            ORDERS_COLLECTION,
            [
                Query.orderDesc('$createdAt'),
                Query.limit(1)
            ]
        );

        if (response.documents.length > 0) {
            const order = response.documents[0];
            console.log("Latest Order Found:");
            console.log(`- ID: ${order.$id}`);
            console.log(`- Customer: ${order.customer_name}`);
            console.log(`- Status: ${order.status}`);
            console.log(`- Total: ${order.total}`);
            console.log(`- Created At: ${order.$createdAt}`);
        } else {
            console.log("No orders found yet.");
        }
    } catch (error) {
        console.error("Error fetching orders:", error.message);
    }
}

checkLatestOrder();
