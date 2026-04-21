import { Client, Storage, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);
const databases = new Databases(client);

const BUCKET_ID = process.env.VITE_APPWRITE_BUCKET_ID;
const DATABASE_ID = process.env.VITE_DATABASE_ID;
const COLLECTION_PRODUCTS = process.env.VITE_COLLECTION_PRODUCTS;

async function analyzeImages() {
    console.log('Buscando arquivos no bucket...');
    let allFiles = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
        const response = await storage.listFiles(BUCKET_ID, [Query.limit(limit), Query.offset(offset)]);
        allFiles.push(...response.files);
        if (response.files.length < limit) {
            hasMore = false;
        } else {
            offset += limit;
        }
    }

    console.log(`Total de arquivos encontrados: ${allFiles.length}`);

    // Sort files by size descending
    allFiles.sort((a, b) => b.sizeOriginal - a.sizeOriginal);

    // Calculate total size
    const totalBytes = allFiles.reduce((sum, f) => sum + f.sizeOriginal, 0);
    console.log(`Tamanho total no bucket: ${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`);

    // Filter files larger than 500KB
    const largeFiles = allFiles.filter(f => f.sizeOriginal > 500 * 1024);
    console.log(`Arquivos maiores que 500KB: ${largeFiles.length}`);

    if (largeFiles.length === 0) {
        console.log('Nenhuma imagem gigante encontrada (maior que 500KB).');
        return;
    }

    console.log('\nAnalisando a quais produtos elas pertencem...');
    
    // Fetch all products
    let allProducts = [];
    let pOffset = 0;
    let pHasMore = true;
    while (pHasMore) {
        const pResponse = await databases.listDocuments(DATABASE_ID, COLLECTION_PRODUCTS, [Query.limit(100), Query.offset(pOffset)]);
        allProducts.push(...pResponse.documents);
        if (pResponse.documents.length < 100) pHasMore = false;
        else pOffset += 100;
    }

    const report = [];

    for (const file of largeFiles.slice(0, 50)) { // Top 50 largest
        const sizeMB = (file.sizeOriginal / (1024 * 1024)).toFixed(2);
        const relatedProduct = allProducts.find(p => p.image === file.$id);
        
        report.push({
            fileId: file.$id,
            name: file.name,
            sizeMB: sizeMB + ' MB',
            productTitle: relatedProduct ? relatedProduct.title : 'NENHUM PRODUTO (Órfã)',
            productId: relatedProduct ? relatedProduct.$id : null
        });
    }

    console.table(report);
    fs.writeFileSync('large_images_report.json', JSON.stringify(report, null, 2));
    console.log('\nRelatório salvo em large_images_report.json');
}

analyzeImages().catch(console.error);
