
import { Client, Databases, Permission, Role } from 'node-appwrite';

const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '698e695d001d446b21d9';
const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';
const DATABASE_ID = 'boutique_carne_db';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function setup() {
    try {
        console.log("1. Adding 'active' attribute to 'products'...");
        try {
            await databases.createBooleanAttribute(DATABASE_ID, 'products', 'active', false, true);
            console.log("'active' attribute created.");
        } catch (e) {
            console.log("'active' attribute might already exist or error:", e.message);
        }

        console.log("2. Creating 'settings' collection...");
        try {
            const settings = await databases.createCollection(
                DATABASE_ID,
                'settings',
                'Settings',
                [
                    Permission.read(Role.any()),
                    Permission.write(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            );
            console.log("'settings' collection created.");

            console.log("3. Adding attributes to 'settings'...");
            await databases.createStringAttribute(DATABASE_ID, 'settings', 'key', 100, true);
            await databases.createStringAttribute(DATABASE_ID, 'settings', 'value', 500, true);

            console.log("Waiting for attributes...");
            await new Promise(r => setTimeout(r, 5000));

            console.log("4. Initializing WhatsApp number setting...");
            await databases.createDocument(DATABASE_ID, 'settings', 'whatsapp_number', {
                key: 'whatsapp_number',
                value: '5511944835865' // Current default
            });
            console.log("WhatsApp number setting initialized.");
        } catch (e) {
            console.log("'settings' collection might already exist or error:", e.message);
        }

        console.log("Setup complete!");
    } catch (error) {
        console.error("Setup failed:", error);
    }
}

setup();
