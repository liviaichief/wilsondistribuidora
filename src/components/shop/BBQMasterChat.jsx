import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSettings } from '../../services/dataService';

const DEFAULT_SYSTEM_PROMPT = `Você é o Mestre do Churrasco, um especialista amigável e apaixonado por churrasco brasileiro.
Ajude os clientes com dicas de cortes, temperos, ponto da carne, acompanhamentos e receitas.
Seja conciso, prático e use emojis para tornar a conversa divertida.
Se o cliente perguntar sobre preços ou disponibilidade, oriente-o a consultar o cardápio da loja.`;

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

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      const { generateProductDescription } = await import('../../services/aiService');
      const prompt = `${config.systemPrompt}\n\nCliente perguntou: "${userText}"\n\nResponda de forma curta e útil.`;
      const response = await generateProductDescription({ title: userText, description: '', prompt });

      setMessages(prev => [...prev, {
        role:    'assistant',
        content: response || 'Ótima pergunta! Para o melhor churrasco, a temperatura e a qualidade da carne são essenciais. 🥩🔥',
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: 'Desculpe, não consegui responder agora. Tente novamente! 🙏',
      }]);
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
        }}
      >
        {isOpen ? '✕' : '🔥'}
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
              <span style={{ fontSize: '1.4rem' }}>🔥</span>
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
