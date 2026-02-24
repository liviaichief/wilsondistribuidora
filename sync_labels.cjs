require('dotenv').config();
const { Client, Databases, Users, Query } = require('node-appwrite');

async function syncLabels() {
    const client = new Client()
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const users = new Users(client);

    try {
        console.log("Buscando perfis...");
        const res = await databases.listDocuments(
            process.env.VITE_DATABASE_ID,
            process.env.VITE_COLLECTION_PROFILES,
            [Query.limit(100)]
        );

        for (const doc of res.documents) {
            const role = doc.role;
            const userId = doc.user_id || doc.$id;

            if (role === 'admin' || role === 'owner') {
                try {
                    console.log(`Verificando usuário ${doc.full_name} (${doc.email}) - ID: ${userId}, Role: ${role}`);

                    const user = await users.get(userId);
                    const currentLabels = user.labels || [];

                    if (!currentLabels.includes('admin')) {
                        console.log(`=> Adicionando label 'admin' para ${doc.email}`);
                        const newLabels = [...currentLabels, 'admin'];
                        await users.updateLabels(userId, newLabels);
                        console.log(`=> Label 'admin' adicionado com sucesso!`);
                    } else {
                        console.log(`=> Usuário já possui a label 'admin'.`);
                    }
                } catch (e) {
                    if (e.code === 404) {
                        console.log(`=> Conta Auth não existe para o ID: ${userId} (apenas o perfil no DB).`);
                    } else {
                        console.error(`=> Erro ao atualizar usuário ${doc.email}:`, e.message);
                    }
                }
            } else {
                // Remove the admin label if they are neither admin nor owner
                try {
                    const user = await users.get(userId);
                    const currentLabels = user.labels || [];
                    if (currentLabels.includes('admin')) {
                        console.log(`=> Removendo label 'admin' de ${doc.email} (Novo role: ${role})`);
                        const newLabels = currentLabels.filter(l => l !== 'admin');
                        await users.updateLabels(userId, newLabels);
                    }
                } catch (e) { /* ignore 404 normally */ }
            }
        }
        console.log("Sincronização de labels concluída.");
    } catch (e) {
        console.error("Erro geral:", e);
    }
}

syncLabels();
