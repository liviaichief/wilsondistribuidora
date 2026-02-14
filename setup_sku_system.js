
import { Client, Databases, Query, ID } from 'node-appwrite';

// Configuration
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
    console.log("=== SKU SETUP & BACKFILL (3RG-xxxxx) ===");

    // 1. Create Attribute if not exists
    console.log("Checking attribute 'product_sku'...");
    try {
        await databases.getAttribute(DATABASE_ID, COLLECTION_ID, 'product_sku');
        console.log("Attribute already exists.");
    } catch (e) {
        console.log("Attribute missing. Creating...");
        await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'product_sku', 20, false);

        // Wait for availability
        console.log("Waiting for attribute to be available...");
        for (let i = 0; i < 20; i++) {
            await sleep(2000);
            try {
                const attr = await databases.getAttribute(DATABASE_ID, COLLECTION_ID, 'product_sku');
                if (attr.status === 'available') break;
            } catch (e) { }
        }
    }

    // 2. Backfill Data
    console.log("Fetching all products...");
    let allDocuments = [];
    let offset = 0;
    while (true) {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [Query.limit(100), Query.offset(offset)]
        );
        allDocuments.push(...response.documents);
        if (response.documents.length < 100) break;
        offset += 100;
    }

    console.log(`Found ${allDocuments.length} products.`);

    // Sort by creation to have stable SKU assignment
    allDocuments.sort((a, b) => new Date(a.$createdAt) - new Date(b.$createdAt));

    let count = 100; // Start at 100 as requested (3RG-00100)
    for (const doc of allDocuments) {
        const skuNumber = count.toString().padStart(5, '0');
        const newSku = `3RG-${skuNumber}`;

        if (doc.product_sku === newSku) {
            console.log(`Skipping ${doc.title} - SKU already ${newSku}`);
            count++;
            continue;
        }

        console.log(`Updating ${doc.title} -> ${newSku}`);
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID,
            doc.$id,
            { product_sku: newSku }
        );
        count++;
    }

    // 3. Create Index
    console.log("Ensuring index on product_sku...");
    try {
        await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'unique_product_sku', 'unique', ['product_sku']);
        console.log("Index created/requested.");
    } catch (e) {
        console.log("Index info:", e.message);
    }

    console.log("=== DONE ===");
}

run();
