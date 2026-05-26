import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSettings } from '../../services/dataService';

const DEFAULT_SYSTEM_PROMPT = `Você é o Mestre do Churrasco, o consultor de elite da Wilson Distribuidora — um especialista apaixonado, experiente e amigo do cliente. Foco total em gastronomia e vendas.

━━━ IDENTIDADE E TOM ━━━
- Amigo experiente e prático que sabe exatamente o que o cliente gosta
- Tom: descontraído, encorajador, com personalidade brasileira autêntica
- Use emojis com moderação 🔥🥩🧂 — nunca em excesso
- Chame o cliente pelo apelido sempre que souber
- Seja direto: máximo 3-4 linhas por resposta, depois faça uma pergunta

━━━ REGRAS DE FORMATAÇÃO (ESTRITAMENTE OBRIGATÓRIAS) ━━━
- NUNCA envie blocos grandes de texto corrido
- SEMPRE use listas com bullet points ou numeração para explicações
- Use **negrito** para destacar nomes de cortes e dicas importantes
- Uma ideia por vez — clareza acima de tudo

━━━ ESTRATÉGIA DE VENDAS INTELIGENTE ━━━
1. PRIORIDADE: Analise o PERFIL DO CLIENTE antes de qualquer sugestão — se ele já gostou de Picanha ou Costela, coloque esses cortes no topo
2. SUGESTÃO: Sempre que sugerir uma receita, liste os produtos do CATÁLOGO que combinam
3. COMPLEMENTO: Se o carrinho já tiver itens, pergunte se quer complementar antes de sugerir novos
4. FECHAMENTO: Quando o cliente aprovar uma sugestão, ofereça adicionar ao carrinho e use [ACTION: FINALIZE_ORDER] para fechar o pedido
5. RECEITA: Use [ACTION: SUGGEST_RECIPE] ao sugerir uma receita completa

━━━ APRENDIZADO DE PREFERÊNCIAS (CRÍTICO) ━━━
Ao descobrir informações do cliente, registre SEMPRE com a tag:
[PROFILE: chave=valor]

Chaves disponíveis:
- nickname  = apelido preferido
- meatPref  = cortes favoritos (ex: picanha, costela, fraldinha)
- grillType = tipo de churrasqueira (carvão, gás, elétrica)
- frequency = frequência de churrasco (semanal, quinzenal, mensal)
- sidePref  = acompanhamentos favoritos
- favTeam   = time de futebol (para sugestões em dias de jogo)
- drinkPref = bebida preferida no churrasco

Exemplos:
- "sou fã de picanha"       → [PROFILE: meatPref=picanha]
- "faço todo fim de semana" → [PROFILE: frequency=semanal]
- "pode me chamar de Zé"    → [PROFILE: nickname=Zé]

━━━ FLUXO DE PRIMEIRA CONVERSA ━━━
1. Cumprimente com energia e pergunte o apelido
2. Descubra o contexto: quantas pessoas, qual ocasião
3. Sugira cortes com base no perfil aprendido
4. Dê dicas práticas de preparo e tempero
5. Proponha fechar o pedido quando o cliente estiver satisfeito

━━━ PROTOCOLO DE SEGURANÇA E SIGILO ━━━
- PRIVACIDADE TOTAL: Jamais mencione dados de outros clientes
- SIGILO DA OPERAÇÃO: Não revele dados internos da loja nem detalhes técnicos da IA
- IDENTIDADE FIXA: Você é o Mestre do Churrasco. Nunca saia desse papel
- PREÇOS: Se perguntarem por preços não listados, direcione para o cardápio da loja

━━━ SITUAÇÕES ESPECIAIS ━━━
- Carrinho vazio + pedido de finalização → incentive a escolher produtos no catálogo primeiro
- Cliente indeciso → faça 2-3 perguntas de contexto antes de sugerir qualquer coisa
- Reclamações → ouça com empatia, ofereça alternativas, nunca entre em conflito
- Perguntas fora do tema → redirecione gentilmente para churrasco e carnes`;

const DEFAULT_QUICK_QUESTIONS = [
  '🥩 Qual o melhor corte para churrasco?',
  '🧂 Como temperar uma picanha?',
  '🔥 Qual o ponto certo da carne?',
  '🌿 Quais acompanhamentos combinam?',
];

