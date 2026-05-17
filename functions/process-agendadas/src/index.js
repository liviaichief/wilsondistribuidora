/**
 * process-agendadas
 * Função Appwrite com cron "* * * * *" (cada minuto).
 * Verifica campanhas agendadas na coleção `comunicacoes` e as despacha:
 *   1. Cria documento em `campanhas_comunicacao` → dispara Realtime no cliente
 *   2. Envia Web Push para todos os dispositivos inscritos
 *   3. Atualiza o documento em `comunicacoes` para status=enviada
 */
import { Client, Databases, ID, Query } from 'node-appwrite';
import webpush from 'web-push';

const TIPO_CATEGORIA = {
  promocao:     'anuncio',
  lembrete:     'anuncio',
  transacional: 'comunicado_geral',
  geral:        'comunicado_geral',
  sistema:      'comunicado_geral',
};

export default async ({ req, res, log, error }) => {
  const DATABASE_ID = process.env.DATABASE_ID || 'main_db';
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

  if (!ADMIN_API_KEY) {
    error('[process-agendadas] ADMIN_API_KEY não configurada');
    return res.json({ ok: false, error: 'ADMIN_API_KEY ausente' }, 500);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(ADMIN_API_KEY);

  const db = new Databases(client);
  const agora = new Date().toISOString();

  log(`[process-agendadas] Verificando campanhas agendadas <= ${agora}`);

  // ── Busca campanhas agendadas que já passaram do horário ──
  let pendentes = [];
  try {
    const result = await db.listDocuments(DATABASE_ID, 'comunicacoes', [
      Query.equal('status', 'agendada'),
      Query.lessThanEqual('agendada_para', agora),
      Query.limit(20),
    ]);
    pendentes = result.documents;
  } catch (err) {
    error(`[process-agendadas] Erro ao buscar pendentes: ${err.message}`);
    return res.json({ ok: false, error: err.message }, 500);
  }

  if (pendentes.length === 0) {
    log('[process-agendadas] Nenhuma campanha pendente.');
    return res.json({ ok: true, processed: 0 });
  }

  log(`[process-agendadas] ${pendentes.length} campanha(s) para processar`);

  // ── Configura Web Push ────────────────────────────────────────
  const vapidPublicKey  = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidMailto     = process.env.VAPID_MAILTO || 'mailto:contato@wilsondistribuidora.com.br';
  const pushAtivo = vapidPublicKey && vapidPrivateKey;
  if (pushAtivo) webpush.setVapidDetails(vapidMailto, vapidPublicKey, vapidPrivateKey);

  let processed = 0;

  for (const campanha of pendentes) {
    try {
      const { tipo, titulo, conteudo, midia_url, actions } = campanha;
      const categoria = TIPO_CATEGORIA[tipo] || 'anuncio';

      // 1. Marca como 'processando' para evitar reprocessamento
      await db.updateDocument(DATABASE_ID, 'comunicacoes', campanha.$id, {
        status: 'processando',
      });

      // 2. Cria doc em campanhas_comunicacao → Realtime dispara no cliente
      const docData = { titulo, conteudo, categoria, midia_url: midia_url || null };
      if (actions) docData.actions = actions;

      const novaCampanha = await db.createDocument(
        DATABASE_ID, 'campanhas_comunicacao', ID.unique(), docData
      );
      log(`[process-agendadas] campanhas_comunicacao criada: ${novaCampanha.$id}`);

      // 3. Envia Web Push
      if (pushAtivo) {
        const payload = JSON.stringify({ titulo, conteudo, categoria, url: '/' });
        let cursor = null, totalSent = 0, totalFailed = 0;
        const invalidIds = [];

        do {
          const queries = [Query.limit(100)];
          if (cursor) queries.push(Query.cursorAfter(cursor));
          const subs = await db.listDocuments(DATABASE_ID, 'push_subscriptions', queries);

          for (const sub of subs.documents) {
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
          cursor = subs.documents.length === 100
            ? subs.documents[subs.documents.length - 1].$id : null;
        } while (cursor);

        for (const id of invalidIds) db.deleteDocument(DATABASE_ID, 'push_subscriptions', id).catch(() => {});
        log(`[process-agendadas] Push "${titulo}": ${totalSent} ok, ${totalFailed} falhas`);
      }

      // 4. Atualiza status para enviada
      await db.updateDocument(DATABASE_ID, 'comunicacoes', campanha.$id, {
        status: 'enviada',
        campanha_ref: novaCampanha.$id,
      });

      processed++;
    } catch (err) {
      error(`[process-agendadas] Erro na campanha ${campanha.$id}: ${err.message}`);
      // Marca como falhada para não travar
      try {
        await db.updateDocument(DATABASE_ID, 'comunicacoes', campanha.$id, { status: 'falhada' });
      } catch { /* ignora */ }
    }
  }

  log(`[process-agendadas] Concluído: ${processed}/${pendentes.length} processadas`);
  return res.json({ ok: true, processed });
};
