import { Client, Databases, ID, Query } from 'node-appwrite';
import webpush from 'web-push';

const VALID_TIPOS = ['promocao', 'lembrete', 'transacional', 'geral', 'sistema'];

/** Mapeia o novo tipo para a categoria legada (usada pelo Realtime do cliente) */
const TIPO_CATEGORIA = {
  promocao:     'anuncio',
  lembrete:     'anuncio',
  transacional: 'comunicado_geral',
  geral:        'comunicado_geral',
  sistema:      'comunicado_geral',
};

// Para retrocompatibilidade: aceita categoria antiga direto
const VALID_CATEGORIAS_LEGACY = ['anuncio', 'comunicado_geral'];

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

  const {
    titulo, conteudo, apiKey,
    tipo, categoria,        // tipo = novo | categoria = legado
    canal = 'todos',
    actions = null,
    midia_url, url,
  } = body;

  if (!titulo || !conteudo || !apiKey) {
    return res.json({ ok: false, error: 'titulo, conteudo e apiKey são obrigatórios' }, 400);
  }

  // Determina categoria final
  let categoriaFinal;
  if (tipo && VALID_TIPOS.includes(tipo)) {
    categoriaFinal = TIPO_CATEGORIA[tipo];
  } else if (categoria && VALID_CATEGORIAS_LEGACY.includes(categoria)) {
    categoriaFinal = categoria;
  } else {
    categoriaFinal = 'anuncio'; // fallback
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(apiKey);

  const db = new Databases(client);
  const DATABASE_ID = process.env.DATABASE_ID || 'main_db';

  try {
    // 1. Cria o documento em campanhas_comunicacao → dispara Realtime
    const docData = {
      titulo,
      conteudo,
      categoria: categoriaFinal,
      midia_url: midia_url || null,
    };

    // Adiciona actions se fornecido (e coleção tiver o campo)
    if (actions !== null && actions !== undefined) {
      try { docData.actions = typeof actions === 'string' ? actions : JSON.stringify(actions); }
      catch { /* ignora */ }
    }

    const doc = await db.createDocument(
      DATABASE_ID,
      'campanhas_comunicacao',
      ID.unique(),
      docData
    );
    log(`[send-campanha] Campanha criada: ${doc.$id} — "${titulo}" (${categoriaFinal})`);

    // 2. Envia Web Push para todos os dispositivos
    const vapidPublicKey  = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidMailto     = process.env.VAPID_MAILTO || 'mailto:contato@wilsondistribuidora.com.br';

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(vapidMailto, vapidPublicKey, vapidPrivateKey);

      const payload = JSON.stringify({
        titulo, conteudo,
        categoria: categoriaFinal,
        url: url || '/',
      });

      let cursor = null;
      let totalSent = 0, totalFailed = 0;
      const invalidIds = [];

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
            if (pushErr.statusCode === 410 || pushErr.statusCode === 404) invalidIds.push(sub.$id);
            totalFailed++;
          }
        }

        cursor = result.documents.length === 100
          ? result.documents[result.documents.length - 1].$id : null;
      } while (cursor);

      for (const id of invalidIds) {
        db.deleteDocument(DATABASE_ID, 'push_subscriptions', id).catch(() => {});
      }
      log(`[send-campanha] Push: ${totalSent} ok, ${totalFailed} falhas, ${invalidIds.length} removidas`);
    } else {
      log('[send-campanha] VAPID não configurado — push ignorado');
    }

    return res.json({ ok: true, id: doc.$id });
  } catch (err) {
    error(`[send-campanha] Erro: ${err.message}`);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
