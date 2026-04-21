const { Client, Account, Databases, ID } = require('appwrite');
const client = new Client().setEndpoint('https://sfo.cloud.appwrite.io/v1').setProject('69d59db800358cca9f27');
const account = new Account(client);
const databases = new Databases(client);

async function run() {
    try {
        const email = 'testuser_' + Date.now() + '@example.com';
        const password = 'Password321!';
        const userId = ID.unique();
        
        console.log('Creating account...');
        await account.create(userId, email, password, 'John Doe');
        
        console.log('Logging in...');
        await account.createEmailPasswordSession(email, password);
        
        console.log('Getting account...');
        const acc = await account.get();
        console.log('Acc ID:', acc.$id);

        console.log('Creating profile doc...');
        await databases.createDocument('main_db', 'profiles', acc.$id, {
            email: email,
            full_name: 'John Doe',
            first_name: 'John',
            last_name: 'Doe',
            whatsapp: '11999999999',
            birthday: '1990-01-01',
            user_id: acc.$id,
            role: 'client'
        });
        console.log('Profile created via Web SDK successfully!');
    } catch(e) {
        console.log('Error:', e.message);
    }
}
run();
