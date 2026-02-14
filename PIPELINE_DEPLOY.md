# Esteira de Deploy Automatizada (CI/CD) - Boutique de Carnes

Este documento explica como funciona a **Esteira de Deploy (Pipeline)** que configuramos para o seu projeto. O objetivo é que toda vez que você atualizar o código, o site em produção seja atualizado automaticamente.

## O Que é a Esteira?
Uma esteira de deploy é o processo automático que leva o seu código do seu computador até o servidor onde o cliente acessa.

**Fluxo da Esteira:**
1. 💻 **Dev (Você):** Faz alterações no código e testa localmente (`npm run dev`).
2. 📦 **Git (Versionamento):** Você salva as alterações (`git commit`) e envia para a nuvem (`git push`).
3. 🚀 **Vercel (Build & Deploy):** A Vercel detecta a mudança no Git, baixa o código, constrói o site (`npm run build`) e, se tudo der certo, publica a nova versão.

---

## Passo 1: Preparar o Repositório (Git)
Se você ainda não enviou seu código para o GitHub, faça isso agora.

1. Crie um novo repositório no [GitHub](https://github.com/new).
2. No seu terminal, envie o código:
```bash
# Se ainda não iniciou o git:
git init
git add .
git commit -m "Configuração inicial da esteira de deploy"
git branch -M main
# Substitua SEU_USUARIO e SEU_REPO pelos seus dados:
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

---

## Passo 2: Conectar à Vercel (O Motor da Esteira)
A Vercel será responsável por observar o GitHub e fazer o deploy.

1. Acesse [vercel.com](https://vercel.com) e faça login com seu GitHub.
2. Clique em **"Add New..."** -> **"Project"**.
3. Selecione o repositório `boutiquecarne` que você acabou de criar.
4. Clique em **"Import"**.

---

## Passo 3: Configurar Variáveis de Ambiente (O Combustível)
Para que o site funcione em produção, ele precisa saber onde está o banco de dados (Supabase).

1. Na tela de configuração do projeto na Vercel, procure a seção **"Environment Variables"**.
2. Adicione as mesmas variáveis que estão no seu arquivo `.env` local:

| Nome | Valor (Exemplo) |
|------|-----------------|
| `VITE_SUPABASE_URL` | `https://ofpqtmiyuffmfgeoocml.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sua_chave_anonima_gigante...` |
| `VITE_WHATSAPP_NUMBER` | `5511999999999` |
| `VITE_APPWRITE_ENDPOINT` | `https://sfo.cloud.appwrite.io/v1` |
| `VITE_APPWRITE_PROJECT_ID` | `698e695d001d446b21d9` |

3. Clique em **"Deploy"**.

---

## Passo 4: Como Validar?
Assim que o deploy terminar, a Vercel vai te dar um link (ex: `boutiquecarne.vercel.app`).
1. Acesse o link.
2. Verifique se os produtos do Supabase carregaram.
3. Teste o fluxo de compra.

---

## Manutenção da Esteira
A partir de agora, **você não precisa fazer mais nada na Vercel**.
Sempre que quiser atualizar o site:
1. Altere o código no VS Code.
2. Rode:
   ```bash
   git add .
   git commit -m "Melhoria no carrinho de compras"
   git push
   ```
3. A Vercel fará todo o resto sozinha! 

Se algo der errado, você receberá um email de aviso e poderá ver os logs no painel da Vercel.
