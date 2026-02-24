require('dotenv').config();
const { Client, Databases, Query } = require('node-appwrite');

async function testBirthday() {
    console.log("=== INICIANDO TESTE DO MOTOR DE ANIVERSÁRIOS ===\n");

    const client = new Client()
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID || 'boutique_carne_db';
    const PROFILES_COLLECTION = 'profiles';
    const SETTINGS_COLLECTION = 'settings';

    try {
        // 1. Verificar configuração
        console.log("1. Buscando configurações de mensagem...");
        const settingsRes = await databases.listDocuments(DATABASE_ID, SETTINGS_COLLECTION);
        const settings = {};
        settingsRes.documents.forEach(doc => { settings[doc.key] = doc.value; });

        const baseMessage = settings.birthday_message || 'Parabéns {nome}! A Boutique de Carne 3R te deseja um dia maravilhoso e cheio de comemorações!';
        console.log(`   Mensagem Encontrada: "${baseMessage}"\n`);

        // 2. Data de hoje
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${month}-${day}`;
        console.log(`2. Procurando aniversariantes do dia (${todayStr})...`);

        // 3. Buscar clientes com limite simplificado para teste
        const resProfiles = await databases.listDocuments(DATABASE_ID, PROFILES_COLLECTION, [
            Query.limit(5000)
        ]);

        const birthdaysToday = resProfiles.documents.filter(doc => {
            if (!doc.birthday) return false;
            const bParts = doc.birthday.split('-');
            if (bParts.length < 3) return false;
            return `${bParts[1]}-${bParts[2]}` === todayStr;
        });

        console.log(`   Encontrado(s): ${birthdaysToday.length} cliente(s).\n`);

        if (birthdaysToday.length > 0) {
            console.log("3. Simulação de Envio para Clientes:");
            birthdaysToday.forEach(user => {
                let msg = baseMessage.replace('{nome}', user.full_name || 'Amigo');
                let phone = user.whatsapp || 'SEM NÚMERO';
                console.log(`   =================================`);
                console.log(`   📱 PARA: ${user.full_name} (${phone})`);
                console.log(`   💬 TEXTO:\n   "${msg}"`);
                console.log(`   =================================\n`);
            });
        } else {
            console.log("⚠️ Ninguém faz aniversário hoje no banco de dados.");
            console.log("\n--- SIMULAÇÃO FORÇADA DE COMO FICARIA ---");
            let msg = baseMessage.replace('{nome}', 'Marcos Cliente Teste');
            console.log(`📱 PARA: Marcos Cliente Teste ((11) 99999-9999)`);
            console.log(`💬 TEXTO:\n"${msg}"\n`);
        }

        // 4. Log para a loja
        const storeWhatsapp = process.env.VITE_WHATSAPP_NUMBER || 'Número da Loja Desconhecido';
        const namesList = birthdaysToday.length > 0 ? birthdaysToday.map(u => u.full_name).join(', ') : 'Nenhum aniversariante hoje';
        const storeLogMessage = `🎂 Relatório de Aniversários Hoje (${day}/${month}):\n\nIdentificamos ${birthdaysToday.length} aniversariante(s) hoje: \n${namesList}\n\nA mensagem automática foi colocada na fila de envio!`;

        console.log("4. Simulação do Relatório Enviado para o Dono da Loja:");
        console.log(`   📱 PARA: LOJA (${storeWhatsapp})`);
        console.log(`   💬 TEXTO:\n   "${storeLogMessage.replace(/\\n/g, '\n   ')}"`);
        console.log(`\n=== FIM DO TESTE ===`);

    } catch (e) {
        console.error("ERRO NO TESTE:", e);
    }
}

testBirthday();
