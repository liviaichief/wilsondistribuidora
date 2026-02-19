
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

async function backfillSkus() {
    console.log('Fetching all products...');

    try {
        let allDocuments = [];
        let offset = 0;
        const limit = 100;

        // Fetch all products (pagination loop)
        while (true) {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID,
                [
                    Query.limit(limit),
                    Query.offset(offset),
                    Query.orderAsc('$createdAt') // Order by creation to give older products lower SKUs
                ]
            );

            allDocuments.push(...response.documents);
            if (response.documents.length < limit) break;
            offset += limit;
        }

        console.log(`Found ${allDocuments.length} products to check.`);

        let currentSku = 1;

        for (const doc of allDocuments) {
            // Generate SKU
            const newSku = currentSku.toString().padStart(5, '0');

            // Update product
            // We overwrite even if exists to ensure sequence is clean? 
            // Or only if missing? User said "generate for existing", usually implies all or missing.
            // Let's overwrite to ensure a clean sequence 00001...N

            console.log(`Updating ${doc.title} (${doc.$id}) -> SKU: ${newSku}`);

            try {
                await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTION_ID,
                    doc.$id,
                    { sku: newSku }
                );
            } catch (err) {
                console.error(`Failed to update ${doc.title}:`, err.message);
            }

            currentSku++;
        }

        console.log('Backfill complete!');

    } catch (error) {
        console.error('Error during backfill:', error);
    }
}

backfillSkus();
