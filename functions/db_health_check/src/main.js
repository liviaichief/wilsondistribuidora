import { Client, Databases, ID } from 'node-appwrite';

/**
 * Dependências e Variáveis Necessárias (Configure no Painel do Appwrite):
 * 1. Runtime: Node.js (Recomendado o 18.0)
 * 2. Variáveis de Ambiente na Função:
 *    - APPWRITE_API_KEY (Com permissão completa)
 *    - DATABASE_ID (Ex: boutique_carne_db)
 *    - APPWRITE_ENDPOINT (Opcional, default: https://sfo.cloud.appwrite.io/v1)
 *    - LOG_COLLECTION_ID (Opcional: ID da coleção que vc criará para arquivar registros).
 */
export default async ({ req, res, log, error }) => {
    // Configuração a partir do Appwrite Functions Env
    const client = new Client();
    const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
    const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const API_KEY = process.env.APPWRITE_API_KEY;
    const DATABASE_ID = process.env.DATABASE_ID || 'boutique_carne_db';
    const LOG_COLLECTION_ID = process.env.LOG_COLLECTION_ID || null; // Crie uma tabela de logs caso não queira só o log em tela

    if (!PROJECT_ID || !API_KEY) {
        error("Erro Crítico: APPWRITE_API_KEY não foi configurada na função ou erro de ambiente em Nuvem.");
        return res.json({ success: false, error: "Missing config" });
    }

    client
        .setEndpoint(ENDPOINT)
        .setProject(PROJECT_ID)
        .setKey(API_KEY);

    const databases = new Databases(client);

    try {
        log(`[${new Date().toISOString()}] Iniciando a verificação de saúde do banco de dados (Health Check)...`);

        // Teste de Saúde: Tenta ler 1 documento (apenas para validar se o BD responde perfeitamente)
        const response = await databases.listDocuments(DATABASE_ID, 'products', []);

        let successMessage = `Status OK: Conexão e leitura realizadas com sucesso! Foi(ram) encontrado(s) ${response.total} produto(s).`;

        // Log que fica arquivado no painel de LOGs do Appwrite Console
        log(`✓ ${successMessage}`);

        // Opcional: Se você configurar uma coleção só para gravar o histórico desses relatórios diretamente no banco (ex: "health_logs")
        if (LOG_COLLECTION_ID) {
            await databases.createDocument(
                DATABASE_ID,
                LOG_COLLECTION_ID,
                ID.unique(),
                {
                    status: 'SUCCESS',
                    message: successMessage,
                    created_at: new Date().toISOString()
                }
            );
            log("📄 Log adicionado diretamente na Tabela/Coleção do Banco.");
        }

        // Retorno de finalização da API
        return res.json({ status: 'SUCCESS', message: successMessage });

    } catch (e) {
        let errorMessage = `Status ERRO: Falha ao conversar com o Banco de Dados. Detalhe: ${e.message}`;

        // Emite o Erro Vermelho no Appwrite
        error(`❌ ${errorMessage}`);

        // Opcional: Arquivar erro na tabela.
        if (LOG_COLLECTION_ID) {
            try {
                await databases.createDocument(
                    DATABASE_ID,
                    LOG_COLLECTION_ID,
                    ID.unique(),
                    {
                        status: 'ERROR',
                        message: errorMessage,
                        created_at: new Date().toISOString()
                    }
                );
            } catch (dbLogErr) {
                error("Não foi possível nem salvar o log de erro principal!");
            }
        }

        return res.json({ status: 'ERROR', message: errorMessage, details: e.message });
    }
};
