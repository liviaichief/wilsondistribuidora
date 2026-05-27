
import { Client, Storage } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);
const BUCKET_ID = process.env.VITE_APPWRITE_BUCKET_ID || 'images_bucket';

async function auditImages() {
    console.log('--- Iniciando Auditoria de Imagens ---');
    console.log(`Bucket: ${BUCKET_ID}\n`);

    try {
        const response = await storage.listFiles(BUCKET_ID);
        const files = response.files;

        let totalSize = 0;
        let heavyFiles = 0;

        files.forEach(file => {
            const sizeKB = (file.sizeOriginal / 1024).toFixed(2);
            totalSize += file.sizeOriginal;

            if (file.sizeOriginal > 500 * 1024) { // 500 KB
                console.log(`⚠️ ALERTA: Arquivo muito pesado: ${file.name}`);
                console.log(`   ID: ${file.$id}`);
                console.log(`   Tamanho: ${sizeKB} KB`);
                console.log(`   ---`);
                heavyFiles++;
            }
        });

        console.log('\n--- Resumo ---');
        console.log(`Total de arquivos: ${files.length}`);
        console.log(`Arquivos pesados (>500KB): ${heavyFiles}`);
        console.log(`Tamanho total ocupado: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
        
        if (heavyFiles > 0) {
            console.log('\n💡 DICA: Comprima esses arquivos e faça o re-upload em formato WebP ou JPEG comprimido.');
        } else {
            console.log('\n✅ Parabéns! Todas as imagens estão dentro do limite recomendado.');
        }

    } catch (error) {
        console.error('Erro ao auditar imagens:', error.message);
    }
}

auditImages();
