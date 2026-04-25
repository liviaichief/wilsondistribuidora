
import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_DATABASE_ID || 'main_db';

async function initSettings() {
    console.log('🛠️ Iniciando Warm-up de Configurações...');

    const settings = [
        {
            key: 'system_blocked',
            value: 'false'
        },
        {
            key: 'project_categories',
            value: JSON.stringify([
                { id: 'bovinos', name: 'Bovinos', active: true },
                { id: 'suinos', name: 'Suínos', active: true },
                { id: 'aves', name: 'Aves', active: true },
                { id: 'kits', name: 'Kits', active: true },
                { id: 'mercado', name: 'Mercado', active: true }
            ])
        },
        {
            key: 'project_uoms',
            value: JSON.stringify([
                { id: 'kg', name: 'KG', active: true },
                { id: 'un', name: 'Unidade', active: true },
                { id: 'pct', name: 'Pacote', active: true },
                { id: 'cx', name: 'Caixa', active: true }
            ])
        },
        {
            key: 'whatsapp_number',
            value: process.env.VITE_WHATSAPP_NUMBER || ''
        }
    ];

    for (const s of settings) {
        try {
            console.log(`Checking setting: ${s.key}...`);
            try {
                await databases.updateDocument(DATABASE_ID, 'settings', s.key, { value: s.value });
                console.log(`  ✅ ${s.key} atualizado.`);
            } catch (e) {
                if (e.code === 404) {
                    await databases.createDocument(DATABASE_ID, 'settings', s.key, {
                        key: s.key,
                        value: s.value
                    }, [
                        Permission.read(Role.any())
                    ]);
                    console.log(`  ✅ ${s.key} criado.`);
                } else {
                    throw e;
                }
            }
        } catch (err) {
            console.error(`  ❌ Erro em ${s.key}:`, err.message);
        }
    }

    console.log('\n🚀 Warm-up concluído!');
}

initSettings().catch(console.error);
