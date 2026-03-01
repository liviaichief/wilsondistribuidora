const { Client, Databases, Users } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const users = new Users(client);

async function syncAdminLabels() {
    try {
        console.log("Fetching profiles...");
        // Get all profiles that are 'admin' or 'owner' (we'll fetch all and filter for safety)
        const response = await databases.listDocuments(
            process.env.DATABASE_ID,
            process.env.VITE_COLLECTION_PROFILES || 'profiles'
        );

        const admins = response.documents.filter(d => d.role === 'admin' || d.role === 'owner');
        console.log(`Found ${admins.length} admins in profiles.`);

        for (const admin of admins) {
            try {
                const userId = admin.user_id;
                console.log(`Checking user: ${userId}`);
                const user = await users.get(userId);
                let labels = user.labels || [];

                if (!labels.includes('admin')) {
                    console.log(`Adding 'admin' label to user ${userId}`);
                    labels.push('admin');
                    await users.updateLabels(userId, labels);
                    console.log(`Successfully added 'admin' label to user ${user.name}`);
                } else {
                    console.log(`User ${user.name} already has 'admin' label.`);
                }
            } catch (e) {
                console.error(`Error processing admin ${admin.user_id}:`, e.message);
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

syncAdminLabels();
