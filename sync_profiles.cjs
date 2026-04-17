const { Client, Users, Databases, Query, ID, Permission, Role } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27')
    .setKey('standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140');

const users = new Users(client);
const databases = new Databases(client);

async function sync() {
    try {
        const authUsers = await users.list([Query.limit(100)]);
        const profiles = await databases.listDocuments('main_db', 'profiles', [Query.limit(100)]);
        const profileIds = new Set(profiles.documents.map(p => p.$id));
        
        for (const user of authUsers.users) {
            if (!profileIds.has(user.$id)) {
                console.log(`Creating profile for [${user.$id}] ${user.name}`);
                await databases.createDocument(
                    'main_db',
                    'profiles',
                    user.$id, // Document ID matches Auth ID
                    {
                        email: user.email,
                        full_name: user.name || '',
                        first_name: (user.name || '').split(' ')[0] || '',
                        last_name: (user.name || '').split(' ').slice(1).join(' ') || '',
                        whatsapp: user.phone || '',
                        user_id: user.$id,
                        role: 'client' // default role
                    },
                    [
                        Permission.read(Role.any()),
                        Permission.write(Role.users())
                    ]
                );
                console.log(`Created.`);
            }
        }
        console.log("Done syncing.");
    } catch (e) {
        console.error("Error:", e);
    }
}

sync();
