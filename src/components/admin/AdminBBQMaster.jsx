import React, { useState } from 'react';
import { Save, Loader2, RotateCcw, Bot, MessageSquare, Zap, Eye } from 'lucide-react';
import { updateSettings } from '../../services/dataService';
import { useAlert } from '../../context/AlertContext';

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

const inputStyle = {
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '14px',
  padding: '14px 16px',
  color: '#fff',
  width: '100%',
  boxSizing: 'border-box',
  fontSize: '0.88rem',
  outline: 'none',
  fontFamily: 'Inter, system-ui, sans-serif',
};

export default function AdminBBQMaster({ settings, setSettings, originalSettings }) {
  const [saving, setSaving]           = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { showAlert }                 = useAlert();

  const isDirty = () => {
    const keys = ['bbq_master_enabled', 'bbq_master_name', 'bbq_master_system_prompt', 'bbq_master_quick_questions'];
    return keys.some(k => String(settings[k] ?? '') !== String(originalSettings[k] ?? ''));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSettings('bbq_master_enabled',        settings.bbq_master_enabled ?? true),
        updateSettings('bbq_master_name',           settings.bbq_master_name || 'Mestre do Churrasco'),
        updateSettings('bbq_master_system_prompt',  settings.bbq_master_system_prompt || DEFAULT_SYSTEM_PROMPT),
        updateSettings('bbq_master_quick_questions', settings.bbq_master_quick_questions || JSON.stringify(DEFAULT_QUICK_QUESTIONS)),
      ]);
      showAlert('Mestre do Churrasco salvo com sucesso!', 'success', null, 3000);
    } catch {
      showAlert('Erro ao salvar configurações.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getQuickQuestions = () => {
    try {
      const raw = settings.bbq_master_quick_questions;
      if (!raw) return DEFAULT_QUICK_QUESTIONS;
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return DEFAULT_QUICK_QUESTIONS;
    }
  };

  const setQuickQuestions = (arr) => {
    setSettings(prev => ({ ...prev, bbq_master_quick_questions: JSON.stringify(arr) }));
  };

  const questions = getQuickQuestions();

  const Toggle = ({ field, label, description }) => {
    const on = settings[field] !== false;
    return (
      <label style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', padding: '18px 20px',
        background: on ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${on ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: '16px', transition: 'all 0.3s',
      }}>
        <div>
          <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem', marginBottom: '3px' }}>{label}</div>
          {description && <div style={{ fontSize: '0.73rem', color: '#555' }}>{description}</div>}
        </div>
        <div style={{ position: 'relative', width: '52px', height: '28px', flexShrink: 0 }}>
          <input type="checkbox" checked={on}
            onChange={e => setSettings(prev => ({ ...prev, [field]: e.target.checked }))}
            style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: on ? '#D4AF37' : '#333',
            borderRadius: '28px', cursor: 'pointer', transition: 'all 0.3s', pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute', top: '4px',
              left: on ? '28px' : '4px',
              width: '20px', height: '20px',
              background: '#fff', borderRadius: '50%',
              transition: 'left 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
            }} />
          </div>
        </div>
      </label>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header com status e actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'rgba(212,175,55,0.12)', padding: '10px', borderRadius: '12px', color: '#D4AF37', display: 'flex' }}>
            <Bot size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 900, color: '#fff', fontSize: '1rem' }}>Mestre do Churrasco IA</div>
            <div style={{ fontSize: '0.72rem', color: '#555' }}>Chat flutuante com IA especializada em churrasco</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setPreviewOpen(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 16px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#aaa', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
            }}
          >
            <Eye size={14} /> PREVIEW
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 18px', borderRadius: '12px',
              background: isDirty() ? '#D4AF37' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: isDirty() ? '#000' : '#444',
              cursor: isDirty() ? 'pointer' : 'not-allowed',
              fontSize: '0.78rem', fontWeight: 900, transition: 'all 0.2s',
            }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'SALVANDO...' : 'SALVAR'}
          </button>
        </div>
      </div>

      {/* Toggle ativo */}
      <Toggle
        field="bbq_master_enabled"
        label="Ativar chat do Mestre do Churrasco"
        description="Exibe o botão flutuante 🔥 na loja para os clientes"
      />

      {/* Nome do assistente */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontWeight: 800, fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Nome do Assistente
        </label>
        <input
          value={settings.bbq_master_name || ''}
          onChange={e => setSettings(prev => ({ ...prev, bbq_master_name: e.target.value }))}
          placeholder="Mestre do Churrasco"
          style={inputStyle}
        />
      </div>

      {/* System Prompt */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontWeight: 800, fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Prompt de Personalidade (System Prompt)
          </label>
          <button
            onClick={() => setSettings(prev => ({ ...prev, bbq_master_system_prompt: DEFAULT_SYSTEM_PROMPT }))}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
          >
            <RotateCcw size={11} /> RESTAURAR PADRÃO
          </button>
        </div>
        <textarea
          value={settings.bbq_master_system_prompt || DEFAULT_SYSTEM_PROMPT}
          onChange={e => setSettings(prev => ({ ...prev, bbq_master_system_prompt: e.target.value }))}
          rows={6}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, minHeight: '130px' }}
        />
        <p style={{ margin: 0, fontSize: '0.7rem', color: '#444', lineHeight: 1.5 }}>
          Define a personalidade e as regras do assistente. Mantenha o tom amigável e focado em churrasco.
        </p>
      </div>

      {/* Perguntas Rápidas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontWeight: 800, fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Zap size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Perguntas Rápidas ({questions.length}/6)
          </label>
          {questions.length < 6 && (
            <button
              onClick={() => setQuickQuestions([...questions, ''])}
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '8px', color: '#D4AF37', padding: '4px 10px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
            >
              + Adicionar
            </button>
          )}
        </div>
        {questions.map((q, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px' }}>
            <input
              value={q}
              onChange={e => {
                const updated = [...questions];
                updated[i] = e.target.value;
                setQuickQuestions(updated);
              }}
              placeholder={`Pergunta ${i + 1}`}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={() => setQuickQuestions(questions.filter((_, j) => j !== i))}
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#ef4444', padding: '0 12px', cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0 }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => setQuickQuestions(DEFAULT_QUICK_QUESTIONS)}
          style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, padding: '4px 0' }}
        >
          <RotateCcw size={11} /> Restaurar perguntas padrão
        </button>
      </div>

      {/* Preview do chat */}
      {previewOpen && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontWeight: 800, color: '#888', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={13} /> Preview do Chat
          </div>
          <div style={{
            background: '#1a1a1a', borderRadius: '16px', overflow: 'hidden',
            width: '280px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          }}>
            <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #800020, #6b0018)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>🔥</span>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                  {settings.bbq_master_name || 'Mestre do Churrasco'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.68rem' }}>Powered by IA</div>
              </div>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ alignSelf: 'flex-start', background: '#2a2a2a', color: '#fff', borderRadius: '12px', padding: '8px 12px', fontSize: '0.78rem', maxWidth: '85%' }}>
                🔥 Olá! Sou o {settings.bbq_master_name || 'Mestre do Churrasco'}! Em que posso ajudar?
              </div>
              {questions.slice(0, 3).map((q, i) => (
                <div key={i} style={{ background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '8px', color: 'rgba(255,255,255,0.8)', padding: '5px 9px', fontSize: '0.7rem' }}>
                  {q || `Pergunta ${i + 1}`}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
