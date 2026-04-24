import { Client, Databases, Users, ID } from 'node-appwrite';

const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '69ebf93f000372e879ff';
const API_KEY = 'standard_06684859eef23fe37b1b2b5e69fba753f7637355c69fe55c029cd878bcc2ef835e1deb4b4f9fed425e938d81245cec097cffe9e3bd18692f28b3434cc5b73edc3b10dd447f75aec2c4f381bce89c56688ad8bed3bdaac0c0ec1876722e6259578a3a99aeb3802544082dd77cf6f438eedd16ee5a0a95e4b863cad153f5471e46';

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
