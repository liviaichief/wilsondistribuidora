
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
 * @param {string} context - Contexto adicional (ex: cortes nobres, promoção, etc)
 * @returns {Promise<string>} - Descrição gerada
 */
export const generateProductDescription = async (productTitle, category = '', context = '') => {
    if (!openai) {
        console.warn("OpenAI API Key não configurada. A geração de descrição está desativada.");
        return "Geração de descrição indisponível no momento.";
    }

    try {
        const prompt = `Você é um especialista em marketing gastronômico para a Wilson Distribuidora, uma distribuidora de carnes premium. 
        Gere uma descrição curta, apetitosa e persuasiva para o produto: "${productTitle}"${category ? ` da categoria ${category}` : ''}. 
        ${context ? `Contexto adicional para destacar: ${context}` : ''}
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

/**
 * Gera uma imagem de banner usando DALL-E 3
 * @param {string} context - O que deve aparecer na imagem
 * @param {File} referenceImage - Imagem opcional para servir de modelo visual
 * @returns {Promise<string>} - URL da imagem gerada (temporária da OpenAI)
 */
export const generateBannerImage = async (context, referenceImage = null) => {
    if (!openai) {
        throw new Error("OpenAI API Key não configurada.");
    }

    try {
        let referenceStyle = '';

        // Se houver imagem de referência, usamos GPT-4o Vision para descrever o estilo
        if (referenceImage) {
            try {
                // Converter arquivo para base64
                const base64Image = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(referenceImage);
                });

                const visionResponse = await openai.chat.completions.create({
                    model: "gpt-4o-mini", // gpt-4o-mini suporta vision e é mais rápido/barato
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Descreva detalhadamente o estilo visual, iluminação, cores e composição desta imagem para que eu possa replicar em um novo banner. Foque no ambiente e na estética." },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:image/jpeg;base64,${base64Image}`
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 300
                });

                referenceStyle = visionResponse.choices[0].message.content;
                console.log("Estilo de referência detectado:", referenceStyle);
            } catch (visionError) {
                console.warn("Erro ao analisar imagem de referência:", visionError);
                // Continua sem o estilo se falhar
            }
        }

        const prompt = `Professional high-end food advertisement banner for Wilson Distribuidora. 
        Main Subject: ${context}. 
        ${referenceStyle ? `Visual Style Reference (follow this aesthetic): ${referenceStyle}` : 'Atmosphere: Luxury butcher shop, warm cinematic lighting, dark elegant background.'}
        Technical Details: 8k resolution, food photography style, succulent and appetizing. 
        Important: DO NOT include any text, letters, or numbers in the image. Just the scene.`;

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "hd"
        });

        return response.data[0].url;
    } catch (error) {
        console.error("Erro ao gerar imagem com IA:", error);
        throw error;
    }
};

export default {
    generateProductDescription,
    generateBannerImage
};
