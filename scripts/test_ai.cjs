const axios = require('axios');

async function testBBQMaster() {
    console.log("--- TESTANDO PROXY DO MESTRE DO CHURRASCO ---");
    console.log("Endpoint: http://localhost:3000/api/bbq-master");
    
    const payload = {
        systemPrompt: "Você é o Mestre do Churrasco. Responda de forma curta e amigável.",
        messages: [
            { role: "user", content: "Olá, você está funcionando?" }
        ]
    };

    try {
        const response = await axios.post('http://localhost:3000/api/bbq-master', payload);
        console.log("\n✅ SUCESSO!");
        console.log("Resposta da IA:", response.data.choices[0].message.content);
        console.log("\nID da Requisição:", response.data.id);
    } catch (error) {
        console.log("\n❌ FALHA NO TESTE");
        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Dados do Erro:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.log("Mensagem de Erro:", error.message);
        }
    }
}

testBBQMaster();
