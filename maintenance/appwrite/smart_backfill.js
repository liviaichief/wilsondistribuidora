
import { Client, Databases, Query } from 'node-appwrite';

const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '698e695d001d446b21d9';
const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';
const DATABASE_ID = 'boutique_carne_db';
const COLLECTION_ID = 'products';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function checkAndBackfill() {
    console.log('Checking SKU attribute status...');
    try {
        const attr = await databases.getAttribute(DATABASE_ID, COLLECTION_ID, 'sku');
        console.log('Attribute Status:', attr.status); // available, processing, deleting, strauck

        if (attr.status !== 'available') {
            console.log('Attribute is not available yet. Waiting...');
            return;
        }

        console.log('Attribute is ready! Starting backfill...');

        let allDocuments = [];
        let offset = 0;
        const limit = 100;

        while (true) {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID,
                [
                    Query.limit(limit),
                    Query.offset(offset),
                    Query.orderAsc('$createdAt')
                ]
            );
            allDocuments.push(...response.documents);
            if (response.documents.length < limit) break;
            offset += limit;
        }

        console.log(`Found ${allDocuments.length} products.`);
        let currentSku = 1;

        for (const doc of allDocuments) {
            if (doc.sku) {
                console.log(`Product ${doc.title} already has SKU: ${doc.sku}. Skipping or re-numbering?`);
                // If we want purely sequential, we might want to renumber or skip.
                // User said "generate for existing", implying those without.
                // But to align with "00001", "00002", better to re-do all if the first few are mess.
                // Let's increment currentSku to be safe.

                // check if existing sku is a number
                if (!isNaN(parseInt(doc.sku))) {
                    if (parseInt(doc.sku) >= currentSku) {
                        currentSku = parseInt(doc.sku) + 1;
                    }
                }
                continue;
            }

            const newSku = currentSku.toString().padStart(5, '0');
            console.log(`Updating ${doc.title} -> ${newSku}`);

            await databases.updateDocument(
                DATABASE_ID,
                COLLECTION_ID,
                doc.$id,
                { sku: newSku }
            );
            currentSku++;
        }
        console.log('Done.');

    } catch (error) {
        console.log('Error checking attribute:', error.message);
        if (error.code === 404) {
            console.log('Attribute missing. Recreating...');
            await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'sku', 50, false);
        }
    }
}

checkAndBackfill();
