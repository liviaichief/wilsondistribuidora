
import { Client, Databases, Users } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '698e695d001d446b21d9')
    .setKey('standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1');

const databases = new Databases(client);
const users = new Users(client);
const DATABASE_ID = 'boutique_carne_db';
const ORDERS_COLLECTION = 'orders';

async function debugProduction() {
    console.log('--- Debugging Production Enviroment ---');

    // 1. Check Orders Collection Security
    try {
        const col = await databases.getCollection(DATABASE_ID, ORDERS_COLLECTION);
        console.log(`\nCollection: ${col.name}`);
        console.log(`Document Security: ${col.documentSecurity}`);
        console.log(`Permissions: ${JSON.stringify(col.$permissions)}`);
    } catch (e) {
        console.error('Error getting collection:', e.message);
    }

    // 2. Check Users with 'admin' label
    try {
        console.log('\n--- Users with "admin" label ---');
        const userList = await users.list();
        const admins = userList.users.filter(u => u.labels && u.labels.includes('admin'));

        if (admins.length === 0) {
            console.log('WARNING: No users found with "admin" label!');
        } else {
            admins.forEach(u => console.log(`- ${u.name} (${u.email}) [${u.$id}]`));
        }

        console.log('\n--- All Users (First 10) ---');
        userList.users.slice(0, 10).forEach(u => {
            console.log(`- ${u.name} (${u.email}) Labels: [${u.labels.join(', ')}]`);
        });

    } catch (e) {
        console.error('Error listing users:', e.message);
    }

    // 3. Check a few orders permissions
    try {
        console.log('\n--- Checking Order Permissions (First 3) ---');
        const orders = await databases.listDocuments(DATABASE_ID, ORDERS_COLLECTION, []);

        if (orders.documents.length === 0) {
            console.log('No orders found.');
        } else {
            orders.documents.slice(0, 3).forEach(doc => {
                console.log(`Order ${doc.$id} Permissions:`, JSON.stringify(doc.$permissions));
            });
        }
    } catch (e) {
        console.error('Error listing orders:', e.message);
    }
}

debugProduction();
