
import { Client, Databases, ID } from 'node-appwrite';

// Configuration (Must match what is in src/lib/appwrite.js and create_appwrite_schema.js)
const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '698e695d001d446b21d9';
const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';
const DATABASE_ID = 'boutique_carne_db';
const PROFILES_COLLECTION_Id = 'profiles';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

const initialUsers = [
    {
        email: 'admin@local.com',
        full_name: 'Administrador Principal',
        phone: '(11) 99999-0000',
        role: 'admin'
    },
    {
        email: 'cliente@local.com',
        full_name: 'Cliente Exemplo',
        phone: '(11) 98888-1111',
        role: 'client'
    },
    {
        email: 'dono@local.com',
        full_name: 'Dono da Loja',
        phone: '(11) 97777-2222',
        role: 'owner'
    }
];

async function seedUsers() {
    console.log('Seeding Users (Profiles)...');

    for (const user of initialUsers) {
        try {
            // Check if exists check would be complex without listing, so we just try create
            // Use email as a deterministic ID seed or just random? 
            // Better to use random ID for document, but we can query by email later.
            // For seeding, let's create new documents.

            await databases.createDocument(
                DATABASE_ID,
                PROFILES_COLLECTION_Id,
                ID.unique(),
                user
            );
            console.log(`Created profile for: ${user.email} (${user.role})`);
        } catch (error) {
            console.log(`Failed to create ${user.email}:`, error.message);
        }
    }
    console.log('Seeding complete.');
}

seedUsers();
