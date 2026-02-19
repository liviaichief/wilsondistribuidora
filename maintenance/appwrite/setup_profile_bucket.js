
import { Client, Storage } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);

async function listBuckets() {
    try {
        console.log("Listing buckets...");
        const result = await storage.listBuckets();
        console.log("Total Buckets found:", result.total);
        result.buckets.forEach(b => {
            console.log(`- ID: ${b.$id}, Name: ${b.name}, Enabled: ${b.enabled}`);
            console.log(`  Permissions: ${JSON.stringify(b.$permissions)}`);
        });
    } catch (error) {
        console.error("Error listing buckets:", error);
    }
}

listBuckets();
