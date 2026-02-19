
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
    console.log("=== NEW ATTRIBUTE: product_sku ===");

    // 1. CREATE ATTRIBUTE
    console.log("Creating 'product_sku' attribute...");
    try {
        await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'product_sku', 50, false);
        console.log("Create requested.");
    } catch (e) {
        console.log("Create warning:", e.message);
    }

    // 2. POLLING FOR AVAILABILITY
    console.log("Waiting for attribute availability...");
    let available = false;
    for (let i = 0; i < 30; i++) { // Wait 150s max
        try {
            const attr = await databases.getAttribute(DATABASE_ID, COLLECTION_ID, 'product_sku');
            console.log(`Status: ${attr.status}`);
            if (attr.status === 'available') {
                available = true;
                break;
            }
        } catch (e) {
            console.log("Check error:", e.message);
        }
        await sleep(5000);
    }

    if (!available) {
        console.error("Attribute never became available. Exiting.");
        return;
    }

    // 3. BACKFILL
    console.log("Starting backfill...");
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

    console.log(`Found ${allDocuments.length} products to backfill.`);
    let currentSku = 1;

    for (const doc of allDocuments) {
        const newSku = currentSku.toString().padStart(5, '0');

        // Skip if already has correct format? No, enforce cleaner.
        if (doc.product_sku === newSku) {
            currentSku++;
            continue;
        }

        console.log(`Updating ${doc.title} -> ${newSku}`);
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID,
            doc.$id,
            { product_sku: newSku }
        );
        currentSku++;
    }

    console.log("Backfill done.");

    // 4. CREATE INDEX
    console.log("Creating unique index...");
    try {
        await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'unique_product_sku', 'unique', ['product_sku']);
        console.log("Index creation requested.");
    } catch (e) {
        console.log("Index error:", e.message);
    }
}

run();
