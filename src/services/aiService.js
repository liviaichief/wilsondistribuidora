
import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

const openai = apiKey ? new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Necessário para chamadas diretas do frontend
}) : null;

/**
 * Gera uma descrição profissional para um produto usando GPT-4o-mini
 * @param {string} productTitle - Nome do produto
 * @param {string} category - Categoria do produto
 * @returns {Promise<string>} - Descrição gerada
 */
export const generateProductDescription = async (productTitle, category = '') => {
    if (!openai) {
        console.warn("OpenAI API Key não configurada. A geração de descrição está desativada.");
        return "Geração de descrição indisponível no momento.";
    }

    try {
        const prompt = `Você é um especialista em marketing gastronômico para a Wilson Distribuidora, uma distribuidora de carnes premium. 
        Gere uma descrição curta, apetitosa e persuasiva para o produto: "${productTitle}"${category ? ` da categoria ${category}` : ''}.
        Destaque a qualidade, o frescor e a tradição da Wilson. 
        A descrição deve ter no máximo 3 frases.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Você é um assistente de marketing de uma distribuidora de carnes premium." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 150
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("Erro ao gerar descrição com IA:", error);
        return "Erro ao gerar descrição automática. Por favor, tente novamente.";
    }
};

export default {
    generateProductDescription
};
