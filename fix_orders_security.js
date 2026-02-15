
import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

// Using the same API Key found in other maintenance scripts
const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '698e695d001d446b21d9')
    .setKey(API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_DATABASE_ID || 'boutique_carne_db';
const ORDERS_COLLECTION_ID = process.env.VITE_COLLECTION_ORDERS || 'orders';

async function fixOrdersSecurity() {
    console.log('=== FIXING ORDERS COLLECTION SECURITY ===');
    console.log(`Target: DB=${DATABASE_ID}, COL=${ORDERS_COLLECTION_ID}`);

    try {
        const ordersCol = await databases.getCollection(DATABASE_ID, ORDERS_COLLECTION_ID);
        console.log(`Current Document Security: ${ordersCol.documentSecurity}`);

        // Update Permissions
        // 1. Enable Document Security (Crucial for "My Orders")
        // 2. Allow "users" to CREATE (so they can place orders)
        // 3. Allow "admins" to manage everything
        // 4. Do NOT allow "users" to read/update/delete at collection level (privacy)

        const newPermissions = [
            Permission.create(Role.users()),      // Auth users can create
            Permission.create(Role.guests()),     // Guest users can create
            Permission.read(Role.users()),        // [FIX] Users need collection read access to list their own docs
            Permission.read(Role.team('admins')), // Admins see all
            Permission.update(Role.team('admins')),
            Permission.delete(Role.team('admins')),
            Permission.read(Role.label('admin')), // Backup for label-based admin
            Permission.update(Role.label('admin')),
            Permission.delete(Role.label('admin'))
        ];

        console.log("Updating collection...");

        await databases.updateCollection(
            DATABASE_ID,
            ORDERS_COLLECTION_ID,
            ordersCol.name,
            newPermissions,
            true // documentSecurity = TRUE
        );

        console.log("SUCCESS: Document Security Enabled and Permissions Updated.");
        console.log("New Permissions:", newPermissions);

    } catch (e) {
        console.error("ERROR:", e.message);
    }
}

fixOrdersSecurity();
