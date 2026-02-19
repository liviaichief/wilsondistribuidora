
import { Client, Databases, Storage, ID, Permission, Role } from 'node-appwrite';

const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '698e695d001d446b21d9';
const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';
const DATABASE_ID = 'boutique_carne_db';
const BUCKET_ID = 'profile_photos';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

async function setupProfiles() {
    try {
        console.log("Checking 'profiles' collection...");
        try {
            await databases.getCollection(DATABASE_ID, 'profiles');
            console.log("'profiles' collection exists.");
        } catch (e) {
            console.log("'profiles' collection missing. Creating...");
            await databases.createCollection(DATABASE_ID, 'profiles', 'User Profiles', [
                Permission.read(Role.any()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ]);
            console.log("Collection created.");

            // Create attributes
            console.log("Creating attributes...");
            await databases.createStringAttribute(DATABASE_ID, 'profiles', 'user_id', 255, true);
            await databases.createStringAttribute(DATABASE_ID, 'profiles', 'first_name', 100, false);
            await databases.createStringAttribute(DATABASE_ID, 'profiles', 'last_name', 100, false);
            await databases.createStringAttribute(DATABASE_ID, 'profiles', 'whatsapp', 50, false);
            await databases.createStringAttribute(DATABASE_ID, 'profiles', 'photo_url', 1000, false); // URL to storage
            console.log("Attributes creation requested.");
        }

        console.log("Checking storage bucket...");
        try {
            await storage.getBucket(BUCKET_ID);
            console.log(`Bucket '${BUCKET_ID}' exists.`);
        } catch (e) {
            console.log(`Bucket '${BUCKET_ID}' missing. Creating...`);
            await storage.createBucket(BUCKET_ID, 'Profile Photos', [
                Permission.read(Role.any()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ], false, true, null, ['jpg', 'png', 'jpeg', 'webp']);
            console.log("Bucket created.");
        }

    } catch (error) {
        console.error("Setup failed:", error.message);
    }
}

setupProfiles();
