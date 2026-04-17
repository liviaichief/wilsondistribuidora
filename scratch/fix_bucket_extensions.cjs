const { Client, Storage } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27')
    .setKey('standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140');

const storage = new Storage(client);
const BUCKET_ID = 'images_bucket';

async function updateBucket() {
    try {
        console.log('Updating bucket permissions and extensions...');
        const result = await storage.updateBucket(
            BUCKET_ID,
            'Imagens Globais',
            ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
            false, // fileSecurity
            true,  // enabled
            50000000, // maxFileSize
            ['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif', 'mp4', 'mov', 'webm', 'HEIC', 'heic'], // Added jpeg and heic
            'none', // compression
            true, // encryption
            true // antivirus
        );
        console.log('Bucket Updated Successfully:', result.allowedFileExtensions);
    } catch (error) {
        console.error('Error updating bucket:', error.message);
    }
}

updateBucket();
