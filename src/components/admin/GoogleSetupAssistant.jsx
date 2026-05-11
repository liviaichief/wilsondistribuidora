import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, RotateCcw, ChevronRight } from 'lucide-react';
import { getSettings, updateSettings } from '../../services/settingsService';

const SETUP_STEPS = [
  { id: 'gbp',      label: 'Google Meu Negócio',   icon: '📍' },
  { id: 'merchant', label: 'Merchant Center',       icon: '🛒' },
  { id: 'maps',     label: 'Google Maps API',       icon: '🗺️' },
  { id: 'seo',      label: 'SEO Local',             icon: '🔍' },
  { id: 'posts',    label: 'Posts e Eventos',       icon: '📢' },
  { id: 'catalog',  label: 'Catálogo de Produtos',  icon: '📦' },
];

const SYSTEM_PROMPT = `Você é o Assistente Google da Wilson Distribuidora, um especialista amigável e didático em configuração de presença digital no Google para pequenos negócios de alimentação e açougues.

Seu objetivo é guiar o proprietário passo a passo pela configuração completa das ferramentas Google:
1. Google Meu Negócio (Google Business Profile) — criação, verificação e otimização
2. Google Merchant Center — cadastro e envio do catálogo de produtos
3. Google Maps API — integração para cálculo de frete no sistema
4. SEO Local — otimização da ficha para aparecer nas buscas locais
5. Posts e Eventos — como criar posts promocionais e anunciar promoções
6. Catálogo de Produtos — como vincular produtos do sistema ao Google

Regras de conduta:
- Faça UMA pergunta de cada vez, de forma clara e objetiva
- Use linguagem simples, sem jargão técnico excessivo
- Dê exemplos práticos para açougues e distribuidoras de carnes
- Quando precisar dar instruções, numere os passos claramente
- Pergunte sempre se o usuário completou o passo antes de avançar
- Seja encorajador — diga "ótimo!", "perfeito!", "muito bem!" quando o usuário completar algo
- Use emojis moderadamente para tornar a conversa mais amigável
- Se não conseguir executar algo automaticamente, dê instruções exatas de onde clicar

Comece perguntando o nome do estabelecimento e se já tem uma conta Google associada ao negócio.`;

const QUICK_ACTIONS = [
  'Vamos começar do zero',
  'Já tenho conta no Google Meu Negócio',
  'Preciso verificar minha ficha',
  'Quero configurar o Merchant Center',
];

