import { Client, Storage, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config();

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const BUCKET_ID = process.env.VITE_APPWRITE_BUCKET_ID || 'images_bucket';

if (!API_KEY) {
    console.error('ERRO: APPWRITE_API_KEY não encontrada no .env');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const storage = new Storage(client);

async function fixStorage() {
    console.log(`Verificando permissões do bucket: ${BUCKET_ID}...`);
    
    try {
        const bucket = await storage.getBucket(BUCKET_ID);
        console.log(`Bucket encontrado: ${bucket.name}`);
        
        // Atualizar permissões para permitir leitura pública (Role.any())
        // E escrita para usuários autenticados (opcional, mas comum para admin)
        await storage.updateBucket(
            BUCKET_ID,
            bucket.name,
            [
                Permission.read(Role.any()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ],
            false, // fileSecurity - se false, as permissões do bucket valem para todos.
            true, // enabled
            50000000, // maxFileSize (50MB)
            ['jpg', 'png', 'svg', 'webp', 'gif', 'mp4', 'mov', 'webm'], // allowedExtensions
            'none', // compression
            true, // encryption
            true // antivirus
        );
        
        console.log('✅ Permissões do Bucket atualizadas com sucesso para ACESSO PÚBLICO!');
        console.log('As imagens devem carregar agora no frontend.');
        
    } catch (error) {
        console.error('❌ Erro ao atualizar bucket:', error);
    }
}

fixStorage();
