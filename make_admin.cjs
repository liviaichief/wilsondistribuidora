const { Client, Databases, Users } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const users = new Users(client);

async function checkAdminUser() {
    try {
        const email = 'marcos.gqrz@outlook.com';
        const userList = await users.list();
        const user = userList.users.find(u => u.email === email);
        if (!user) {
            console.log('User not found by email.');
            return;
        }

        console.log('User ID:', user.$id);
        console.log('User Name:', user.name);

        try {
            const profile = await databases.getDocument(
                process.env.DATABASE_ID,
                process.env.VITE_COLLECTION_PROFILES,
                user.$id
            );
            console.log('Profile Role is Currently:', profile.role);

            if (profile.role !== 'admin' && profile.role !== 'owner') {
                await databases.updateDocument(
                    process.env.DATABASE_ID,
                    process.env.VITE_COLLECTION_PROFILES,
                    user.$id,
                    { role: 'admin' }
                );
                console.log('Role updated to admin in profile!');
            } else {
                console.log('User already has an admin role.');
            }
        } catch (e) {
            if (e.code === 404) {
                console.log("Profile not found! Creating the profile as admin now...");
                await databases.createDocument(
                    process.env.DATABASE_ID,
                    process.env.VITE_COLLECTION_PROFILES,
                    user.$id,
                    {
                        email: user.email,
                        full_name: user.name || '',
                        first_name: (user.name || '').split(' ')[0] || '',
                        last_name: (user.name || '').split(' ').slice(1).join(' ') || '',
                        user_id: user.$id,
                        role: 'owner'
                    }
                );
                console.log('Profile created successfully with OWNER role!');
            } else {
                console.error('Error with profile:', e.message);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

checkAdminUser();
