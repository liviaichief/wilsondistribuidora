
/**
 * Middleware de Assinatura para Appwrite Functions
 * Objetivo: Validar status de pagamento do usuário.
 */

const { Client, Databases, Query } = require('node-appwrite');

const SUBSCRIPTION_GUARD = async (context, next) => {
    const { req, res, log, error } = context;
    
    // 1. Configuração do Cliente
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const dbId = process.env.VITE_DATABASE_ID || '';
    const subCollection = 'subscriptions';

    // 2. Identificação do Usuário (via Header de Auth do Appwrite)
    const userId = req.headers['x-appwrite-user-id'];
    const systemId = process.env.SYSTEM_ID || 'BASE_APP_SAAS';

    if (!userId) {
        log('Unauthorized: No user ID in headers');
        return res.json({ error: 'UNAUTHORIZED' }, 401);
    }

    try {
        // 3. Verificação de Cache (Simulação de Memória - No Appwrite Functions
        // o cache persistente real exigiria Redis externo)
        // Nota: Appwrite Functions podem manter estado global se não forem "cold start"
        
        log(`Checking subscription for user: ${userId}`);

        const response = await databases.listDocuments(
            dbId, 
            subCollection,
            [
                Query.equal('client_id', userId),
                Query.equal('system_id', systemId),
                Query.limit(1)
            ]
        );

        if (response.documents.length === 0) {
            log('No subscription found for user');
            return res.json({ 
                error: 'SUBSCRIPTION_REQUIRED', 
                checkout_url: process.env.CHECKOUT_URL || '/billing' 
            }, 402);
        }

        const sub = response.documents[0];
        const today = new Date();
        const expiresAt = new Date(sub.expires_at);
        const gracePeriod = sub.grace_period_days || 5;

        // Limite máximo para Bloqueio (Data de Vencimento + Carência)
        const deadLine = new Date(expiresAt);
        deadLine.setDate(deadLine.getDate() + gracePeriod);

        // CASO 1: Bloqueio Total (Vencimento + Carência ultrapassados)
        if (today > deadLine || sub.status === 'BLOCKED') {
            log('Subscription BLOCKED');
            
            // Atualizar status no banco se ainda não estiver como BLOCKED
            if (sub.status !== 'BLOCKED') {
                await databases.updateDocument(dbId, subCollection, sub.$id, { status: 'BLOCKED' });
            }

            return res.json({ 
                error: 'SUBSCRIPTION_REQUIRED', 
                status: 'BLOCKED',
                checkout_url: process.env.CHECKOUT_URL || '/billing' 
            }, 402);
        }

        // CASO 2: Modo de Aviso (Vencido, mas dentro da Carência)
        if (today > expiresAt) {
            log('Subscription PAST_DUE (Grace Period)');
            // Injetamos um flag no contexto para o handler final saber que deve avisar o usuário
            req.warning_payment = true;
        }

        // Se chegou aqui, está ACTIVE ou em Warning
        return next(context);

    } catch (err) {
        error('Guard Error: ' + err.message);
        return res.json({ error: 'INTERNAL_SERVER_ERROR' }, 500);
    }
};

module.exports = SUBSCRIPTION_GUARD;
