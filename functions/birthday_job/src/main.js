import { Client, Databases, Query } from 'node-appwrite';

/**
 * Appwrite Function: birthday_job
 * - Runs via CRON: 0 8 * * * (Every day at 08:00 AM)
 * - Checks Profiles collection for users born today (ignoring year).
 * - Gets configured birthday message from 'settings' collection.
 * - Simulates/sends WhatsApp to the customer.
 * - Simulates/sends WhatsApp notification to the store.
 */
export default async ({ req, res, log, error }) => {
    // 1. Setup Appwrite Client
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID || 'boutique_carne_db';
    const PROFILES_COLLECTION = 'profiles';
    const SETTINGS_COLLECTION = 'settings';

    try {
        log('Iniciando rotina de verificação de aniversariantes (08:00)...');

        // 2. Data de Hoje (MM-DD)
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${month}-${day}`;
        log(`Procurando aniversariantes do dia: ${todayStr}`);

        // 3. Buscar perfis de clientes
        // Como Mês e Dia estão integrados numa string YYYY-MM-DD, a busca precisa listar todos (ou lidar com regex server-side se suportado, mas Appwrite Query não suporta LIKE/Regex com sufixo nativo de forma simples sem fulltext, então fazemos um fetch com limite e filtramos).
        // Num banco com milhares de usuários, seria ideal um índice no mês/dia avulso (birth_month, birth_day).
        // Assumindo < 5000 clientes, faremos filtro na memória pelo backend:
        let allClients = [];
        let offset = 0;
        let limit = 1000;
        let fetchMore = true;

        while (fetchMore) {
            const resProfiles = await databases.listDocuments(
                DATABASE_ID,
                PROFILES_COLLECTION,
                [
                    Query.limit(limit),
                    Query.offset(offset)
                ]
            );
            allClients = allClients.concat(resProfiles.documents);
            if (resProfiles.documents.length < limit) {
                fetchMore = false;
            } else {
                offset += limit;
            }
        }

        const birthdaysToday = allClients.filter(doc => {
            if (!doc.birthday) return false;
            const bParts = doc.birthday.split('-'); // YYYY-MM-DD
            if (bParts.length < 3) return false;
            return `${bParts[1]}-${bParts[2]}` === todayStr;
        });

        log(`${birthdaysToday.length} aniversariante(s) encontrado(s) hoje.`);

        if (birthdaysToday.length === 0) {
            return res.json({ success: true, message: 'Nenhum aniversariante hoje.' });
        }

        // 4. Buscar a Mensagem Configurada (Settings)
        const settingsRes = await databases.listDocuments(DATABASE_ID, SETTINGS_COLLECTION);
        const settings = {};
        settingsRes.documents.forEach(doc => { settings[doc.key] = doc.value; });

        const baseMessage = settings.birthday_message || 'Parabéns {nome}! A Boutique de Carne 3R te deseja um dia maravilhoso e cheio de comemorações!';
        const storeWhatsapp = process.env.STORE_WHATSAPP || '5511944835865';

        // 5. Simular/Disparar WhatsApp para Clientes e Loja
        // Em um projeto real, aqui você faria a chamada POST (fetch) para a Evolution API, Z-API, Z-PRO ou Meta Graph API.

        let sentLog = [];

        for (const user of birthdaysToday) {
            let msg = baseMessage.replace('{nome}', user.full_name || 'Amigo');
            let phone = user.whatsapp ? user.whatsapp.replace(/\\D/g, '') : null;

            if (phone) {
                if (!phone.startsWith('55')) phone = `55${phone}`;

                // === EXEMPLO DE INTEGRAÇÃO COM UMA API DE WHATSAPP API ===
                /*
                await fetch('https://minha-api.servidor.com/message/sendText/INSTANCIA', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'apikey': process.env.WHATSAPP_API_TOKEN },
                    body: JSON.stringify({ number: phone, text: msg })
                });
                */

                log(`[SIMULAÇÃO API] Mensagem de aniversário enviada para ${user.full_name} (${phone}): ${msg}`);
                sentLog.push(user.full_name);
            }
        }

        // 6. Notificar a Loja
        const storeLogMessage = `🎂 Relatório de Aniversários Hoje (${day}/${month}):\n\nIdentificamos ${birthdaysToday.length} aniversariante(s) hoje: \n${sentLog.join(', ')}\n\nA mensagem automática foi colocada na fila de envio!`;

        // === EXEMPLO DE NOTIFICAÇÃO DA LOJA ===
        /*
        await fetch('https://minha-api.servidor.com/message/sendText/INSTANCIA', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': process.env.WHATSAPP_API_TOKEN },
            body: JSON.stringify({ number: storeWhatsapp, text: storeLogMessage })
        });
        */

        log(`[SIMULAÇÃO API] Relatório enviado para a loja (${storeWhatsapp}): ${storeLogMessage}`);

        return res.json({
            success: true,
            birthdays: birthdaysToday.length,
            notified_users: sentLog,
            message: 'Rotina concluída com sucesso!'
        });

    } catch (e) {
        error(`Erro ao rodar rotina de aniversário: ${e.message}`);
        return res.json({ success: false, error: e.message }, 500);
    }
};
