require('dotenv').config();
const { Client, Account, Databases, ID, Permission, Role } = require('appwrite');

async function testClientSignup() {
    const client = new Client()
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID);

    const account = new Account(client);
    const databases = new Databases(client);

    try {
        const id = ID.unique();
        const email = `test-${id}@example.com`;
        const password = 'password1234';
        console.log("Creating user...", email);

        await account.create(id, email, password, 'Test User');
        await account.createEmailPasswordSession(email, password);
        const user = await account.get();
        console.log("User retrieved. ID:", user.$id);

        try {
            console.log("Attempting to create profile doc via client...");
            const res = await databases.createDocument(
                process.env.VITE_DATABASE_ID,
                process.env.VITE_COLLECTION_PROFILES,
                user.$id,
                {
                    email: email,
                    full_name: 'Test User',
                    first_name: 'Test',
                    last_name: 'User',
                    whatsapp: '',
                    birthday: '',
                    user_id: user.$id,
                    role: 'client'
                },
                [
                    Permission.read(Role.user(user.$id)),
                    Permission.update(Role.user(user.$id)),
                    Permission.read(Role.label('admin')),
                    Permission.update(Role.label('admin'))
                ]
            );
            console.log("Success! Client can create profile doc.", res.$id);
        } catch (dbError) {
            console.error("Failed to create profile by client! DB ERROR:", dbError.message);
        }

        console.log("Test finished.");
    } catch (e) {
        console.error("Account error:", e.message);
    }
}
testClientSignup();
