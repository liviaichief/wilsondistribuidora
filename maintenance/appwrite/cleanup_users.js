
import { Client, Users, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);
const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_DATABASE_ID || 'boutique_carne_db';
const PROFILES_COLLECTION = process.env.VITE_COLLECTION_PROFILES || 'profiles';

async function cleanupUsers() {
    try {
        console.log("Fetching profiles from database...");
        let allProfiles = [];
        let offset = 0;
        let limit = 100;

        // Fetch all profiles (handle pagination if > 100, though unlikely for now)
        while (true) {
            const result = await databases.listDocuments(
                DATABASE_ID,
                PROFILES_COLLECTION,
                [Query.limit(limit), Query.offset(offset)]
            );
            allProfiles = [...allProfiles, ...result.documents];
            if (result.documents.length < limit) break;
            offset += limit;
        }

        const validUserIds = new Set(allProfiles.map(p => p.user_id)); // Using user_id attribute we fixed earlier
        // Also add document IDs just in case they differ but are valid
        allProfiles.forEach(p => validUserIds.add(p.$id));

        console.log(`Found ${allProfiles.length} profiles in database.`);

        console.log("Fetching Auth Users...");
        const { users: authUsers } = await users.list([Query.limit(100)]);

        console.log(`Found ${authUsers.length} users in Auth.`);

        let deletedCount = 0;

        for (const user of authUsers) {
            // Check if user is in profiles
            if (!validUserIds.has(user.$id)) {
                // Double check: Is it the semantic admin?
                if (user.email === 'admin@boutiquecarne.com') {
                    console.log(`⚠️ Admin user ${user.email} (${user.$id}) has NO PROFILE! Saving it from deletion...`);
                    // Optionally create profile here? 
                    continue;
                }

                console.log(`🗑️ Deleting User ${user.email} (${user.$id}) - No matching profile found.`);
                await users.delete(user.$id);
                deletedCount++;
            } else {
                console.log(`✅ Keeping User ${user.email} (${user.$id}) - Profile exists.`);
            }
        }

        console.log(`Cleanup complete. Deleted ${deletedCount} users.`);

    } catch (error) {
        console.error("Error during cleanup:", error);
    }
}

cleanupUsers();
