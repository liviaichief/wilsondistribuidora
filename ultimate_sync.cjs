const { Client, Databases } = require('node-appwrite');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27')
    .setKey('standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140');

const databases = new Databases(client);

const BUCKET_URL = 'https://sfo.cloud.appwrite.io/v1/storage/buckets/images_bucket/files';
const PROJECT_ID = '69d59db800358cca9f27';
const API_KEY = 'standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140';

const dir = 'C:/Users/Talita/.gemini/antigravity/brain/4b3503b3-3775-481d-891b-3129d9bafd38';
const files = fs.readdirSync(dir);

const mapping = [
    { productId: '69d5c98700341d341fde', prefix: 'kit_churrasco' },
    { productId: '69d5c98d002cd08d0be8', prefix: 'lombo' },
    { productId: '69d5c98e001176848146', prefix: 'panceta' },
    { productId: '69d5c98e001ffac2d99d', prefix: 'kit_churrasco' }, // Usar kit se faltar carne individual
    { productId: '69d5c98e0030b5363817', prefix: 'asinha' },
    { productId: '69d5c98f001554c96a51', prefix: 'coracao' },
    { productId: '69d5c990002e8e3125d5', prefix: 'faca' },
    { productId: '69d5c991000065e45101', prefix: 'tabua' },
    { productId: '69d5c991002840ce6846', prefix: 'afiador' },
    { productId: '69d5c9920011959f1191', prefix: 'carvao' },
    { productId: '69d5c992002177b8901d', prefix: 'carvao' }, // Sal/Carvão juntos
    { productId: '69d5c9920030192a2388', prefix: 'lenha' },
    { productId: '69d5c993000ec1784c10', prefix: 'vinho' },
    { productId: '69d5c993001ea7be247c', prefix: 'refrigerante' }
];

async function sync() {
    for (const job of mapping) {
        const fileMatch = files.find(f => f.startsWith(job.prefix) && f.endsWith('.png'));
        if (!fileMatch) {
            console.log(`No match for ${job.prefix}`);
            continue;
        }

        const fullPath = path.join(dir, fileMatch);
        try {
            console.log(`Uploading ${fileMatch} for ${job.productId}...`);
            const curlCmd = `curl.exe -s -X POST ${BUCKET_URL} -H "X-Appwrite-Project: ${PROJECT_ID}" -H "X-Appwrite-Key: ${API_KEY}" -F "fileId=unique()" -F "file=@${fullPath}"`;
            const output = execSync(curlCmd).toString();
            const res = JSON.parse(output);
            const imageId = res.$id;
            
            await databases.updateDocument('main_db', 'products', job.productId, { image: imageId });
            console.log(`Success updated ${job.productId}`);
        } catch (e) {
            console.error(`Error for ${job.productId}:`, e.message);
        }
    }
}

sync();
