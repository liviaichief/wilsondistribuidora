const { Client, Databases } = require('node-appwrite');
const { execSync } = require('child_process');

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27')
    .setKey('standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140');

const databases = new Databases(client);

const BUCKET_URL = 'https://sfo.cloud.appwrite.io/v1/storage/buckets/images_bucket/files';
const PROJECT_ID = '69d59db800358cca9f27';
const API_KEY = 'standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140';

const jobs = [
    { productId: '69d5c991000065e45101', path: '"C:/Users/Talita/.gemini/antigravity/brain/4b3503b3-3775-481d-891b-3129d9bafd38/tabua_madeira_nobre_gourmet_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_1775737518228.png"' },
    { productId: '69d5c991002840ce6846', path: '"C:/Users/Talita/.gemini/antigravity/brain/4b3503b3-3775-481d-891b-3129d9bafd38/afiador_faca_pro_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_o_1775737721444.png"' },
    { productId: '69d5c9920011959f1191', path: '"C:/Users/Talita/.gemini/antigravity/brain/4b3503b3-3775-481d-891b-3129d9bafd38/carvao_sal_1775737974504.png"' },
    { productId: '69d5c992002177b8901d', path: '"C:/Users/Talita/.gemini/antigravity/brain/4b3503b3-3775-481d-891b-3129d9bafd38/carvao_sal_1775737974504.png"' },
    { productId: '69d5c9920030192a2388', path: '"C:/Users/Talita/.gemini/antigravity/brain/4b3503b3-3775-481d-891b-3129d9bafd38/lenha_macieira_1775738416374.png"' },
    { productId: '69d5c993000ec1784c10', path: '"C:/Users/Talita/.gemini/antigravity/brain/4b3503b3-3775-481d-891b-3129d9bafd38/vinho_malbec_1775738350222.png"' },
    { productId: '69d5c993001ea7be247c', path: '"C:/Users/Talita/.gemini/antigravity/brain/4b3503b3-3775-481d-891b-3129d9bafd38/refrigerante_2l_1775738382370.png"' }
];

async function sync() {
    for (const job of jobs) {
        try {
            console.log(`Uploading for ${job.productId}...`);
            const curlCmd = `curl.exe -s -X POST ${BUCKET_URL} -H "X-Appwrite-Project: ${PROJECT_ID}" -H "X-Appwrite-Key: ${API_KEY}" -F "fileId=unique()" -F "file=@${job.path.replace(/"/g, '')}"`;
            const output = execSync(curlCmd).toString();
            const res = JSON.parse(output);
            const imageId = res.$id;
            console.log(`Uploaded! ID: ${imageId}. Updating DB...`);
            
            await databases.updateDocument('main_db', 'products', job.productId, { image: imageId });
            console.log(`Success!`);
        } catch (e) {
            console.error(`Error for ${job.productId}:`, e.message);
        }
    }
}

sync();
