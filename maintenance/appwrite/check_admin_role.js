
import { Client, Databases, Query } from 'node-appwrite';

const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '698e695d001d446b21d9';
const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';
const DATABASE_ID = 'boutique_carne_db';
const COLLECTIONS = { PROFILES: 'profiles' };

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function checkAdmin() {
    console.log('Checking admin profile...');
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PROFILES,
            [Query.equal('email', 'admin@local.com')]
        );

        if (response.documents.length > 0) {
            console.log('Admin Profile Found:', response.documents[0]);
        } else {
            console.log('No profile found for admin@local.com');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

checkAdmin();
