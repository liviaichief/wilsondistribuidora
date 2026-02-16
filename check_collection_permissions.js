
import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '698e695d001d446b21d9')
    .setKey('standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1');

const databases = new Databases(client);
const DATABASE_ID = 'boutique_carne_db';

const COLLECTIONS = [
    'products',
    'banners',
    'orders',
    'profiles'
];

async function checkPermissions() {
    console.log('Checking Collection Permissions...');
    for (const colId of COLLECTIONS) {
        try {
            const col = await databases.getCollection(DATABASE_ID, colId);
            console.log(`\nCollection: ${col.name} (${col.$id})`);
            console.log('Permissions:', JSON.stringify(col.$permissions, null, 2));
        } catch (error) {
            console.error(`Error fetching collection ${colId}:`, error.message);
        }
    }
}

checkPermissions();
