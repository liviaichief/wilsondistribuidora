
import { Client, Databases } from 'appwrite';

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27');

const databases = new Databases(client);
const DATABASE_ID = 'main_db';

async function checkSettingsSchema() {
    try {
        console.log("Fetching settings document to see existing attributes...");
        const settings = await databases.listDocuments(DATABASE_ID, 'settings', []);
        if (settings.total > 0) {
            console.log("Current attributes:", Object.keys(settings.documents[0]));
        } else {
            console.log("No settings document found.");
        }
    } catch (error) {
        console.error("Error checking settings schema:", error);
    }
}

checkSettingsSchema();
