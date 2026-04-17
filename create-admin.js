import { Client, Databases, Users, ID } from 'node-appwrite';

const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '69d59db800358cca9f27';
const API_KEY = 'standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const users = new Users(client);
const databases = new Databases(client);

async function run() {
    try {
        const email = 'admin@wilsondistribuidora.com.br';
        const password = 'admin@wilson2026';
        const name = 'Administrador';

        let userId = null;
        try {
            // Tenta criar o usuario
            const user = await users.create(ID.unique(), email, null, password, name);
            userId = user.$id;
            console.log('User de Auth criado:', userId);
        } catch (e) {
            if (e.code === 409) {
                console.log('Usuário com esse email já existe.');
                // Lógica de lidar com usuario pre-existente, tentamos buscar pelo email
                const userList = await users.list();
                const existant = userList.users.find(u => u.email === email);
                if (existant) {
                    userId = existant.$id;
                    console.log('Encontrado usuário pre-existente:', userId);
                    await users.updatePassword(userId, password); // Forçar atualização da senha para garantir acesso
                }
            } else {
                throw e;
            }
        }

        if (userId) {
            try {
                // Tenta criar o profile (com ID customizado sendo a ID do Auth)
                await databases.createDocument('main_db', 'profiles', userId, {
                    email: email,
                    full_name: name,
                    first_name: 'Admin',
                    last_name: '',
                    role: 'owner',
                    user_id: userId
                });
                console.log('Profile Owner vinculado!');
            } catch (pErr) {
                if (pErr.code === 409) {
                    console.log('O Profile já existe, atualizando para owner...');
                    await databases.updateDocument('main_db', 'profiles', userId, {
                        role: 'owner'
                    });
                } else {
                    throw pErr;
                }
            }
            console.log('=== CREDENCIAIS DO ADMIN GERADAS ===');
            console.log(`Email: ${email}`);
            console.log(`Senha: ${password}`);
            console.log(`URL de Teste: /admin`);
        }
        
    } catch (e) {
        console.error("Erro fatal:", e);
    }
}
run();
