
import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_DATABASE_ID || 'boutique_carne_db';
const COLLECTION_ID = process.env.VITE_COLLECTION_PROFILES || 'profiles';

async function setupProfilesCollection() {
    try {
        console.log(`Checking if collection '${COLLECTION_ID}' exists in DB '${DATABASE_ID}'...`);
        try {
            await databases.getCollection(DATABASE_ID, COLLECTION_ID);
            console.log(`Collection '${COLLECTION_ID}' already exists.`);
        } catch (error) {
            console.log(`Collection '${COLLECTION_ID}' not found. Creating...`);
            await databases.createCollection(
                DATABASE_ID,
                COLLECTION_ID,
                COLLECTION_ID,
                [
                    Permission.read(Role.any()),              // Anyone can view profiles? Maybe restricted.
                    Permission.create(Role.users()),          // Logged in users can create their profile
                    Permission.update(Role.users()),          // Logged in users can update their profile
                    Permission.delete(Role.users()),           // Logged in users can delete their profile
                    Permission.read(Role.users())
                ]
            );
            console.log(`Collection '${COLLECTION_ID}' created.`);
        }

        console.log("Checking attributes...");
        const attributes = [
            { key: 'first_name', type: 'string', size: 100, required: true },
            { key: 'last_name', type: 'string', size: 100, required: false },
            { key: 'full_name', type: 'string', size: 200, required: false }, // Added full_name
            { key: 'whatsapp', type: 'string', size: 20, required: false },
            { key: 'photo_url', type: 'string', size: 2000, required: false },
            { key: 'user_id', type: 'string', size: 255, required: true },
            { key: 'email', type: 'string', size: 255, required: false }
        ];

        const existingAttributes = await databases.listAttributes(DATABASE_ID, COLLECTION_ID);
        const existingKeys = existingAttributes.attributes.map(a => a.key);

        for (const attr of attributes) {
            if (!existingKeys.includes(attr.key)) {
                console.log(`Creating attribute '${attr.key}'...`);
                await databases.createStringAttribute(
                    DATABASE_ID,
                    COLLECTION_ID,
                    attr.key,
                    attr.size,
                    attr.required
                );
                // Wait a bit for attribute to be created
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.log(`Attribute '${attr.key}' already exists.`);
            }
        }

        console.log("Profiles collection setup complete!");

    } catch (error) {
        console.error("Error setting up profiles collection:", error);
    }
}

setupProfilesCollection();
