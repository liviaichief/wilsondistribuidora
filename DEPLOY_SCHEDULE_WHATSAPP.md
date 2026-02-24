# Configuração do Agendamento Diário (Aniversários e WhatsApp)

A rotina de envio diário pontual não roda no seu site (React), pois o site fica "fechado" quando não tem ninguém usando. Ela foi desenvolvida para rodar diretamente no motor do **Appwrite** (Backend) todos os dias religiosamente às 08:00h da manhã.

Criei o código da função e ele se encontra na pasta `functions/birthday_job/`.

### Como ativar essa rotina:

#### 1. Crie a Função no Console do Appwrite
1. Acesse o painel web do seu Appwrite.
2. Vá em **Functions** > **Create Function**.
3. Escolha **Node.js (18.0 ou superior)**.
4. Nomeie como **"Rotina de Aniversários"** (birthday_job).
5. Nos arquivos de código (Settings > Build Settings), cole o código do arquivo `functions/birthday_job/src/main.js` que eu acabei de criar. O Entrypoint (arquivo de entrada) deve ser o `src/main.js`.
6. Adicione no painel as seguintes variáveis (Environment Variables) da função:
   - `DATABASE_ID` (valor: boutique_carne_db)
   - `APPWRITE_API_KEY` (Sua master key já configurada para os utilitários da loja)
   - `STORE_WHATSAPP` (O número de telefone da sua loja. EX: 5511944835865)

#### 2. Agendar a Rotina (O "Relógio")
1. Dentro dessa mesma função, vá em **Settings**.
2. Procure pela opção **Schedule** (ou Cron).
3. Insira exatamente a seguinte expressão para rodar **todo dia às 08:00h**:
   `0 8 * * *`
4. Salve. 

#### 3. O Detalhe Importante sobre o WhatsApp ⚠️
O código já localiza no banco de dados quem faz aniversário, gera a mensagem personalizada salvada no painel que acabamos de mexer juntos, faz o log e dispara um "evento de envio".

No entanto, sistemas como React ou Node.js **não têm o poder de abrir o aplicativo WhatsApp e digitar sozinhos sem o dono saber**. Eles precisam de uma "API Oficial ou Não Oficial" conectada a um celular hospedeiro. 

Para que os e-mails/mensagens saiam verdadeiramente do sistema para a caixa do cliente sem que você precise apertar o botão manual, a Boutique **precisará assinar/instalar uma API de WhatsApp**, como:
*   [Z-API](https://z-api.io/) (Nacional, excelente)
*   [Evolution API](https://evolution-api.com/) (Gratuita se tiver programador para rodar numa VPS)
*   [Z-PRO](https://zpro.com.br/)

Quando você criar a conta em uma dessas ferramentas, basta jogar o `Token da Instância` dentro das variáveis no arquivo `main.js` criado (a área está sinalizada com comentários) e seus clientes e o seu número pessoal começarão a receber as mensagens "invisivelmente" vindas do sistema todo dia de manhã. 

Atualmente (enquanto você não fecha com uma destas APIs), o sistema continuará mostrando os aniversariantes perfeitamente na sua tela do **Painel de Dashboard** e fornecerá aquele botão verde para você, dono do negócio, enviar manualmente com 1-clique pelo seu próprio celular sem custos.
