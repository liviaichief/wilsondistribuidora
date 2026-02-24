require('dotenv').config();
const { Client, Databases, Query } = require('node-appwrite');

async function checkUser() {
    const client = new Client()
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    try {
        const res = await databases.listDocuments(process.env.DATABASE_ID, 'profiles', [
            Query.equal('email', 'marcos.gqrz@gmail.com')
        ]);

        console.log("User Profile:", res.documents[0]);
    } catch (e) {
        console.error(e);
    }
}

checkUser();
