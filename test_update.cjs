const { Client, Databases } = require('node-appwrite');
const client = new Client().setEndpoint('https://sfo.cloud.appwrite.io/v1').setProject('69ebf93f000372e879ff').setKey('standard_06684859eef23fe37b1b2b5e69fba753f7637355c69fe55c029cd878bcc2ef835e1deb4b4f9fed425e938d81245cec097cffe9e3bd18692f28b3434cc5b73edc3b10dd447f75aec2c4f381bce89c56688ad8bed3bdaac0c0ec1876722e6259578a3a99aeb3802544082dd77cf6f438eedd16ee5a0a95e4b863cad153f5471e46');
const databases = new Databases(client);

async function testUpdate() {
    try {
        const docs = await databases.listDocuments('main_db', 'products', []);
        if (docs.documents.length > 0) {
            const doc = docs.documents[0];
            await databases.updateDocument('main_db', 'products', doc.$id, {
                image_2: 'test_file_id',
                cost_price: 10.5,
                has_box_option: true,
                box_price: 15.0
            });
            console.log('Update success!');
        } else {
            console.log('No products found to test.');
        }
    } catch(e) {
        console.error('Update Error:', e.message);
    }
}
testUpdate();
