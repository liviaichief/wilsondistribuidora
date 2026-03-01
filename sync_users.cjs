require('dotenv').config();
const { Client, Databases, Users } = require('node-appwrite');

async function syncUsers() {
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

        const profileIds = profilesList.documents.map(p => p.$id);

        const missingProfiles = authUsers.users.filter(u => !profileIds.includes(u.$id));

        console.log(`\nFound ${missingProfiles.length} users in Authentication without a matching Profile.`);

        for (const u of missingProfiles) {
            console.log(`Creating profile for ${u.name || u.email || 'Unknown'} (${u.$id})...`);
            try {
                // If it is test user, skip it if not valid Appwrite ID length, but Appwrite auth ID length is usually max 36 chars.
                // It's safer to just attempt it. The ID must be valid.
                await databases.createDocument(
                    process.env.DATABASE_ID,
                    'profiles', // assuming profiles is the collection ID
                    u.$id,
                    {
                        email: u.email || '',
                        full_name: u.name || '',
                        first_name: (u.name || '').split(' ')[0] || '',
                        last_name: (u.name || '').split(' ').slice(1).join(' ') || '',
                        whatsapp: u.phone || '',
                        user_id: u.$id,
                        role: 'client', // Default role
                        birthday: null
                    }
                );
                console.log(`✅ Success for ${u.$id}`);
            } catch (err) {
                console.error(`❌ Failed for ${u.$id}: ${err.message}`);
            }
        }

        console.log("\nSync process completed.");

    } catch (e) {
        console.error("Error:", e);
    }
}

syncUsers();
