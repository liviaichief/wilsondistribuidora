require('dotenv').config();
const { Client, Databases, Users } = require('node-appwrite');

async function checkSync() {
    const client = new Client()
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const users = new Users(client);

    try {
        const authUsers = await users.list();
        const profilesList = await databases.listDocuments(
            process.env.DATABASE_ID,
            'profiles'
        );

        const profileUserIds = profilesList.documents.map(p => p.user_id || p.$id); // depending on how user_id is saved

        const missingProfiles = authUsers.users.filter(u => !profileUserIds.includes(u.$id));

        console.log(`\nFound ${missingProfiles.length} users in Authentication without a matching Profile in the Database:`);
        missingProfiles.forEach(u => console.log(`- ${u.name || u.email || 'Unknown'} (${u.$id})`));

    } catch (e) {
        console.error("Error:", e);
    }
}

checkSync();
