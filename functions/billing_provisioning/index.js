const { Client, Databases, Query } = require('node-appwrite');

/**
 * Worker de Verificação Diária de Assinaturas (Cron Job)
 * Horário sugerido: 03:00 AM
 */
module.exports = async function (context) {
    const { log, error, res } = context;

    const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const dbId = process.env.VITE_DATABASE_ID || 'boutique_carne_db';
    const subCollection = 'subscriptions';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    log(`🚀 Iniciando varredura diária: ${today.toLocaleDateString()}`);

    try {
        // 1. Buscar assinaturas que NÃO estão canceladas
        const response = await databases.listDocuments(
            dbId,
            subCollection,
            [Query.notEqual('status', 'CANCELED'), Query.limit(5000)]
        );

        let countBlocked = 0;
        let countWarning = 0;

        for (const sub of response.documents) {
            const expiresAt = new Date(sub.expires_at);
            expiresAt.setHours(0, 0, 0, 0);

            const gracePeriod = sub.grace_period_days || 5;
            
            // Data limite de bloqueio (Vencimento + Grace Period)
            const deadLine = new Date(expiresAt);
            deadLine.setDate(deadLine.getDate() + gracePeriod);

            // DIFERENÇA EM DIAS
            const diffTime = expiresAt.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // LOGICA DE BLOQUEIO (V+6)
            if (today > deadLine) {
                if (sub.status !== 'BLOCKED') {
                    log(`🛑 BLOQUEANDO: ${sub.client_email || sub.$id} (Vencido há ${Math.abs(diffDays)} dias)`);
                    
                    await databases.updateDocument(dbId, subCollection, sub.$id, {
                        status: 'BLOCKED',
                        is_active: false
                    });

                    // Log de Auditoria
                    await databases.createDocument(dbId, 'audit_logs', 'unique()', {
                        event: 'SUBSCRIPTION_BLOCKED',
                        details: `Assinatura de ${sub.client_email} bloqueada automaticamente após grace period.`,
                        timestamp: new Date().toISOString()
                    });
                    
                    countBlocked++;
                }
            } 
            // LOGICA DE AVISO (PAST_DUE)
            else if (today > expiresAt) {
                if (sub.status !== 'PAST_DUE') {
                    log(`⚠️ AVISO: ${sub.client_email || sub.$id} entrou em Grace Period.`);
                    await databases.updateDocument(dbId, subCollection, sub.$id, {
                        status: 'PAST_DUE'
                    });
                    countWarning++;
                }
            }
            // LOGICA DE REATIVAÇÃO (Se pagar e a data for futura)
            else if (today <= expiresAt && sub.status !== 'ACTIVE') {
                 log(`✅ REATIVANDO: ${sub.client_email || sub.$id} regularizado.`);
                 await databases.updateDocument(dbId, subCollection, sub.$id, {
                    status: 'ACTIVE',
                    is_active: true
                });
            }
        }

        return res.json({
            success: true,
            status: {
                total_checked: response.documents.length,
                blocked: countBlocked,
                warning: countWarning
            }
        });

    } catch (err) {
        error('❌ Falha no Worker Cron: ' + err.message);
        return res.json({ success: false, error: err.message }, 500);
    }
};
