
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

async function checkIndexes() {
    console.log("Checking indexes...");

    const collections = ['products', 'orders'];

    for (const colId of collections) {
        try {
            const response = await databases.listIndexes(DATABASE_ID, colId);
            console.log(`\nCollection: ${colId}`);
            if (response.indexes.length === 0) {
                console.log("  ⚠️ NO INDEXES FOUND!");
            } else {
                response.indexes.forEach(idx => {
                    console.log(`  - Key: ${idx.key}, Type: ${idx.type}, Status: ${idx.status}`);
                });
            }
        } catch (error) {
            console.error(`  Error checking ${colId}:`, error.message);
        }
    }
}

checkIndexes();
