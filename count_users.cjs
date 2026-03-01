require('dotenv').config();
const { Client, Databases, Users } = require('node-appwrite');

async function countUsers() {
    const client = new Client()
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const users = new Users(client);

    try {
        console.log("Checking Appwrite users (Authentication)...");
        const authUsers = await users.list();
        console.log(`Total users in Authentication: ${authUsers.total}`);

        console.log("\nChecking Appwrite profiles (Database)...");
        const profilesList = await databases.listDocuments(
            process.env.DATABASE_ID,
            'profiles' // Assuming collection ID is 'profiles'
        );
        console.log(`Total users in Profiles Collection: ${profilesList.total}`);

        if (authUsers.total === profilesList.total) {
            console.log("\nThe number of users is synchronized.");
        } else {
            console.log("\nThere is a discrepancy between the number of authenticated users and database profiles.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

countUsers();
