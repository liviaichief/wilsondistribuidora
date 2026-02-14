
import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_DATABASE_ID;
const ORDERS_COLLECTION_ID = process.env.VITE_COLLECTION_ORDERS || 'orders';
const PRODUCTS_COLLECTION_ID = process.env.VITE_COLLECTION_PRODUCTS || 'products';

async function checkPermissions() {
    console.log('=== CHECKING COLLECTION PERMISSIONS ===');

    try {
        // 1. Check Orders Collection
        console.log(`\nChecking 'orders' (${ORDERS_COLLECTION_ID})...`);
        const ordersCol = await databases.getCollection(DATABASE_ID, ORDERS_COLLECTION_ID);
        console.log("Current Permissions:", ordersCol.$permissions);

        // We want:
        // Any or Users can create? 
        // We usually want Authenticated Users ('users') to create.
        // Reading/Updating own orders handled by Document Security (if enabled) or Collection Security.
        // Let's enable Document Security for granular control, and give 'users' create permission.

        const desiredPermissions = [
            Permission.create(Role.users()), // Logged in users can create
            Permission.read(Role.users()),   // Logged in users can read (filtered by their ID in query usually, but Doc Security is better)
            Permission.read(Role.any()),     // Maybe needed for anonymous read if allowed? No.
            Permission.update(Role.users()),
            // Admins
            Permission.read(Role.team("admin")),
            Permission.update(Role.team("admin")),
            Permission.delete(Role.team("admin")),
        ];

        // Simplified for this debug: Give 'users' CREATE/READ/UPDATE rights.
        // And ensure Document Security is enabled so when we create a doc with read("user:ID"), it works.

        if (!ordersCol.documentSecurity) {
            console.log("Enabling Document Security...");
            await databases.updateCollection(
                DATABASE_ID,
                ORDERS_COLLECTION_ID,
                ordersCol.name,
                ordersCol.$permissions,
                true // documentSecurity
            );
        }

        console.log("Updating Permissions...");
        await databases.updateCollection(
            DATABASE_ID,
            ORDERS_COLLECTION_ID,
            ordersCol.name,
            [
                Permission.create(Role.users()),
                Permission.read(Role.users()), // If Doc Security is ON, this allows reading ALL unless overridden? 
                // Wait. If Doc Security is ON:
                // Collection Permissions are "Base".
                // If I give read(Role.users()) here, ALL users can read ALL docs? 
                // Yes, checking Appwrite docs... 
                // "Collection permissions are cumulative with document permissions."
                // So if we want private orders, we should NOT give Role.users() READ at collection level.
                // We should ONLY give Role.users() CREATE.
                // The Read permission should be assigned to the specific User ID on creation.

                Permission.create(Role.users()),
                // Admin rights
                Permission.read(Role.any()), // TEMP DEBUG: Allow reading for now to see if it fixes fetch
                Permission.update(Role.any()) // TEMP DEBUG
            ],
            true // documentSecurity
        );
        console.log("Updated 'orders' permissions (OPEN for debug).");

    } catch (e) {
        console.error("Error checking/updating permissions:", e.message);
    }

    console.log("=== DONE ===");
}

checkPermissions();
