
import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_DATABASE_ID || 'boutique_carne_db';
const COLLECTION_ID = process.env.VITE_COLLECTION_PROFILES || 'profiles';

async function removePhotoStructure() {
    try {
        console.log("Removing 'photo_url' attribute from profiles schema...");
        try {
            await databases.deleteAttribute(DATABASE_ID, COLLECTION_ID, 'photo_url');
            console.log("Attribute 'photo_url' deleted successfully.");
        } catch (error) {
            console.error("Error deleting attribute (it might not exist):", error.message);
        }
    } catch (error) {
        console.error("General Error:", error);
    }
}

removePhotoStructure();
