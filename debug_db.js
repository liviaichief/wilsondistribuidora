
import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('698e695d001d446b21d9')
    .setKey('standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6ace848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1');

const databases = new Databases(client);
const DATABASE_ID = 'boutique_carne_db';
const COLLECTION_ID = 'products';

async function debugProducts() {
    try {
        const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
        console.log("TOTAL PRODUCTS IN DB:", response.total);
        console.log("--- SAMPLE PRODUCTS (First 5) ---");
        response.documents.slice(0, 5).forEach(doc => {
            console.log(`Title: ${doc.title} | Category: "${doc.category}" | Active: ${doc.active} | Promo: ${doc.is_promotion}`);
        });

        // Test the current logic queries
        // Scenario 1: category='carne'
        const carneTest = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
            // Query.equal('category', 'carne'), // Query is imported in node-appwrite differently
        ]);
        // Actually, let's just inspect categories present
        const cats = [...new Set(response.documents.map(d => d.category))];
        console.log("CATEGORIES FOUND IN DB:", cats);

    } catch (e) {
        console.error("DEBUG ERROR:", e.message);
    }
}

debugProducts();
