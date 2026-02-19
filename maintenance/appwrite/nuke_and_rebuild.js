
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
    console.log("=== NUKE AND REBUILD SKU ===");

    // 1. DELETE INDEX
    try {
        console.log("Deleting index unique_sku...");
        await databases.deleteIndex(DATABASE_ID, COLLECTION_ID, 'unique_sku');
        console.log("Index delete requested.");
    } catch (e) {
        console.log("Index delete error (ignoring):", e.message);
    }

    await sleep(5000);

    // 2. DELETE ATTRIBUTE
    try {
        console.log("Deleting attribute sku...");
        await databases.deleteAttribute(DATABASE_ID, COLLECTION_ID, 'sku');
        console.log("Attribute delete requested.");
    } catch (e) {
        console.log("Attribute delete error (ignoring):", e.message);
    }

    // 3. POLLING FOR DELETION
    console.log("Waiting for attribute to disappear...");
    let deleted = false;
    for (let i = 0; i < 20; i++) { // Wait up to 100s
        try {
            const attr = await databases.getAttribute(DATABASE_ID, COLLECTION_ID, 'sku');
            console.log(`Status: ${attr.status}`);
            if (attr.status === 'stuck') { // If stuck, maybe we can't do anything?
                // But typically it eventually clears or goes away
            }
        } catch (e) {
            if (e.code === 404) {
                console.log("Attribute is GONE!");
                deleted = true;
                break;
            }
            console.log("Check error:", e.message);
        }
        await sleep(5000);
    }

    if (!deleted) {
        console.error("Failed to delete attribute. Exiting.");
        return;
    }

    // 4. CREATE ATTRIBUTE simple
    console.log("Creating simple 'sku' attribute...");
    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'sku', 50, false);

    // 5. POLLING FOR AVAILABILITY
    console.log("Waiting for attribute availability...");
    let available = false;
    for (let i = 0; i < 20; i++) {
        try {
            const attr = await databases.getAttribute(DATABASE_ID, COLLECTION_ID, 'sku');
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

    // 6. BACKFILL
    console.log("Starting backfill...");
    // ... (copy backfill logic) ...
    let allDocuments = []; // simplified fetch for brevity
    let offset = 0;
    while (true) {
        const r = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.limit(100), Query.offset(offset), Query.orderAsc('$createdAt')]);
        allDocuments.push(...r.documents);
        if (r.documents.length < 100) break;
        offset += 100;
    }

    let currentSku = 1;
    for (const doc of allDocuments) {
        const newSku = currentSku.toString().padStart(5, '0');
        if (doc.sku === newSku) { currentSku++; continue; }
        console.log(`Update ${doc.title} -> ${newSku}`);
        await databases.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, { sku: newSku });
        currentSku++;
    }

    console.log("Backfill done.");

    // 7. RECREATE INDEX
    console.log("Recreating Index...");
    try {
        await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'unique_sku', 'unique', ['sku']);
        console.log("Index creation requested.");
    } catch (e) {
        console.log("Index error:", e.message);
    }
}

run();
