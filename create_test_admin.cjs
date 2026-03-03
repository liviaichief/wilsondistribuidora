const { Client, Users, Databases, ID } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);
const databases = new Databases(client);

async function createTestAdmin() {
    try {
        const email = 'testadmin@exemplo.com';
        const password = 'Password123!';

        let user;
        try {
            const list = await users.list();
            user = list.users.find(u => u.email === email);
            if (!user) {
                user = await users.create(ID.unique(), email, null, password, 'Tester Admin');
                console.log('Test user created:', user.$id);
            } else {
                console.log('Test user already exists:', user.$id);
                try {
                    await users.updatePassword(user.$id, password);
                } catch (e) { }
            }
        } catch (e) {
            console.error('Error finding/creating user:', e.message);
            return;
        }

        let labels = user.labels || [];
        if (!labels.includes('admin')) {
            labels.push('admin');
            await users.updateLabels(user.$id, labels);
            console.log('Added admin label.');
        }

        const profileId = user.$id;
        const dbId = process.env.VITE_DATABASE_ID || 'boutique_carne_db';
        try {
            await databases.getDocument(dbId, 'profiles', profileId);
            console.log('Profile exists.');
            await databases.updateDocument(dbId, 'profiles', profileId, { role: 'owner', full_name: 'Tester Admin' });
        } catch (e) {
            if (e.code === 404) {
                try {
                    await databases.createDocument(dbId, 'profiles', profileId, {
                        user_id: user.$id,
                        first_name: 'Tester',
                        last_name: 'Admin',
                        full_name: 'Tester Admin',
                        email: email,
                        role: 'owner'
                    });
                    console.log('Created profile document.');
                } catch (ce) {
                    console.log('Error creating profile document:', ce.message);
                }
            } else {
                console.error('Error fetching profile:', e.message);
            }
        }

        console.log('Test admin ready. Email:', email, 'Password:', password);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

createTestAdmin();
