
import { Client, Databases } from 'node-appwrite';

// Configuration
// You can run this locally if you have .env populated or replace values here
const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '698e695d001d446b21d9';
const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';
const DATABASE_ID = 'boutique_carne_db';
const ORDERS_COLLECTION = 'orders';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function addStatusAttribute() {
    console.log(`Adding 'status' attribute to ${ORDERS_COLLECTION}...`);
    try {
        // Create 'status' attribute: string, size 50, not required, default 'pending'
        await databases.createStringAttribute(
            DATABASE_ID,
            ORDERS_COLLECTION,
            'status',
            50,
            false,
            'pending'
        );
        console.log("Attribute 'status' creation initiated. It may take a few seconds to be available.");
    } catch (error) {
        console.error("Error creating attribute:", error.message);
    }
}

addStatusAttribute();
