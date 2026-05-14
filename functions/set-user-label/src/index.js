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

  const { userId, role, apiKey } = body;

  if (!userId || !role || !apiKey) {
    return res.json({ ok: false, error: 'userId, role e apiKey são obrigatórios' }, 400);
  }

  // Mapeamento role do app → label Appwrite
  const ROLE_TO_LABEL = {
    master: 'master',
    owner:  'owner',
    admin:  'admin',
    client: '',       // cliente não tem label
  };

  if (!Object.keys(ROLE_TO_LABEL).includes(role)) {
    return res.json({ ok: false, error: `Role inválido: ${role}` }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(apiKey);

  const users = new Users(client);

  try {
    const label = ROLE_TO_LABEL[role];
    // Labels do usuário: remove todos os labels de role existentes e adiciona o novo
    const roleLabels = ['master', 'owner', 'admin'];
    const currentUser = await users.get(userId);
    const otherLabels = (currentUser.labels || []).filter(l => !roleLabels.includes(l));
    const newLabels = label ? [...otherLabels, label] : otherLabels;

    await users.updateLabels(userId, newLabels);
    log(`Labels atualizados para ${userId}: ${JSON.stringify(newLabels)}`);
    return res.json({ ok: true, labels: newLabels });
  } catch (err) {
    error(`Erro: ${err.message}`);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
