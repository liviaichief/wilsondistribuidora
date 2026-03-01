require('dotenv').config();
const { Client, Databases, ID } = require('node-appwrite');

async function test() {
    const client = new Client()
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    
    try {
        const id = ID.unique();
        console.log("Creating doc with empty string for birthday ...");
        const res = await databases.createDocument(
            process.env.DATABASE_ID,
            'profiles',
            id,
            {
                email: 'test@example.com',
                full_name: 'Test',
                first_name: 'Test',
                last_name: '',
                whatsapp: '',
                birthday: '',
                user_id: id,
                role: 'client'
            }
        );
        console.log("Success!", res);
    } catch (e) {
        console.error("Error creating with '':", e.message);
    }

    try {
        const id = ID.unique();
        console.log("Creating doc with null for birthday ...");
        const res = await databases.createDocument(
            process.env.DATABASE_ID,
            'profiles',
            id,
            {
                email: 'test@example.com',
                full_name: 'Test',
                first_name: 'Test',
                last_name: '',
                whatsapp: '',
                birthday: null,
                user_id: id,
                role: 'client'
            }
        );
        console.log("Success with null!", res);
    } catch (e) {
        console.error("Error creating with null:", e.message);
    }
}
test();
