
# Esteira de Deploy com Vercel (CI/CD)

Para configurar a esteira de deploy automático, onde cada homologação (push) no repositório atualiza a produção, siga os passos abaixo:

## 1. Pré-requisitos
- Conta na [Vercel](https://vercel.com)
- Projeto hospedado no GitHub, GitLab ou Bitbucket

## 2. Configuração Inicial

1.  Acesse o dashboard da Vercel.
2.  Clique em **"Add New..."** -> **"Project"**.
3.  Selecione o repositório do Git onde está o código (`boutiquecarne`).
4.  Importe o projeto.

## 3. Configurações de Build
A Vercel deve detectar automaticamente que é um projeto Vite/React. Confirme:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 4. Variáveis de Ambiente
No painel de configuração do projeto na Vercel, vá em **Settings** -> **Environment Variables** e adicione:

- `VITE_SUPABASE_URL`: (Sua URL do Supabase)
- `VITE_SUPABASE_ANON_KEY`: (Sua chave Anon do Supabase)
- `VITE_WHATSAPP_NUMBER`: (Seu número formatado, ex: 5511999999999)
- `VITE_APPWRITE_ENDPOINT`: `https://sfo.cloud.appwrite.io/v1`
- `VITE_APPWRITE_PROJECT_ID`: `698e695d001d446b21d9`

## 5. Deploy Automático
Uma vez conectado, qualquer `git push` para a branch `main` (ou a que você escolheu) disparará um novo deploy automático.

### Testando a Esteira
1.  Faça alterações no código localmente.
2.  Commit e Push:
    ```bash
    git add .
    git commit -m "Melhorias no layout"
    git push origin main
    ```
3.  Acesse o dashboard da Vercel e veja o build iniciando.
4.  Após a conclusão, a URL de produção será atualizada.

## 6. Configuração de SPA (Single Page Application)
O arquivo `vercel.json` já foi criado na raiz do projeto para garantir que o roteamento flua corretamente para o `index.html` em todas as rotas.

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
