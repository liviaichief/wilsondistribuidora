const { Client, Databases } = require('node-appwrite');

const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '698e695d001d446b21d9';
const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';
const DATABASE_ID = 'boutique_carne_db';
const PROFILES_COL_ID = 'profiles';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function addAddressAttributes() {
    console.log("Adding address attributes to profiles...");
    const attributes = [
        { key: 'address_cep', size: 20 },
        { key: 'address_street', size: 255 },
        { key: 'address_neighborhood', size: 100 },
        { key: 'address_city', size: 100 },
        { key: 'address_state', size: 50 },
        { key: 'address_number', size: 20 },
        { key: 'address_complement', size: 255 }
    ];

    for (const attr of attributes) {
        try {
            console.log(`Creating attribute ${attr.key}...`);
            await databases.createStringAttribute(DATABASE_ID, PROFILES_COL_ID, attr.key, attr.size, false);
            console.log(`Requested creation of ${attr.key}`);
            await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            console.error(`Failed to create ${attr.key}:`, e.message);
        }
    }
    console.log("Done.");
}

addAddressAttributes();
