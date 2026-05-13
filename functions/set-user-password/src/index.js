import { Client, Users } from 'node-appwrite';

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

  const { userId, password, apiKey } = body;

  if (!userId || !password || !apiKey) {
    return res.json({ ok: false, error: 'userId, password e apiKey são obrigatórios' }, 400);
  }

  if (password.length < 8) {
    return res.json({ ok: false, error: 'Senha deve ter no mínimo 8 caracteres' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(apiKey);

  const users = new Users(client);

  try {
    await users.updatePassword(userId, password);
    log(`Senha atualizada para userId: ${userId}`);
    return res.json({ ok: true });
  } catch (err) {
    error(`Erro ao atualizar senha: ${err.message}`);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
