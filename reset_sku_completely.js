
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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
    console.log("Starting SKU Reset & Backfill...");

    // 1. DELETE if exists
    try {
        console.log("Checking if 'sku' exists...");
        await databases.getAttribute(DATABASE_ID, COLLECTION_ID, 'sku');
        console.log("'sku' exists. Deleting...");

        try {
            await databases.deleteAttribute(DATABASE_ID, COLLECTION_ID, 'sku');
        } catch (e) {
            console.log("Delete error (ignoring):", e.message);
        }

        // Poll until gone
        process.stdout.write("Waiting for deletion");
        while (true) {
            try {
                await databases.getAttribute(DATABASE_ID, COLLECTION_ID, 'sku');
                process.stdout.write(".");
                await sleep(2000);
            } catch (e) {
                if (e.code === 404) {
                    console.log("\nDeleted confirmed.");
                    break;
                }
            }
        }
    } catch (e) {
        if (e.code === 404) {
            console.log("'sku' does not exist.");
        } else {
            console.log("Error checking attribute:", e.message);
        }
    }

    // 2. CREATE
    console.log("Creating 'sku' attribute...");
    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'sku', 50, false);

    // Poll until available
    process.stdout.write("Waiting for availability");
    while (true) {
        try {
            const attr = await databases.getAttribute(DATABASE_ID, COLLECTION_ID, 'sku');
            if (attr.status === 'available') {
                console.log("\nAttribute is available!");
                break;
            }
            process.stdout.write(".");
            await sleep(2000);
        } catch (e) {
            console.log("\nError polling availability:", e.message);
            await sleep(2000);
        }
    }

    // 3. BACKFILL
    console.log("Backfilling products...");
    let allDocuments = [];
    let offset = 0;
    while (true) {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [
                Query.limit(100),
                Query.offset(offset),
                Query.orderAsc('$createdAt')
            ]
        );
        allDocuments.push(...response.documents);
        if (response.documents.length < 100) break;
        offset += 100;
    }

    console.log(`Found ${allDocuments.length} products.`);
    let currentSku = 1;

    for (const doc of allDocuments) {
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

    // 4. INDEX (Optional, but good practice)
    console.log("Creating unique index...");
    try {
        await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'unique_sku', 'unique', ['sku']);
        console.log("Index creation started.");
    } catch (e) {
        console.log("Index creation error:", e.message);
    }

    console.log("Done!");
}

run();
