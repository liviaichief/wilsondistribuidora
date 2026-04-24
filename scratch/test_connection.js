
import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_DATABASE_ID;

console.log('--- Database Integration Test ---');
console.log('Endpoint:', ENDPOINT);
console.log('Project ID:', PROJECT_ID);
console.log('Database ID:', DATABASE_ID);

if (!API_KEY) {
    console.error('Error: APPWRITE_API_KEY is not defined in .env');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function testConnection() {
    try {
        console.log('\nTesting connection to Appwrite...');
        const db = await databases.get(DATABASE_ID);
        console.log('✅ Success: Connected to database:', db.name);
        
        console.log('\nFetching collections...');
        const collections = await databases.listCollections(DATABASE_ID);
        console.log('✅ Success: Found', collections.total, 'collections:');
        collections.collections.forEach(col => {
            console.log(` - ${col.name} (${col.$id})`);
        });

        console.log('\nChecking "products" collection content...');
        const products = await databases.listDocuments(DATABASE_ID, 'products');
        console.log('✅ Success: Found', products.total, 'products in "products" collection.');
        if (products.total > 0) {
            console.log('Sample product:', products.documents[0].title);
        }

    } catch (error) {
        console.error('❌ Error connecting to database:', error.message);
        if (error.code) console.error('Error Code:', error.code);
    }
}

testConnection();
