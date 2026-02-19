
import { Client, Databases } from 'node-appwrite';

const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '698e695d001d446b21d9';
const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';
const DATABASE_ID = 'boutique_carne_db';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function cycleSkuAttribute() {
    console.log('Deleting SKU attribute...');
    try {
        await databases.deleteAttribute(DATABASE_ID, 'products', 'sku');
        console.log('Deleted. Waiting 5s...');
        await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
        console.log('Delete error (okay if missing):', e.message);
    }

    console.log('Re-creating SKU attribute...');
    try {
        await databases.deleteIndex(DATABASE_ID, 'products', 'unique_sku');
    } catch (e) { }

    try {
        await databases.createStringAttribute(DATABASE_ID, 'products', 'sku', 50, false);
        console.log('Created. Waiting 10s...');
        await new Promise(r => setTimeout(r, 10000)); // Wait longer

        // Retry Backfill logic here too? No, separate script.
    } catch (error) {
        console.log('Create error:', error.message);
    }
}

cycleSkuAttribute();
