import { Client, Databases, ID } from 'node-appwrite';

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

  const { titulo, conteudo, categoria, midia_url, apiKey } = body;

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
    return res.json({ ok: true, id: doc.$id });
  } catch (err) {
    error(`[send-campanha] Erro: ${err.message}`);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
