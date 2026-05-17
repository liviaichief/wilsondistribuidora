import { Client, Databases, ID, Query } from 'node-appwrite';
import webpush from 'web-push';

const VALID_CATEGORIAS = ['anuncio', 'comunicado_geral'];

export default async ({ req, res, log, error }) => {
  if (req.method !== 'POST') {
    return res.json({ ok: false, error: 'Method not allowed' }, 405);
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.json({ ok: false, error: 'JSON inválido no body' }, 400);
  }

  const { titulo, conteudo, categoria, midia_url, url, apiKey } = body;

  if (!titulo || !conteudo || !categoria || !apiKey) {
    return res.json({ ok: false, error: 'titulo, conteudo, categoria e apiKey são obrigatórios' }, 400);
  }

  if (!VALID_CATEGORIAS.includes(categoria)) {
    return res.json({ ok: false, error: `Categoria inválida: "${categoria}". Use: ${VALID_CATEGORIAS.join(', ')}` }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(apiKey);

  const db = new Databases(client);
  const DATABASE_ID = process.env.DATABASE_ID || 'main_db';

  try {
    // 1. Cria o documento → dispara evento Realtime para clientes conectados
    const doc = await db.createDocument(
      DATABASE_ID,
      'campanhas_comunicacao',
      ID.unique(),
      {
        titulo,
        conteudo,
        categoria,
        midia_url: midia_url || null,
      }
    );
    log(`[send-campanha] Campanha criada: ${doc.$id} — "${titulo}" (${categoria})`);

    // 2. Envia Web Push para todos os dispositivos inscritos
    const vapidPublicKey  = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidMailto     = process.env.VAPID_MAILTO || 'mailto:contato@wilsondistribuidora.com.br';

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(vapidMailto, vapidPublicKey, vapidPrivateKey);

      const payload = JSON.stringify({
        titulo,
        conteudo,
        categoria,
        url: url || '/',
      });

      let cursor      = null;
      let totalSent   = 0;
      let totalFailed = 0;
      const invalidIds = [];

      // Percorre todas as subscrições em lotes de 100
      do {
        const queries = [Query.limit(100)];
        if (cursor) queries.push(Query.cursorAfter(cursor));

        const result = await db.listDocuments(DATABASE_ID, 'push_subscriptions', queries);

        for (const sub of result.documents) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            );
            totalSent++;
          } catch (pushErr) {
            // 410 Gone / 404 Not Found → subscription inválida, remover
            if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
              invalidIds.push(sub.$id);
            }
            totalFailed++;
            log(`[push] Falha ${pushErr.statusCode} para ...${sub.endpoint.slice(-20)}: ${pushErr.message}`);
          }
        }

        cursor = result.documents.length === 100
          ? result.documents[result.documents.length - 1].$id
          : null;
      } while (cursor);

      // Limpa subscriptions expiradas (fire-and-forget, não bloqueia a resposta)
      for (const id of invalidIds) {
        db.deleteDocument(DATABASE_ID, 'push_subscriptions', id).catch(() => {});
      }

      log(`[send-campanha] Push: ${totalSent} enviados, ${totalFailed} falhas, ${invalidIds.length} removidas`);
    } else {
      log('[send-campanha] VAPID não configurado — push ignorado');
    }

    return res.json({ ok: true, id: doc.$id });
  } catch (err) {
    error(`[send-campanha] Erro: ${err.message}`);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
