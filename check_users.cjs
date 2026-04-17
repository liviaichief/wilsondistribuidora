const { Client, Users, Databases, Query } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27')
    .setKey('standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140');

const users = new Users(client);
const databases = new Databases(client);

async function check() {
    try {
        console.log("Fetching Auth Users...");
        const authUsers = await users.list([Query.limit(100)]);
        console.log(`Total active Auth Users found: ${authUsers.total}`);
        
        console.log("Fetching Profiles...");
        const profiles = await databases.listDocuments('main_db', 'profiles', [Query.limit(100)]);
        console.log(`Total Profiles found: ${profiles.total}`);

        console.log('--- Auth Users without Profiles ---');
        const profileIds = new Set(profiles.documents.map(p => p.$id));
        let missing = 0;
        
        for (const user of authUsers.users) {
            if (!profileIds.has(user.$id)) {
                console.log(`- [${user.$id}] ${user.name} | ${user.email} | ${user.phone}`);
                missing++;
            }
        }

        if (missing === 0) console.log("All Auth Users have completely sync'd profiles.");

    } catch (e) {
        console.error("Error:", e);
    }
}

check();
