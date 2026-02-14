
import { Client, Databases, Query } from 'node-appwrite';

const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '698e695d001d446b21d9';
const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';
const DATABASE_ID = 'boutique_carne_db';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function testQueries() {
    console.log("Testing Queries...");

    // Test 1: Frontend default load (Just Order DESC)
    try {
        console.log("\n1. Testing Default Query (Limit 100, OrderDesc $createdAt)...");
        const queries = [
            Query.limit(100),
            Query.orderDesc('$createdAt')
        ];
        const res = await databases.listDocuments(DATABASE_ID, 'products', queries);
        console.log(`Success! Found ${res.documents.length} existing products.`);
    } catch (error) {
        console.error("Test 1 Failed:", error.message);
    }

    // Test 2: Filter by Category (Category + Order)
    try {
        console.log("\n2. Testing Category Query (Category=carne, Limit 100, OrderDesc $createdAt)...");
        const queries = [
            Query.equal('category', 'carne'),
            Query.limit(100),
            Query.orderDesc('$createdAt')
        ];
        const res = await databases.listDocuments(DATABASE_ID, 'products', queries);
        console.log(`Success! Found ${res.documents.length} meat products.`);
    } catch (error) {
        console.error("Test 2 Failed:", error.message);
    }
}

testQueries();
