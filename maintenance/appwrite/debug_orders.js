
import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '698e695d001d446b21d9')
    .setKey(API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_DATABASE_ID || 'boutique_carne_db';
const ORDERS_COLLECTION_ID = process.env.VITE_COLLECTION_ORDERS || 'orders';

async function debugOrders() {
    console.log('=== DEBUGGING ORDERS ===');
    console.log(`Target: DB=${DATABASE_ID}, COL=${ORDERS_COLLECTION_ID}`);

    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            ORDERS_COLLECTION_ID,
            [
                Query.limit(5),
                Query.orderDesc('$createdAt')
            ]
        );

        console.log(`Found ${response.total} orders.`);

        response.documents.forEach(doc => {
            console.log('\n------------------------------------------------');
            console.log(`Order ID: ${doc.$id}`);
            console.log(`Created At: ${doc.$createdAt}`);
            console.log(`Order Number: ${doc.order_number}`);
            console.log(`User ID (in data): ${doc.user_id}`);
            console.log(`Permissions:`, doc.$permissions);

            // Check if permissions match user_id
            const hasUserRead = doc.$permissions.some(p => p.startsWith(`read("user:${doc.user_id}")`));
            console.log(`Has Read Permission for User ID? ${hasUserRead ? 'YES' : 'NO'}`);
        });

    } catch (e) {
        console.error("ERROR:", e.message);
    }
}

debugOrders();
