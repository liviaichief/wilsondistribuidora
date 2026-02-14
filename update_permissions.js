
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

async function updatePermissions() {
    console.log('Updating collection permissions...');

    const collections = [
        { id: 'products', name: 'Products', write: Role.users() }, // Allow logged in users to write
        { id: 'banners', name: 'Banners', write: Role.users() }   // Allow logged in users to write
    ];

    for (const col of collections) {
        try {
            console.log(`Updating ${col.name} (${col.id})...`);
            await databases.updateCollection(
                DATABASE_ID,
                col.id,
                col.name,
                [
                    Permission.read(Role.any()),
                    Permission.write(col.write),
                    Permission.update(col.write),
                    Permission.delete(col.write)
                ]
            );
            console.log(`Success: ${col.name}`);
        } catch (error) {
            console.error(`Error updating ${col.name}:`, error.message);
        }
    }
}

updatePermissions();
