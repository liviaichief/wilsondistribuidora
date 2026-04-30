import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69ebf93f000372e879ff')
    .setKey('standard_06684859eef23fe37b1b2b5e69fba753f7637355c69fe55c029cd878bcc2ef835e1deb4b4f9fed425e938d81245cec097cffe9e3bd18692f28b3434cc5b73edc3b10dd447f75aec2c4f381bce89c56688ad8bed3bdaac0c0ec1876722e6259578a3a99aeb3802544082dd77cf6f438eedd16ee5a0a95e4b863cad153f5471e46');

const databases = new Databases(client);

async function run() {
    try {
        await databases.createBooleanAttribute('main_db', 'products', 'has_box_option', false, false, false);
        console.log('has_box_option created');
    } catch(e) { console.error('Error creating has_box_option:', e.message); }

    try {
        await databases.createFloatAttribute('main_db', 'products', 'box_price', false, 0, null, 0);
        console.log('box_price created');
    } catch(e) { console.error('Error creating box_price:', e.message); }
}

run();
