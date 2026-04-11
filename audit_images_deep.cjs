
const { Client, Databases, Storage } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27')
    .setKey('standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140');

const databases = new Databases(client);
const storage = new Storage(client);
const BUCKET_ID = 'images_bucket';

async function auditImages() {
    console.log("🕵️ Iniciando auditoria física de imagens...");
    
    try {
        const response = await databases.listDocuments('main_db', 'products');
        const products = response.documents;
        
        for (const p of products) {
            if (!p.image) {
                console.log(`❌ FALTANDO: [${p.$id}] ${p.title} - (Campo vazio)`);
                continue;
            }
            
            if (p.image.includes('http')) {
                console.log(`⚠️ URL EXTERNA: [${p.$id}] ${p.title} - (${p.image})`);
                continue;
            }
            
            try {
                await storage.getFile(BUCKET_ID, p.image);
                // console.log(`✅ OK: ${p.title}`);
            } catch (e) {
                console.log(`🔥 QUEBRADA: [${p.$id}] ${p.title} - (ID ${p.image} não existe no Storage)`);
            }
        }
        
        console.log("🏁 Auditoria concluída.");
    } catch (error) {
        console.error("Erro:", error);
    }
}

auditImages();
