
const { Client, Databases, Storage, Query } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = process.env.VITE_DATABASE_ID || 'boutique_carne_db';
const BUCKET_ID = process.env.VITE_APPWRITE_BUCKET_ID || 'product-images';
const COLLECTIONS = {
    PRODUCTS: process.env.VITE_COLLECTION_PRODUCTS || 'products',
    BANNERS: process.env.VITE_COLLECTION_BANNERS || 'banners'
};

async function purgeOrphans() {
    console.log('🚀 Iniciando faxina no Appwrite Storage...');
    
    try {
        // 1. Coletar todos os IDs de arquivos em uso nos PRODUTOS
        console.log('📦 Lendo produtos...');
        const productsResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [Query.limit(5000)]);
        const productFiles = productsResponse.documents
            .map(p => p.image)
            .filter(img => img && !img.startsWith('http'));

        // 2. Coletar todos os IDs de arquivos em uso nos BANNERS
        console.log('🖼️ Lendo banners...');
        const bannersResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.BANNERS, [Query.limit(5000)]);
        const bannerFiles = bannersResponse.documents
            .map(b => {
                if (!b.image_url) return null;
                // Extrair ID do arquivo da URL: https://.../files/FILE_ID/view
                const match = b.image_url.match(/\/files\/([^\/]+)/);
                return match ? match[1] : null;
            })
            .filter(id => id !== null);

        const usedFileIds = new Set([...productFiles, ...bannerFiles]);
        console.log(`✅ Total de arquivos em uso: ${usedFileIds.size}`);

        // 3. Listar todos os arquivos no Bucket
        console.log('🔍 Listando arquivos no Storage...');
        const filesResponse = await storage.listFiles(BUCKET_ID, [Query.limit(5000)]);
        const totalFiles = filesResponse.files;
        
        console.log(`📂 Total de arquivos no Storage: ${totalFiles.length}`);

        let deletedCount = 0;
        let savedBytes = 0;

        for (const file of totalFiles) {
            if (!usedFileIds.has(file.$id)) {
                console.log(`🗑️ Deletando órfão: ${file.$id} (${(file.sizeOriginal / 1024).toFixed(2)} KB)`);
                await storage.deleteFile(BUCKET_ID, file.$id);
                deletedCount++;
                savedBytes += file.sizeOriginal;
            }
        }

        console.log('\n--- RESULTADO DA FAXINA ---');
        console.log(`✨ Arquivos deletados: ${deletedCount}`);
        console.log(`💾 Espaço recuperado: ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);
        console.log('---------------------------');

    } catch (error) {
        console.error('❌ Erro durante a limpeza:', error);
    }
}

purgeOrphans();
