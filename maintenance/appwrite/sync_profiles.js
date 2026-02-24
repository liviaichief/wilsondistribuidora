import { Client, Databases, Users, Query, ID, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '698e695d001d446b21d9')
    .setKey(process.env.APPWRITE_API_KEY || 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1');

const databases = new Databases(client);
const usersAPI = new Users(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'boutique_carne_db';
const PROFILES_COLLECTION = process.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || 'profiles';

async function syncProfiles() {
    console.log('Starting sync for all users...');
    try {
        let allUsers = [];
        let page = await usersAPI.list([Query.limit(100)]);
        allUsers.push(...page.users);

        // Handle pagination if more than 100 users
        while (page.users.length === 100) {
            const lastId = page.users[page.users.length - 1].$id;
            page = await usersAPI.list([Query.limit(100), Query.cursorAfter(lastId)]);
            allUsers.push(...page.users);
        }

        console.log(`Found ${allUsers.length} users in Auth system.`);

        for (const user of allUsers) {
            console.log(`Processing user: ${user.email} (${user.$id})`);

            const profileData = {
                email: user.email,
                full_name: user.name || '',
                first_name: (user.name || '').split(' ')[0] || '',
                last_name: (user.name || '').split(' ').slice(1).join(' ') || '',
                user_id: user.$id,
            };

            // Set last_login based on accessedAt
            if (user.accessedAt) {
                profileData.last_login = user.accessedAt;
            } else if (user.$createdAt) {
                profileData.last_login = user.$createdAt;
            }

            try {
                // Check if profile exists
                const profile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, user.$id);
                console.log(`Profile exists for ${user.email}. Updating...`);

                // Update profile
                const updateData = {};
                // Only update last_login if it's missing or if accessedAt is newer than the stored last_login
                const existingLastLogin = profile.last_login ? new Date(profile.last_login).getTime() : 0;
                const newLastLogin = profileData.last_login ? new Date(profileData.last_login).getTime() : 0;

                if (newLastLogin > existingLastLogin) {
                    updateData.last_login = profileData.last_login;
                }

                // Update names if they were empty in profile
                if (!profile.full_name && profileData.full_name) updateData.full_name = profileData.full_name;
                if (!profile.first_name && profileData.first_name) updateData.first_name = profileData.first_name;

                if (Object.keys(updateData).length > 0) {
                    await databases.updateDocument(DATABASE_ID, PROFILES_COLLECTION, user.$id, updateData);
                    console.log(`Updated profile for ${user.email} with data:`, updateData);
                } else {
                    console.log(`No updates needed for ${user.email}.`);
                }

            } catch (err) {
                if (err.code === 404) {
                    console.log(`Profile not found for ${user.email}. Creating...`);
                    profileData.role = user.email.startsWith('admin') ? 'admin' : 'client'; // default role
                    try {
                        await databases.createDocument(
                            DATABASE_ID,
                            PROFILES_COLLECTION,
                            user.$id,
                            profileData,
                            [
                                Permission.read(Role.user(user.$id)),
                                Permission.update(Role.user(user.$id)),
                                Permission.read(Role.label('admin')),
                                Permission.update(Role.label('admin'))
                            ]
                        );
                        console.log(`Profile created for ${user.email}.`);
                    } catch (createErr) {
                        console.error(`Error creating profile for ${user.email}:`, createErr.message);
                    }
                } else {
                    console.error(`Error fetching profile for ${user.email}:`, err.message);
                }
            }
        }

        console.log('Sync process completed successfully!');
    } catch (error) {
        console.error('Error in sync process:', error);
    }
}

syncProfiles();