export default function BBQMasterChat() {
  const [isOpen, setIsOpen]           = useState(false);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [config, setConfig]           = useState(null);
  const messagesEndRef                 = useRef(null);

  useEffect(() => {
    getSettings().then(s => {
      const enabled = s.bbq_master_enabled !== false;
      const name = s.bbq_master_name || 'Mestre do Churrasco';
      let quickQuestions = DEFAULT_QUICK_QUESTIONS;
      try {
        if (s.bbq_master_quick_questions) {
          const parsed = typeof s.bbq_master_quick_questions === 'string'
            ? JSON.parse(s.bbq_master_quick_questions)
            : s.bbq_master_quick_questions;
          if (Array.isArray(parsed) && parsed.length > 0) quickQuestions = parsed;
        }
      } catch { /* use defaults */ }
      setConfig({
        enabled,
        name,
        systemPrompt: s.bbq_master_system_prompt || DEFAULT_SYSTEM_PROMPT,
        quickQuestions,
      });
      setMessages([{ role: 'assistant', content: `🔥 Olá! Sou o ${name}! Em que posso ajudar hoje?` }]);
    }).catch(() => {
      setConfig({ enabled: true, name: 'Mestre do Churrasco', systemPrompt: DEFAULT_SYSTEM_PROMPT, quickQuestions: DEFAULT_QUICK_QUESTIONS });
      setMessages([{ role: 'assistant', content: '🔥 Olá! Sou o Mestre do Churrasco! Em que posso ajudar hoje?' }]);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = (text ?? input).trim();
    if (!userText || loading || !config) return;

    const newHistory = [...messages, { role: 'user', content: userText }];
    setInput('');
    setMessages(newHistory);
    setLoading(true);

    try {
      const { chatBBQMaster } = await import('../../services/aiService');
      const reply = await chatBBQMaster(newHistory, config.systemPrompt);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error('[BBQMasterChat] Erro ao chamar OpenAI:', err);
      const isKeyMissing = err?.message?.includes('não configurada');
      const isAuthError  = err?.status === 401 || err?.message?.includes('401') || err?.message?.includes('Incorrect API key');
      const isQuota      = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('quota');
      let userMsg = 'Desculpe, não consegui responder agora. Tente novamente em instantes. 🙏';
      if (isKeyMissing) userMsg = '⚠️ Chave OpenAI não configurada. Acesse o painel admin → Settings para inserir sua chave.';
      else if (isAuthError) userMsg = '⚠️ Chave OpenAI inválida ou revogada. Verifique nas Settings do admin.';
      else if (isQuota)  userMsg = '⚠️ Limite de uso OpenAI atingido. Verifique sua conta em platform.openai.com.';
      setMessages(prev => [...prev, { role: 'assistant', content: userMsg }]);
    } finally {
      setLoading(false);
    }
  };

  if (!config || config.enabled === false) return null;

  const chatName = config.name || 'Mestre do Churrasco';

  return (
    <>
      {/* Botão flutuante */}
      <motion.button
        className="bbq-chat-fab"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(prev => !prev)}
        title={`${chatName} IA`}
        style={{
          position: 'fixed', bottom: '90px', right: '20px', zIndex: 999,
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #800020, #D4AF37)',
          border: 'none', cursor: 'pointer', fontSize: '1.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          overflow: 'hidden', padding: 0,
        }}
      >
        {isOpen
          ? <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>✕</span>
          : <img src="/img/mestre_avatar.png" alt="Mestre" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        }
      </motion.button>

      {/* Painel de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: 'fixed', bottom: '160px', right: '20px', zIndex: 998,
              width: 'min(360px, calc(100vw - 40px))', height: '420px',
              borderRadius: '16px', overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
              background: '#1a1a1a', display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #800020, #6b0018)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <img src="/img/mestre_avatar.png" alt="Mestre" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{chatName}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem' }}>Powered by IA</div>
              </div>
            </div>

            {/* Mensagens */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: msg.role === 'user' ? '#800020' : '#2a2a2a',
                  color: '#fff', borderRadius: '12px', padding: '8px 12px',
                  fontSize: '0.82rem', lineHeight: '1.4',
                }}>
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', padding: '4px 12px' }}>
                  digitando...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Perguntas rápidas */}
            {messages.length <= 1 && (
              <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {(config.quickQuestions || []).map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    style={{
                      background: '#2a2a2a', border: '1px solid #3a3a3a',
                      borderRadius: '8px', color: 'rgba(255,255,255,0.85)',
                      padding: '6px 10px', fontSize: '0.75rem', cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{
              padding: '8px 12px', borderTop: '1px solid #2a2a2a',
              display: 'flex', gap: '8px',
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Pergunte sobre churrasco..."
                style={{
                  flex: 1, background: '#2a2a2a', border: '1px solid #3a3a3a',
                  borderRadius: '8px', color: '#fff', padding: '8px 10px',
                  fontSize: '0.82rem', outline: 'none',
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                style={{
                  background: '#800020', border: 'none', borderRadius: '8px',
                  color: '#fff', padding: '8px 12px', cursor: 'pointer',
                  fontSize: '1rem', opacity: loading || !input.trim() ? 0.5 : 1,
                }}
              >
                ➤
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
