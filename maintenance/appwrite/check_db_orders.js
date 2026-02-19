
import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_DATABASE_ID;
const ORDERS_COLLECTION_ID = process.env.VITE_COLLECTION_ORDERS || 'orders';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function checkOrders() {
    console.log('--- Checking Orders Collection ---');
    try {
        // 1. Check/Create Attribute
        console.log('1. Checking Attributes...');
        try {
            await databases.getAttribute(DATABASE_ID, ORDERS_COLLECTION_ID, 'user_id');
            console.log("[OK] Attribute 'user_id' exists.");
        } catch (e) {
            console.log("[MISSING] Attribute 'user_id' missing. Creating...");
            try {
                await databases.createStringAttribute(DATABASE_ID, ORDERS_COLLECTION_ID, 'user_id', 255, false);
                console.log("[CREATED] Attribute 'user_id' created. Waiting for availability...");
                for (let i = 0; i < 10; i++) {
                    await sleep(2000);
                    const attr = await databases.getAttribute(DATABASE_ID, ORDERS_COLLECTION_ID, 'user_id');
                    if (attr.status === 'available') break;
                }
            } catch (createErr) {
                console.error("Failed to create attribute:", createErr.message);
            }
        }

        // 1.1 Check 'order_number' attribute
        try {
            await databases.getAttribute(DATABASE_ID, ORDERS_COLLECTION_ID, 'order_number');
            console.log("[OK] Attribute 'order_number' exists.");
        } catch (e) {
            console.log("[MISSING] Attribute 'order_number'. Creating integer attribute...");
            await databases.createIntegerAttribute(DATABASE_ID, ORDERS_COLLECTION_ID, 'order_number', false);
        }

        // 2. Check/Create Indexes
        console.log('\n2. Checking Indexes...');
        try {
            const attrs = await databases.listAttributes(DATABASE_ID, ORDERS_COLLECTION_ID);

            const userIdAttr = attrs.attributes.find(a => a.key === 'user_id');
            if (userIdAttr) console.log(`[OK] 'user_id': ${userIdAttr.type} (${userIdAttr.size})`);

            const itemsAttr = attrs.attributes.find(a => a.key === 'items');
            if (itemsAttr) console.log(`[CHECK] 'items': ${itemsAttr.type} (${itemsAttr.size})`);

            const totalAttr = attrs.attributes.find(a => a.key === 'total');
            if (totalAttr) console.log(`[OK] 'total': ${totalAttr.type}`);

            const indexes = await databases.listIndexes(DATABASE_ID, ORDERS_COLLECTION_ID);
            const userIdIndex = indexes.indexes.find(i => i.attributes.includes('user_id'));

            if (userIdIndex) {
                console.log(`[OK] Index for 'user_id' exists. Status: ${userIdIndex.status}`);
            } else {
                console.error(`[FAIL] Index for 'user_id' MISSING! Creating now...`);
                await databases.createIndex(DATABASE_ID, ORDERS_COLLECTION_ID, 'idx_user_id', 'key', ['user_id']);
                console.log("[CREATED] Index 'idx_user_id' created.");
            }
        } catch (e) {
            console.error("Could not check/create indexes:", e.message);
        }

        // 3. List Recent Orders
        console.log('\n3. fetching last 5 orders...');
        const orders = await databases.listDocuments(
            DATABASE_ID,
            ORDERS_COLLECTION_ID,
            [
                // Just get latest
            ]
        );

        console.log(`Found ${orders.documents.length} orders.`);
        orders.documents.slice(0, 5).forEach(doc => {
            console.log(`- Order: ${doc.$id} | User ID: ${doc.user_id} | Total: ${doc.total}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

checkOrders();
