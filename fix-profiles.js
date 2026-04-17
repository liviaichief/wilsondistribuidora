import { Client, Databases } from 'node-appwrite';

const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '69d59db800358cca9f27';
const API_KEY = 'standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

// Profiles fields
const arr = [
    { key: 'email', size: 255 },
    { key: 'full_name', size: 255 },
    { key: 'first_name', size: 100 },
    { key: 'last_name', size: 100 },
    { key: 'user_id', size: 255 },
    { key: 'role', size: 50 },
    { key: 'whatsapp', size: 50 },
    { key: 'birthday', size: 50 },
    { key: 'last_login', size: 100 }
];

async function run() {
    for (const item of arr) {
        try {
            await databases.createStringAttribute('main_db', 'profiles', item.key, item.size, false);
            console.log('+ attr profile: ', item.key);
            // Wait slightly for provisioning due to Appwrite limits
            await new Promise(r => setTimeout(r, 800));
        } catch (e) {
            console.log('Possível erro/já existe:', e.message);
        }
    }
    console.log("Fim!");
}
run();
