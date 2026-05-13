import { Client, Users, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  if (req.method !== 'POST') {
    return res.json({ ok: false, error: 'Method not allowed' }, 405);
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.json({ ok: false, error: 'Invalid JSON body' }, 400);
  }

  const { userId, email, password, apiKey } = body;

  if (!password || !apiKey || (!userId && !email)) {
    return res.json({ ok: false, error: 'password, apiKey e (userId ou email) são obrigatórios' }, 400);
  }

  if (password.length < 8) {
    return res.json({ ok: false, error: 'Senha deve ter no mínimo 8 caracteres' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(apiKey);

  const users = new Users(client);

  // Resolve o ID real da conta Appwrite
  let resolvedId = userId;

  try {
    // Tenta direto pelo userId primeiro
    if (resolvedId) {
      try {
        await users.get(resolvedId);
        log(`Usuário encontrado pelo ID: ${resolvedId}`);
      } catch (notFound) {
        log(`ID ${resolvedId} não encontrado, tentando pelo e-mail...`);
        resolvedId = null;
      }
    }

    // Fallback: busca pelo e-mail
    if (!resolvedId && email) {
      const list = await users.list([Query.equal('email', [email])]);
      if (list.users.length === 0) {
        return res.json({ ok: false, error: `Nenhuma conta Appwrite encontrada para o e-mail: ${email}` }, 404);
      }
      resolvedId = list.users[0].$id;
      log(`Usuário encontrado pelo e-mail ${email}: ${resolvedId}`);
    }

    if (!resolvedId) {
      return res.json({ ok: false, error: 'Não foi possível identificar a conta do usuário.' }, 404);
    }

    await users.updatePassword(resolvedId, password);
    log(`Senha atualizada com sucesso para: ${resolvedId}`);
    return res.json({ ok: true });

  } catch (err) {
    error(`Erro: ${err.message}`);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
