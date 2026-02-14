
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

async function addSkuAttribute() {
    console.log('Adding SKU attribute to products...');
    try {
        // Create string attribute: collectionId, key, size, required, default
        // required=false to allow existing products to typically not break, but user wants SKUs.
        // We often set required=false first, backfill, then true. Or just false and enforce in UI.
        await databases.createStringAttribute(DATABASE_ID, 'products', 'sku', 50, false);
        console.log('Attribute SKU created.');

        // Wait for attribute to be available
        await new Promise(r => setTimeout(r, 2000));

        // Create Unique Index
        console.log('Creating unique index for SKU...');
        await databases.createIndex(DATABASE_ID, 'products', 'unique_sku', 'unique', ['sku']);
        console.log('Index created.');

    } catch (error) {
        console.log('Error (might already exist):', error.message);
    }
}

addSkuAttribute();
