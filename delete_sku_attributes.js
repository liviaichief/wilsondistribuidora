
import { Client, Databases } from 'node-appwrite';

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

async function nukeSkus() {
    console.log('--- Deleting SKU Attributes ---');

    // 1. Delete unique_product_sku index
    try {
        console.log('Deleting index unique_product_sku...');
        await databases.deleteIndex(DATABASE_ID, COLLECTION_ID, 'unique_product_sku');
        console.log('Index unique_product_sku deleted.');
    } catch (e) {
        console.log('Index unique_product_sku delete error:', e.message);
    }

    // 2. Delete product_sku
    try {
        console.log('Deleting attribute product_sku...');
        await databases.deleteAttribute(DATABASE_ID, COLLECTION_ID, 'product_sku');
        console.log('Attribute product_sku delete requested.');
    } catch (e) {
        console.log('Attribute product_sku delete error:', e.message);
    }

    // 3. Delete unique_sku index
    try {
        console.log('Deleting index unique_sku...');
        await databases.deleteIndex(DATABASE_ID, COLLECTION_ID, 'unique_sku');
        console.log('Index unique_sku deleted.');
    } catch (e) {
        console.log('Index unique_sku delete error:', e.message);
    }

    // 4. Delete sku
    try {
        console.log('Deleting attribute sku...');
        await databases.deleteAttribute(DATABASE_ID, COLLECTION_ID, 'sku');
        console.log('Attribute sku delete requested.');
    } catch (e) {
        console.log('Attribute sku delete error:', e.message);
    }

    console.log('--- Done (Deletions are async on Appwrite) ---');
}

nukeSkus();
