
import { Client, Databases, Storage, ID } from 'node-appwrite';
import fs from 'fs';
import path from 'path';

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27')
    .setKey('standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140');

const databases = new Databases(client);
const storage = new Storage(client);
const BUCKET_ID = 'images_bucket';

async function uploadAndUpdate(productId, filePath) {
    try {
        console.log(`📤 Subindo imagem para o produto ${productId}: ${filePath}`);
        
        // 1. Upload to Storage
        const fileRes = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
            filePath // Em algumas versões do Node SDK, passar o path funciona
        );
        
        const fileId = fileRes.$id;
        console.log(`✅ Imagem salva no Storage: ${fileId}`);
        
        await databases.updateDocument(
            'main_db',
            'products',
            productId,
            { image: fileId }
        );
        console.log(`🎉 Produto ${productId} atualizado com sucesso!`);
        
    } catch (e) {
        console.error(`❌ Erro em ${productId}:`, e);
    }
}

const productId = process.argv[2];
const filePath = process.argv[3];

if (productId && filePath) {
    uploadAndUpdate(productId, filePath);
} else {
    console.log("Usage: node upload_image_esm.js <productId> <filePath>");
}
