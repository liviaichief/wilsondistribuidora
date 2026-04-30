
const { Client, Storage, Permission, Role } = require('node-appwrite');

async function fixPermissions() {
    const client = new Client()
        .setEndpoint('https://sfo.cloud.appwrite.io/v1')
        .setProject('69ebf93f000372e879ff')
        .setKey('standard_06684859eef23fe37b1b2b5e69fba753f7637355c69fe55c029cd878bcc2ef835e1deb4b4f9fed425e938d81245cec097cffe9e3bd18692f28b3434cc5b73edc3b10dd447f75aec2c4f381bce89c56688ad8bed3bdaac0c0ec1876722e6259578a3a99aeb3802544082dd77cf6f438eedd16ee5a0a95e4b863cad153f5471e46');

    const storage = new Storage(client);

    try {
        const response = await storage.listFiles('images_bucket');
        console.log(`Fixing permissions for ${response.total} files...`);

        for (const file of response.files) {
            console.log(`Updating ${file.name} (${file.$id})...`);
            await storage.updateFile(
                'images_bucket',
                file.$id,
                file.name, // name
                [Permission.read(Role.any())] // permissions
            );
        }

        console.log('✅ All permissions updated to public read!');
    } catch (error) {
        console.error('❌ Error updating permissions:', error);
    }
}

fixPermissions();
