
import { Client, Databases, Permission, Role, ID } from 'node-appwrite';

// Configuration
const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1'; // Change if self-hosted
const PROJECT_ID = '698e695d001d446b21d9';
const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1'; // Needs scope: collections.write, attributes.write, databases.write
const DATABASE_ID = 'boutique_carne_db';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function setupSchema() {
    try {
        // 1. Create Database
        console.log(`Creating database ${DATABASE_ID}...`);
        try {
            await databases.create(DATABASE_ID, 'Boutique Carne DB');
            console.log('Database created.');
        } catch (error) {
            console.log('Database might already exist or error:', error.message);
        }

        // 2. Create Products Collection
        await createCollection('products', 'Products', [
            Permission.read(Role.any()),
            Permission.write(Role.team('admins')) // Adjust team ID as needed
        ]);
        await createAttribute('products', 'string', 'title', 255, true);
        await createAttribute('products', 'string', 'description', 5000, false);
        await createAttribute('products', 'double', 'price', null, true);
        await createAttribute('products', 'string', 'category', 50, true);
        await createAttribute('products', 'url', 'image', null, false);
        // banners relationship will be added after banners collection

        // 3. Create Orders Collection
        await createCollection('orders', 'Orders', [
            Permission.create(Role.any()), // Public checkout
            Permission.read(Role.team('admins')),
            Permission.update(Role.team('admins')),
            Permission.delete(Role.team('admins'))
        ]);
        await createAttribute('orders', 'string', 'customer_name', 255, true);
        await createAttribute('orders', 'string', 'customer_phone', 50, true);
        await createAttribute('orders', 'string', 'payment_method', 50, true);
        await createAttribute('orders', 'double', 'total', null, true);
        await createAttribute('orders', 'string', 'items', 10000, true); // JSON string
        await createAttribute('orders', 'string', 'user_id', 255, false); // Store User ID manually if not using relationship
        await createAttribute('orders', 'string', 'status', 50, false, 'confirmed'); // Added status

        // 4. Create Banners Collection
        await createCollection('banners', 'Banners', [
            Permission.read(Role.any()),
            Permission.write(Role.team('admins'))
        ]);
        await createAttribute('banners', 'string', 'title', 255, true);
        await createAttribute('banners', 'url', 'image_url', null, true);
        await createAttribute('banners', 'string', 'link', 1024, false);
        await createAttribute('banners', 'boolean', 'active', null, false, true);
        await createAttribute('banners', 'integer', 'display_order', null, false, 0);
        await createAttribute('banners', 'integer', 'duration', null, false, 5);

        // 4.5 Create Profiles Collection (Simulating User DB)
        // This is crucial for "User Management" from frontend
        await createCollection('profiles', 'Profiles', [
            Permission.read(Role.any()), // Public profiles? Or Role.user()? keeping open for admin ease for now
            Permission.create(Role.any()), // Allow users to create their profile
            Permission.update(Role.team('admins')), // Only admins can update other profiles (or user themselves - simpler for admin panel focus)
            Permission.update(Role.user(ID.custom('owner'))), // Placeholder for self-update logic if needed
            Permission.delete(Role.team('admins'))
        ]);
        await createAttribute('profiles', 'string', 'full_name', 255, true);
        await createAttribute('profiles', 'email', 'email', 255, true);
        await createAttribute('profiles', 'string', 'role', 50, false, 'client'); // client, admin
        await createAttribute('profiles', 'string', 'phone', 50, false);

        // 5. Create Relationships
        // Banner -> Product (Many to One)
        // Note: Appwrite creates the attribute on the "Two Way" side automatically or just one way key
        console.log('Creating Relationship: Banners -> Products');
        try {
            await databases.createRelationshipAttribute(
                DATABASE_ID,
                'banners',
                'products',
                'manyToOne',
                true, // TwoWay
                'product', // Key in Banners
                'banners', // Key in Products
                'setNull' // On Delete
            );
            console.log('Relationship created.');
        } catch (e) {
            console.log('Relationship error (might exist):', e.message);
        }

        console.log('Schema setup complete!');

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

async function createCollection(id, name, permissions) {
    console.log(`Creating collection ${id}...`);
    try {
        await databases.createCollection(DATABASE_ID, id, name, permissions);
        console.log(`Collection ${id} created.`);
    } catch (error) {
        console.log(`Collection ${id} might already exist or error:`, error.message);
    }
}

async function createAttribute(collectionId, type, key, size, required, defaultValue) {
    console.log(`Creating attribute ${key} in ${collectionId}...`);
    try {
        if (type === 'string') {
            await databases.createStringAttribute(DATABASE_ID, collectionId, key, size, required, defaultValue);
        } else if (type === 'integer') {
            await databases.createIntegerAttribute(DATABASE_ID, collectionId, key, required, null, null, defaultValue);
        } else if (type === 'double') {
            await databases.createFloatAttribute(DATABASE_ID, collectionId, key, required, null, null, defaultValue);
        } else if (type === 'boolean') {
            await databases.createBooleanAttribute(DATABASE_ID, collectionId, key, required, defaultValue);
        } else if (type === 'url') {
            await databases.createUrlAttribute(DATABASE_ID, collectionId, key, required, defaultValue);
        } else if (type === 'email') {
            await databases.createEmailAttribute(DATABASE_ID, collectionId, key, required, defaultValue);
        }
        // Wait a bit because attribute creation is async in Appwrite backend
        await new Promise(r => setTimeout(r, 500));
    } catch (error) {
        console.log(`Attribute ${key} error (might exist):`, error.message);
    }
}

setupSchema();
