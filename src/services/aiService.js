
import OpenAI from 'openai';
import { getSettings } from './settingsService';

let _client = null;
let _cachedKey = null;

async function getClient() {
    // 1. Variável de ambiente local (desenvolvimento)
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    const key = envKey || await (async () => {
        if (_cachedKey) return _cachedKey;
        const s = await getSettings();
        _cachedKey = s.openai_api_key || null;
        return _cachedKey;
    })();

    if (!key) return null;

    if (!_client || _client.apiKey !== key) {
        _client = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
    }
    return _client;
}

/**
 * Gera uma descrição profissional para um produto usando GPT-4o-mini
 * @param {string} productTitle - Nome do produto
 * @param {string} category - Categoria do produto
 * @param {string} context - Contexto adicional (ex: cortes nobres, promoção, etc)
 * @returns {Promise<string>} - Descrição gerada
 */
export const generateProductDescription = async (productTitle, category = '', context = '') => {
    const openai = await getClient();
    if (!openai) {
        console.warn("OpenAI API Key não configurada.");
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
    const openai = await getClient();
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

/**
 * Envia uma mensagem para o agente BBQ Master com histórico completo da conversa.
 * @param {Array<{role: 'user'|'assistant', content: string}>} history
 * @param {string} systemPrompt
 * @returns {Promise<string>}
 */
export const chatBBQMaster = async (history, systemPrompt) => {
    const openai = await getClient();
    if (!openai) {
        throw new Error("OpenAI API Key não configurada.");
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.content })),
    ];

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.75,
        max_tokens: 300,
    });

    return response.choices[0].message.content.trim();
};

/**
 * Envia uma mensagem para o Assistente Google com histórico completo da conversa.
 * @param {Array<{role: 'user'|'assistant', content: string}>} history
 * @param {string} systemPrompt
 * @returns {Promise<string>}
 */
export const chatGoogleAssistant = async (history, systemPrompt) => {
    const openai = await getClient();
    if (!openai) {
        throw new Error("OpenAI API Key não configurada.");
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.content })),
    ];

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.65,
        max_tokens: 400,
    });

    return response.choices[0].message.content.trim();
};

/**
 * Gera 3 variações de mensagem para a Central de Comunicações.
 * @param {'promocao'|'lembrete'|'transacional'|'geral'|'sistema'} tipo
 * @param {string} contexto — detalhes livres (produto, preço, motivo…)
 * @returns {Promise<Array<{titulo:string, conteudo:string}>|null>}
 */
export const generateComunicacaoMessages = async (tipo, contexto) => {
    const openai = await getClient();
    if (!openai) {
        console.warn('[generateComunicacaoMessages] OpenAI não configurada.');
        return null;
    }

    const TIPO_LABEL = {
        promocao:     'Promoção / Oferta relâmpago',
        lembrete:     'Lembrete de recompra / fidelização',
        transacional: 'Notificação transacional (status de pedido)',
        geral:        'Comunicado geral / novidade da loja',
        sistema:      'Aviso interno do sistema',
    };

    const systemPrompt = `Você é especialista em marketing digital para açougues e boutiques de carne premium com mais de 15 anos de experiência.
Seu tom é amigável, direto, persuasivo e com leve informalidade brasileira.
Use emojis relevantes (🥩🔥✅🎉🔔 etc.) quando apropriado para o tipo.

REGRAS OBRIGATÓRIAS:
- Título: máximo 60 caracteres
- Mensagem (conteudo): máximo 200 caracteres
- Tom condizente com o tipo de comunicação
- Gere EXATAMENTE 3 variações distintas
- Retorne SOMENTE um array JSON válido: [{"titulo":"...","conteudo":"..."},{"titulo":"...","conteudo":"..."},{"titulo":"...","conteudo":"..."}]
- Sem markdown, sem explicações, apenas o JSON puro`;

    const userPrompt = `Tipo: ${TIPO_LABEL[tipo] || tipo}
Contexto/Detalhes: ${contexto?.trim() || 'Açougue de carnes premium Wilson Distribuidora'}

Gere 3 mensagens persuasivas para este contexto.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user',   content: userPrompt   },
            ],
            temperature: 0.82,
            max_tokens:  500,
        });

        const raw = response.choices[0].message.content.trim();
        // Extrai JSON mesmo que venha com ```json``` wrap
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('Resposta sem JSON válido');
        return JSON.parse(jsonMatch[0]);
    } catch (err) {
        console.error('[generateComunicacaoMessages]', err);
        return null;
    }
};

export default {
    generateProductDescription,
    generateBannerImage,
    chatBBQMaster,
    chatGoogleAssistant,
    generateComunicacaoMessages,
};
