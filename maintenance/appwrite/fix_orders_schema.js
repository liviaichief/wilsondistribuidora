
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

async function fixSchema() {
    console.log('=== FIXING ORDERS SCHEMA ===');

    // 1. Attributes
    const attributes = [
        { key: 'customer_name', type: 'string', size: 255, required: true },
        { key: 'customer_phone', type: 'string', size: 255, required: true },
        { key: 'payment_method', type: 'string', size: 255, required: true },
        { key: 'total', type: 'double', required: true },
        { key: 'items', type: 'string', size: 10000, required: true }, // Increased size for JSON
        { key: 'user_id', type: 'string', size: 255, required: false },
        { key: 'order_number', type: 'integer', required: false }
    ];

    for (const attr of attributes) {
        process.stdout.write(`Checking attribute '${attr.key}'... `);
        try {
            const existing = await databases.getAttribute(DATABASE_ID, ORDERS_COLLECTION_ID, attr.key);
            console.log(`EXISTS (${existing.size})`);

            if (attr.key === 'items' && existing.size < 10000) {
                console.log(`  -> Size ${existing.size} is too small. Updating to 10000...`);
                try {
                    await databases.updateStringAttribute(DATABASE_ID, ORDERS_COLLECTION_ID, attr.key, 10000, attr.required);
                    console.log("  -> Updated.");
                } catch (updErr) {
                    console.error("  -> Update failed:", updErr.message);
                }
            }
        } catch (e) {
            console.log("MISSING. Creating...");
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(DATABASE_ID, ORDERS_COLLECTION_ID, attr.key, attr.size, attr.required);
                } else if (attr.type === 'integer') {
                    await databases.createIntegerAttribute(DATABASE_ID, ORDERS_COLLECTION_ID, attr.key, attr.required);
                } else if (attr.type === 'double') {
                    await databases.createFloatAttribute(DATABASE_ID, ORDERS_COLLECTION_ID, attr.key, attr.required);
                }
                // Wait for it
                await sleep(1000);
            } catch (createErr) {
                console.error("  Error creating:", createErr.message);
            }
        }
    }

    // 2. Indexes
    console.log("\nChecking Indexes...");
    const indexes = [
        { key: 'idx_user_id', type: 'key', attributes: ['user_id'] },
        { key: 'idx_created_at', type: 'key', attributes: ['$createdAt'] } // often needed for sorting
    ];

    for (const idx of indexes) {
        process.stdout.write(`Checking index '${idx.key}'... `);
        try {
            // listIndexes to find it? Or just try create?
            // Try create, catch 409 (Conflict)
            await databases.createIndex(DATABASE_ID, ORDERS_COLLECTION_ID, idx.key, idx.type, idx.attributes);
            console.log("CREATED");
        } catch (e) {
            if (e.code === 409) {
                console.log("EXISTS");
            } else {
                console.log("Error:", e.message);
            }
        }
    }

    console.log("=== DONE ===");
}

fixSchema();