export default function GoogleSetupAssistant() {
  const [isOpen, setIsOpen]         = useState(false);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef              = useRef(null);

  // Load persisted conversation history from Appwrite
  useEffect(() => {
    getSettings().then(s => {
      try {
        const saved = s.google_assistant_history;
        if (saved) {
          const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            setHistoryLoaded(true);
            return;
          }
        }
      } catch { /* start fresh */ }
      setMessages([{
        role: 'assistant',
        content: '👋 Olá! Sou o **Assistente Google**, aqui para te ajudar a configurar a presença digital do seu negócio no Google.\n\nVamos trabalhar juntos em 6 etapas: desde o Google Meu Negócio até o catálogo de produtos. Cada etapa vai aumentar a visibilidade da sua loja online!\n\nPrimeiro, me conta: qual é o **nome do seu estabelecimento** e você já tem uma **conta Google** vinculada ao negócio?',
      }]);
      setHistoryLoaded(true);
    }).catch(() => {
      setMessages([{
        role: 'assistant',
        content: '👋 Olá! Sou o **Assistente Google**. Vamos configurar sua presença no Google juntos!\n\nQual é o nome do seu estabelecimento?',
      }]);
      setHistoryLoaded(true);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const persistHistory = async (history) => {
    try {
      await updateSettings('google_assistant_history', JSON.stringify(history));
    } catch { /* non-blocking */ }
  };

  const sendMessage = async (text) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    const newHistory = [...messages, { role: 'user', content: userText }];
    setInput('');
    setMessages(newHistory);
    setLoading(true);

    try {
      const { chatGoogleAssistant } = await import('../../services/aiService');
      const reply = await chatGoogleAssistant(newHistory, SYSTEM_PROMPT);
      const updated = [...newHistory, { role: 'assistant', content: reply }];
      setMessages(updated);
      persistHistory(updated);

      // Advance step heuristic: detect keywords in the reply
      const replyLower = reply.toLowerCase();
      if (activeStep === 0 && (replyLower.includes('merchant') || replyLower.includes('próxima etapa'))) setActiveStep(1);
      else if (activeStep === 1 && replyLower.includes('maps api')) setActiveStep(2);
      else if (activeStep === 2 && replyLower.includes('seo')) setActiveStep(3);
      else if (activeStep === 3 && replyLower.includes('posts')) setActiveStep(4);
      else if (activeStep === 4 && replyLower.includes('catálogo')) setActiveStep(5);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Não consegui conectar agora. Verifique se a chave OpenAI está configurada em **Configurações → Integrações**.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const fresh = [{
      role: 'assistant',
      content: '👋 Conversa reiniciada! Qual é o nome do seu estabelecimento e você já tem uma conta Google vinculada ao negócio?',
    }];
    setMessages(fresh);
    setActiveStep(0);
    try { await updateSettings('google_assistant_history', JSON.stringify(fresh)); } catch { /* ok */ }
  };

  const showQuickActions = messages.length <= 1;

  return (
    <>
      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(prev => !prev)}
        title="Assistente Google"
        style={{
          position: 'fixed', bottom: '90px', right: '88px', zIndex: 1100,
          width: '56px', height: '56px', borderRadius: '50%',
          background: isOpen
            ? '#333'
            : 'linear-gradient(135deg, #4285F4 0%, #34A853 50%, #FBBC05 75%, #EA4335 100%)',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem',
        }}
      >
        {isOpen ? <X size={22} color="#fff" /> : 'G'}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: 'fixed', bottom: '160px', right: '20px', zIndex: 1099,
              width: 'min(420px, calc(100vw - 40px))', height: '520px',
              borderRadius: '16px', overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              background: '#141414', display: 'flex', flexDirection: 'column',
              border: '1px solid #2a2a2a',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              borderBottom: '1px solid #2a2a2a',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4285F4, #34A853)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, color: '#fff', fontSize: '0.9rem',
                  }}>G</div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>Assistente Google</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>Configuração de Presença Digital</div>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  title="Reiniciar conversa"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#666', padding: '4px' }}
                >
                  <RotateCcw size={15} />
                </button>
              </div>

              {/* Step progress */}
              <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
                {SETUP_STEPS.map((step, i) => (
                  <div
                    key={step.id}
                    title={step.label}
                    style={{
                      flex: 1, height: '4px', borderRadius: '2px',
                      background: i <= activeStep ? '#4285F4' : '#2a2a2a',
                      transition: 'background 0.4s',
                    }}
                  />
                ))}
              </div>
              <div style={{ color: '#4285F4', fontSize: '0.68rem', marginTop: '5px', fontWeight: 600 }}>
                {SETUP_STEPS[activeStep]?.icon} {SETUP_STEPS[activeStep]?.label}
                {activeStep < SETUP_STEPS.length - 1 && (
                  <span style={{ color: '#555' }}> → {SETUP_STEPS[activeStep + 1]?.label}</span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '14px 12px',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  background: msg.role === 'user' ? '#4285F4' : '#1e1e1e',
                  color: '#fff',
                  borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  padding: '9px 13px',
                  fontSize: '0.81rem', lineHeight: '1.5',
                  border: msg.role === 'assistant' ? '1px solid #2a2a2a' : 'none',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}
                </div>
              ))}
              {loading && (
                <div style={{
                  alignSelf: 'flex-start', display: 'flex', gap: '5px',
                  padding: '10px 14px', background: '#1e1e1e', borderRadius: '14px 14px 14px 2px',
                  border: '1px solid #2a2a2a',
                }}>
                  {[0, 1, 2].map(dot => (
                    <motion.div
                      key={dot}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.2 }}
                      style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4285F4' }}
                    />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick actions */}
            {showQuickActions && !loading && (
              <div style={{
                padding: '0 12px 8px',
                display: 'flex', flexDirection: 'column', gap: '4px',
                flexShrink: 0,
              }}>
                {QUICK_ACTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    style={{
                      background: '#1a1a1a', border: '1px solid #2a2a2a',
                      borderRadius: '8px', color: 'rgba(255,255,255,0.8)',
                      padding: '7px 10px', fontSize: '0.74rem',
                      cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                  >
                    <ChevronRight size={12} color="#4285F4" /> {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{
              padding: '8px 12px', borderTop: '1px solid #222',
              display: 'flex', gap: '8px', flexShrink: 0,
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Responda ou faça uma pergunta..."
                style={{
                  flex: 1, background: '#1e1e1e', border: '1px solid #2a2a2a',
                  borderRadius: '10px', color: '#fff', padding: '9px 12px',
                  fontSize: '0.82rem', outline: 'none',
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                style={{
                  background: '#4285F4', border: 'none', borderRadius: '10px',
                  color: '#fff', padding: '9px 13px', cursor: 'pointer',
                  opacity: loading || !input.trim() ? 0.45 : 1,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
