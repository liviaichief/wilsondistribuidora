
import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '698e695d001d446b21d9')
    .setKey('standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1');

const databases = new Databases(client);
const DATABASE_ID = 'boutique_carne_db';
const PROFILES_COLLECTION = 'profiles';

async function addAttribute() {
    console.log('Checking attributes for profiles collection...');

    try {
        const attributes = await databases.listAttributes(DATABASE_ID, PROFILES_COLLECTION);
        const lastLoginExists = attributes.attributes.find(attr => attr.key === 'last_login');

        if (lastLoginExists) {
            console.log('Attribute "last_login" already exists.');
        } else {
            console.log('Creating "last_login" attribute (datetime)...');
            await databases.createDatetimeAttribute(DATABASE_ID, PROFILES_COLLECTION, 'last_login', false);
            console.log('Attribute created! It may take a few seconds to become available for queries.');

            // Wait a bit and create index? Usually good for sorting/filtering.
            console.log('Creating index for "last_login"...');
            // Key, Type (key), Attributes, Orders (desc)
            try {
                // key: idx_last_login
                await databases.createIndex(DATABASE_ID, PROFILES_COLLECTION, 'idx_last_login', 'key', ['last_login'], ['desc']);
                console.log('Index created.');
            } catch (err) {
                console.log('Index creation warning (might already exist or not ready):', err.message);
            }
        }

        const roleExists = attributes.attributes.find(attr => attr.key === 'role');
        if (!roleExists) {
            console.log('Creating "role" attribute (string) just in case...');
            await databases.createStringAttribute(DATABASE_ID, PROFILES_COLLECTION, 'role', 50, false, 'client');
            console.log('Attribute "role" created.');

            // Index for role
            try {
                await databases.createIndex(DATABASE_ID, PROFILES_COLLECTION, 'idx_role', 'key', ['role'], ['asc']);
                console.log('Index "idx_role" created.');
            } catch (err) {
                console.log('Index creation warning:', err.message);
            }
        } else {
            console.log('Attribute "role" already exists.');
        }

    } catch (error) {
        console.error('Error managing attributes:', error);
    }
}

addAttribute();
