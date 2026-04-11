
import { Client, Databases, Permission, Role } from 'appwrite';

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27');

const databases = new Databases(client);
const DATABASE_ID = 'main_db';

const settingsToUpdate = [
    { key: 'whatsapp_use_api', value: 'true' },
    { key: 'whatsapp_api_provider', value: 'zapi' },
    { key: 'whatsapp_api_url', value: 'https://api.z-api.io' },
    { key: 'whatsapp_instance', value: '3F1786372C06A1B2F34BAAE399BC1248' },
    { key: 'whatsapp_api_key', value: 'A9439820A1BC8A485C903ADD' }
];

async function seedSettings() {
    for (const item of settingsToUpdate) {
        try {
            console.log(`Updating ${item.key}...`);
            try {
                await databases.updateDocument(DATABASE_ID, 'settings', item.key, { value: item.value });
                console.log(`- ${item.key} updated.`);
            } catch (e) {
                if (e.code === 404) {
                    await databases.createDocument(DATABASE_ID, 'settings', item.key, {
                        key: item.key,
                        value: item.value
                    }, [
                        Permission.read('any'),
                        Permission.write('any')
                    ]);
                    console.log(`- ${item.key} created.`);
                } else {
                    throw e;
                }
            }
        } catch (error) {
            console.error(`Error on ${item.key}:`, error.message);
        }
    }
    console.log("Seeding complete!");
}

seedSettings();
