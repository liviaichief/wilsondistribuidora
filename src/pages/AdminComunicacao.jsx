/**
 * AdminComunicacao — Central de Comunicações V2
 * 3 abas: Nova Campanha | Histórico | Templates
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Calendar, Bell, Flame, CheckCircle, FileText, Settings,
  Sparkles, Plus, Trash2, Edit3, Eye, X, RefreshCw, Filter,
  Clock, Users, Zap, ChevronRight, LayoutTemplate, History,
  Loader2, MailOpen,
} from 'lucide-react';
import { databases, functions, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { ID, Query } from 'appwrite';
import { generateComunicacaoMessages } from '../services/aiService';
import AnuncioPopup from '../components/shop/AnuncioPopup';

// ── Configuração dos 5 tipos ─────────────────────────────────────
const TIPOS = {
  promocao:     { label: 'Promoção',     icon: Flame,       cor: '#ef4444', emoji: '🔥', categoria: 'anuncio'          },
  lembrete:     { label: 'Lembrete',     icon: Bell,        cor: '#f59e0b', emoji: '🔔', categoria: 'anuncio'          },
  transacional: { label: 'Transacional', icon: CheckCircle, cor: '#22c55e', emoji: '✅', categoria: 'comunicado_geral' },
  geral:        { label: 'Geral',        icon: FileText,    cor: '#6366f1', emoji: '📋', categoria: 'comunicado_geral' },
  sistema:      { label: 'Sistema',      icon: Settings,    cor: '#71717a', emoji: '⚙️', categoria: 'comunicado_geral' },
};

const STATUS_META = {
  rascunho:    { label: 'Rascunho',    cor: '#555',    bg: '#55555520' },
  agendada:    { label: 'Agendada',    cor: '#f59e0b', bg: '#f59e0b20' },
  processando: { label: 'Processando', cor: '#3b82f6', bg: '#3b82f620' },
  enviada:     { label: 'Enviada',     cor: '#22c55e', bg: '#22c55e20' },
  falhada:     { label: 'Falhada',     cor: '#ef4444', bg: '#ef444420' },
};

const FUNC_ID = import.meta.env.VITE_FUNC_SEND_CAMPANHA || 'send-campanha';
const API_KEY = import.meta.env.VITE_APPWRITE_API_KEY   || '';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d;
  if (diff < 60000)    return 'agora mesmo';
  if (diff < 3600000)  return `há ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `há ${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function parseActions(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

// ── Componente principal ─────────────────────────────────────────
export default function AdminComunicacao() {
  const [aba, setAba] = useState('nova');

  // Form
  const [tipo,       setTipo]        = useState('promocao');
  const [titulo,     setTitulo]      = useState('');
  const [conteudo,   setConteudo]    = useState('');
  const [midiaUrl,   setMidiaUrl]    = useState('');
  const [actionsArr, setActionsArr]  = useState([]);
  const [segmento,   setSegmento]    = useState('todos');
  const [canal,      setCanal]       = useState('todos');
  const [agendado,   setAgendado]    = useState(false);
  const [agendadaPara, setAgendadaPara] = useState('');
  const [modoConteudo, setModoConteudo] = useState('escrever');

  // IA
  const [aiContexto,  setAiContexto]  = useState('');
  const [aiSugestoes, setAiSugestoes] = useState([]);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Preview
  const [previewData, setPreviewData] = useState(null);

  // Histórico
  const [historico,    setHistorico]   = useState([]);
  const [loadingHist,  setLoadingHist] = useState(false);
  const [filtroTipo,   setFiltroTipo]  = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  // Templates
  const [templates,     setTemplates]     = useState([]);
  const [loadingTpl,    setLoadingTpl]    = useState(false);
  const [filtroTipoTpl, setFiltroTipoTpl] = useState('');
  const [showTplModal,  setShowTplModal]  = useState(false);
  const [editingTpl,    setEditingTpl]    = useState(null);
  const [tplForm,       setTplForm]       = useState({ nome: '', tipo: 'promocao', titulo: '', conteudo: '' });
  const [savingTpl,     setSavingTpl]     = useState(false);

  // Envio
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // ── Loaders ──────────────────────────────────────────────────
  const carregarHistorico = useCallback(async () => {
    if (!DATABASE_ID || !COLLECTIONS.COMUNICACOES) return;
    setLoadingHist(true);
    try {
      const queries = [Query.orderDesc('$createdAt'), Query.limit(30)];
      if (filtroTipo)   queries.push(Query.equal('tipo',   filtroTipo));
      if (filtroStatus) queries.push(Query.equal('status', filtroStatus));
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.COMUNICACOES, queries);
      setHistorico(res.documents || []);
    } catch (err) { console.warn('[AdminComunicacao] Histórico:', err.message); }
    finally { setLoadingHist(false); }
  }, [filtroTipo, filtroStatus]);

  const carregarTemplates = useCallback(async () => {
    if (!DATABASE_ID || !COLLECTIONS.TEMPLATES_MENSAGENS) return;
    setLoadingTpl(true);
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TEMPLATES_MENSAGENS,
        [Query.orderAsc('ordem'), Query.limit(50)]);
      setTemplates(res.documents || []);
    } catch (err) { console.warn('[AdminComunicacao] Templates:', err.message); }
    finally { setLoadingTpl(false); }
  }, []);

  useEffect(() => { if (aba === 'historico') carregarHistorico(); }, [aba, carregarHistorico]);
  useEffect(() => { if (aba === 'templates' || aba === 'nova') carregarTemplates(); }, [aba, carregarTemplates]);

  // ── Helpers ───────────────────────────────────────────────────
  const resetForm = () => {
    setTitulo(''); setConteudo(''); setMidiaUrl(''); setActionsArr([]);
    setSegmento('todos'); setCanal('todos'); setAgendado(false); setAgendadaPara('');
    setModoConteudo('escrever');
  };

  const showFeedback = (t, msg) => { setFeedback({ t, msg }); setTimeout(() => setFeedback(null), 6000); };

  const tipoAtual = TIPOS[tipo] || TIPOS.promocao;

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
    color: '#fff', padding: '10px 14px', fontSize: '0.85rem',
    outline: 'none', resize: 'none', boxSizing: 'border-box',
  };

  // ── IA ────────────────────────────────────────────────────────
  const gerarComAI = async () => {
    setAiLoading(true); setAiSugestoes([]);
    try {
      const sugs = await generateComunicacaoMessages(tipo, aiContexto);
      if (sugs?.length) setAiSugestoes(sugs);
      else showFeedback('erro', 'Não foi possível gerar sugestões. Verifique a chave OpenAI.');
    } catch (err) { showFeedback('erro', err.message); }
    finally { setAiLoading(false); }
  };

  const usarSugestao = (sug) => {
    setTitulo(sug.titulo || ''); setConteudo(sug.conteudo || '');
    setShowAiModal(false); setModoConteudo('escrever');
  };

  // ── Quick Actions ─────────────────────────────────────────────
  const addAction = () => { if (actionsArr.length < 3) setActionsArr(p => [...p, { label: '', url: '/' }]); };
  const updateAction = (i, f, v) => setActionsArr(p => p.map((a, idx) => idx === i ? { ...a, [f]: v } : a));
  const removeAction = (i) => setActionsArr(p => p.filter((_, idx) => idx !== i));

  // ── Usar template ─────────────────────────────────────────────
  const usarTemplate = (tpl) => {
    setTitulo(tpl.titulo || ''); setConteudo(tpl.conteudo || '');
    setActionsArr(parseActions(tpl.actions)); setTipo(tpl.tipo || 'geral');
    setModoConteudo('escrever'); setAba('nova');
  };

  // ── Enviar / Agendar ──────────────────────────────────────────
  const enviarOuAgendar = async () => {
    if (!titulo.trim() || !conteudo.trim()) return showFeedback('erro', 'Título e mensagem são obrigatórios.');
    if (agendado && !agendadaPara) return showFeedback('erro', 'Defina a data/hora de envio.');

    setEnviando(true);
    try {
      const actionsJson = actionsArr.filter(a => a.label.trim()).length > 0
        ? JSON.stringify(actionsArr.filter(a => a.label.trim())) : null;

      if (agendado) {
        await databases.createDocument(DATABASE_ID, COLLECTIONS.COMUNICACOES, ID.unique(), {
          tipo, titulo, conteudo, midia_url: midiaUrl || null,
          actions: actionsJson, segmento, canal,
          agendada_para: new Date(agendadaPara).toISOString(), status: 'agendada',
        });
        showFeedback('ok', `Campanha agendada para ${new Date(agendadaPara).toLocaleString('pt-BR')}!`);
      } else {
        const payload = JSON.stringify({ titulo, conteudo, tipo, midia_url: midiaUrl || undefined, actions: actionsJson, canal, apiKey: API_KEY });
        const exec = await functions.createExecution(FUNC_ID, payload, false);
        const body = typeof exec.responseBody === 'string' ? JSON.parse(exec.responseBody || '{}') : (exec.responseBody || {});
        if (!body.ok) throw new Error(body.error || 'Erro na function');

        await databases.createDocument(DATABASE_ID, COLLECTIONS.COMUNICACOES, ID.unique(), {
          tipo, titulo, conteudo, midia_url: midiaUrl || null,
          actions: actionsJson, segmento, canal, status: 'enviada', campanha_ref: body.id || null,
        });
        showFeedback('ok', 'Mensagem enviada com sucesso!');
      }
      resetForm();
    } catch (err) {
      console.error('[AdminComunicacao]', err);
      showFeedback('erro', err.message || 'Erro ao enviar.');
    } finally { setEnviando(false); }
  };

  // ── CRUD Templates ────────────────────────────────────────────
  const abrirCriarTemplate = () => {
    setEditingTpl(null);
    setTplForm({ nome: '', tipo, titulo, conteudo }); setShowTplModal(true);
  };
  const abrirEditarTemplate = (tpl) => {
    setEditingTpl(tpl);
    setTplForm({ nome: tpl.nome, tipo: tpl.tipo, titulo: tpl.titulo, conteudo: tpl.conteudo }); setShowTplModal(true);
  };
  const salvarTemplate = async () => {
    if (!tplForm.nome.trim() || !tplForm.titulo.trim() || !tplForm.conteudo.trim())
      return showFeedback('erro', 'Nome, título e mensagem são obrigatórios.');
    setSavingTpl(true);
    try {
      const data = { nome: tplForm.nome, tipo: tplForm.tipo, titulo: tplForm.titulo, conteudo: tplForm.conteudo };
      if (editingTpl) {
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.TEMPLATES_MENSAGENS, editingTpl.$id, data);
        showFeedback('ok', 'Template atualizado!');
      } else {
        await databases.createDocument(DATABASE_ID, COLLECTIONS.TEMPLATES_MENSAGENS, ID.unique(), data);
        showFeedback('ok', 'Template criado!');
      }
      setShowTplModal(false); carregarTemplates();
    } catch (err) { showFeedback('erro', err.message); }
    finally { setSavingTpl(false); }
  };
  const excluirTemplate = async (tpl) => {
    if (!window.confirm(`Excluir template "${tpl.nome}"?`)) return;
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.TEMPLATES_MENSAGENS, tpl.$id);
      setTemplates(p => p.filter(t => t.$id !== tpl.$id));
    } catch (err) { showFeedback('erro', err.message); }
  };

  const abrirPreview = () => setPreviewData({
    titulo: titulo || 'Título da mensagem', conteudo: conteudo || 'Conteúdo de exemplo.',
    categoria: tipoAtual.categoria, midia_url: midiaUrl || null,
    actions: actionsArr.filter(a => a.label).length > 0 ? JSON.stringify(actionsArr.filter(a => a.label)) : null,
  });

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#080808', padding: '24px 20px', maxWidth: '1000px', margin: '0 auto' }}>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div key="fb" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: '80px', right: '20px', zIndex: 9999,
              background: feedback.t === 'ok' ? '#22c55e18' : '#ef444418',
              border: `1px solid ${feedback.t === 'ok' ? '#22c55e44' : '#ef444444'}`,
              color: feedback.t === 'ok' ? '#22c55e' : '#ef4444',
              padding: '12px 20px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700,
              backdropFilter: 'blur(8px)', maxWidth: '360px',
            }}>
            {feedback.t === 'ok' ? '✅ ' : '❌ '}{feedback.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>📣 Central de Comunicações</h1>
        <p style={{ color: '#555', fontSize: '0.78rem', margin: '4px 0 0' }}>Anúncios, lembretes, notificações e comunicados para seus clientes</p>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px' }}>
        {[
          { id: 'nova',      icon: Send,          label: 'Nova Campanha' },
          { id: 'historico', icon: History,        label: 'Histórico'    },
          { id: 'templates', icon: LayoutTemplate, label: 'Templates'    },
        ].map(tab => (
          <button key={tab.id} onClick={() => setAba(tab.id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '10px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer',
            fontWeight: 800, fontSize: '0.8rem', transition: '0.2s',
            background: aba === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: aba === tab.id ? '#fff' : '#555',
          }}>
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      {/* ── ABA: NOVA CAMPANHA ────────────────────────────── */}
      {aba === 'nova' && (
        <div style={{ display: 'grid', gap: '16px' }}>

          {/* Tipo */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' }}>
            <div style={{ color: '#888', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>Tipo de mensagem</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {Object.entries(TIPOS).map(([key, cfg]) => {
                const Icon = cfg.icon; const ativo = tipo === key;
                return (
                  <motion.button key={key} whileTap={{ scale: 0.96 }} onClick={() => setTipo(key)} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    padding: '12px 8px', borderRadius: '12px', cursor: 'pointer', transition: '0.2s',
                    border: `1px solid ${ativo ? cfg.cor + '55' : 'rgba(255,255,255,0.06)'}`,
                    background: ativo ? `${cfg.cor}15` : 'transparent',
                    color: ativo ? cfg.cor : '#555',
                  }}>
                    <Icon size={18} />
                    <span style={{ fontSize: '0.62rem', fontWeight: 800 }}>{cfg.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Conteúdo */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ color: '#888', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>Conteúdo</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['escrever', 'templates'].map(m => (
                  <button key={m} onClick={() => setModoConteudo(m)} style={{
                    padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                    background: modoConteudo === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: modoConteudo === m ? '#fff' : '#555', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  }}>{m === 'escrever' ? '✏️ Escrever' : '📚 Templates'}</button>
                ))}
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setAiSugestoes([]); setShowAiModal(true); }} style={{
                  display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #7c3aed, #6366f1)', border: 'none',
                  color: '#fff', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                }}>
                  <Sparkles size={12} /> IA
                </motion.button>
              </div>
            </div>

            {modoConteudo === 'escrever' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ color: '#666', fontSize: '0.72rem', fontWeight: 700 }}>Título</label>
                    <span style={{ color: titulo.length > 70 ? '#ef4444' : '#444', fontSize: '0.65rem' }}>{titulo.length}/80</span>
                  </div>
                  <input style={inputStyle} maxLength={80} placeholder={`${tipoAtual.emoji} Ex: Picanha em promoção hoje!`} value={titulo} onChange={e => setTitulo(e.target.value)} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ color: '#666', fontSize: '0.72rem', fontWeight: 700 }}>Mensagem</label>
                    <span style={{ color: conteudo.length > 280 ? '#ef4444' : '#444', fontSize: '0.65rem' }}>{conteudo.length}/300</span>
                  </div>
                  <textarea style={{ ...inputStyle, minHeight: '80px' }} rows={3} maxLength={300}
                    placeholder="Descreva sua mensagem de forma clara e persuasiva..."
                    value={conteudo} onChange={e => setConteudo(e.target.value)} />
                </div>
                <div>
                  <label style={{ color: '#666', fontSize: '0.72rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>URL de mídia <span style={{ color: '#333', fontWeight: 400 }}>(opcional)</span></label>
                  <input style={inputStyle} placeholder="https://..." value={midiaUrl} onChange={e => setMidiaUrl(e.target.value)} />
                </div>
              </div>
            ) : (
              /* Templates do tipo selecionado */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {templates.filter(t => t.tipo === tipo).map(tpl => (
                  <motion.button key={tpl.$id} whileTap={{ scale: 0.97 }} onClick={() => usarTemplate(tpl)} style={{
                    textAlign: 'left', padding: '14px', borderRadius: '10px', cursor: 'pointer', transition: '0.15s',
                    border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = TIPOS[tpl.tipo]?.cor + '44'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                  >
                    <div style={{ color: '#888', fontSize: '0.68rem', fontWeight: 800, marginBottom: '4px' }}>{tpl.nome}</div>
                    <div style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>{tpl.titulo}</div>
                    <div style={{ color: '#555', fontSize: '0.67rem', lineHeight: 1.5 }}>{tpl.conteudo.slice(0, 80)}…</div>
                  </motion.button>
                ))}
                {templates.filter(t => t.tipo === tipo).length === 0 && (
                  <div style={{ gridColumn: '1/-1', color: '#333', textAlign: 'center', padding: '20px', fontSize: '0.78rem' }}>
                    Nenhum template para "{tipoAtual.label}".{' '}
                    <button onClick={() => setAba('templates')} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Criar agora?</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: actionsArr.length > 0 ? '14px' : 0 }}>
              <div>
                <div style={{ color: '#888', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>Botões de Ação Rápida <span style={{ color: '#333', fontWeight: 400 }}>(opcional)</span></div>
                <div style={{ color: '#333', fontSize: '0.65rem', marginTop: '2px' }}>Até 3 botões interativos na notificação</div>
              </div>
              {actionsArr.length < 3 && (
                <button onClick={addAction} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#777', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                  <Plus size={12} /> Adicionar
                </button>
              )}
            </div>
            {actionsArr.map((action, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <input style={{ ...inputStyle, padding: '8px 12px' }} placeholder="Label (ex: Ver agora)" value={action.label} onChange={e => updateAction(i, 'label', e.target.value)} />
                <input style={{ ...inputStyle, padding: '8px 12px' }} placeholder="URL (ex: /)" value={action.url} onChange={e => updateAction(i, 'url', e.target.value)} />
                <button onClick={() => removeAction(i)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>

          {/* Entrega */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' }}>
            <div style={{ color: '#888', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Entrega</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ color: '#666', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}><Users size={11} /> Público</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[['todos','Todos'],['recorrentes','Recorrentes'],['vip','VIPs']].map(([val, lbl]) => (
                    <button key={val} onClick={() => setSegmento(val)} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: segmento === val ? 'rgba(255,255,255,0.1)' : 'transparent', color: segmento === val ? '#fff' : '#555', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>{lbl}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ color: '#666', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}><Zap size={11} /> Canal</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[['todos','Ambos'],['inapp','In-App'],['push','Push']].map(([val, lbl]) => (
                    <button key={val} onClick={() => setCanal(val)} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: canal === val ? 'rgba(255,255,255,0.1)' : 'transparent', color: canal === val ? '#fff' : '#555', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>{lbl}</button>
                  ))}
                </div>
              </div>
            </div>
            {/* Agendamento */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <div onClick={() => setAgendado(a => !a)} style={{ width: '36px', height: '20px', borderRadius: '10px', background: agendado ? tipoAtual.cor : 'rgba(255,255,255,0.1)', position: 'relative', transition: '0.2s', cursor: 'pointer' }}>
                  <div style={{ position: 'absolute', top: '3px', left: agendado ? '18px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: '0.2s' }} />
                </div>
                <div>
                  <div style={{ color: '#aaa', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={12} /> Agendar envio</div>
                  <div style={{ color: '#444', fontSize: '0.65rem' }}>Disparo automático na data/hora definida</div>
                </div>
              </label>
              <AnimatePresence>
                {agendado && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <input type="datetime-local" style={{ ...inputStyle, marginTop: '12px' }}
                      min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}
                      value={agendadaPara} onChange={e => setAgendadaPara(e.target.value)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Ações finais */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={abrirPreview} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#888', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
              <Eye size={14} /> Preview
            </button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={enviarOuAgendar} disabled={enviando} style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '10px', border: 'none',
              background: agendado ? 'linear-gradient(135deg, #f59e0b, #d97706)' : `linear-gradient(135deg, ${tipoAtual.cor}, ${tipoAtual.cor}cc)`,
              color: agendado ? '#000' : '#fff', fontSize: '0.88rem', fontWeight: 900, cursor: enviando ? 'wait' : 'pointer',
            }}>
              {enviando
                ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                : agendado ? <><Calendar size={15} /> Agendar</> : <><Send size={15} /> Enviar agora</>
              }
            </motion.button>
          </div>
        </div>
      )}

      {/* ── ABA: HISTÓRICO ────────────────────────────────── */}
      {aba === 'historico' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Filter size={14} color="#555" />
            <select style={{ ...inputStyle, width: 'auto', padding: '7px 12px' }} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option value="">Todos os tipos</option>
              {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </select>
            <select style={{ ...inputStyle, width: 'auto', padding: '7px 12px' }} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option>
              {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={carregarHistorico} style={{ ...inputStyle, width: 'auto', padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <RefreshCw size={13} /> Atualizar
            </button>
          </div>

          {loadingHist ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#444' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : historico.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#333' }}>
              <MailOpen size={40} style={{ marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700 }}>Nenhuma campanha encontrada</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {historico.map(item => {
                const cfg = TIPOS[item.tipo] || TIPOS.geral;
                const st  = STATUS_META[item.status] || STATUS_META.enviada;
                return (
                  <motion.div key={item.$id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderLeft: `3px solid ${cfg.cor}`, borderRadius: '12px', padding: '16px 20px',
                    display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ background: `${cfg.cor}20`, color: cfg.cor, fontSize: '0.6rem', fontWeight: 900, padding: '2px 8px', borderRadius: '100px' }}>{cfg.emoji} {cfg.label}</span>
                        <span style={{ background: st.bg, color: st.cor, fontSize: '0.6rem', fontWeight: 900, padding: '2px 8px', borderRadius: '100px' }}>{st.label}</span>
                        {item.canal && <span style={{ color: '#444', fontSize: '0.62rem' }}>• {item.canal}</span>}
                      </div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.88rem', marginBottom: '4px' }}>{item.titulo}</div>
                      <div style={{ color: '#555', fontSize: '0.75rem', lineHeight: 1.5 }}>{item.conteudo?.slice(0, 120)}{(item.conteudo?.length || 0) > 120 ? '…' : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: '#444', fontSize: '0.65rem', fontWeight: 700 }}>{formatDate(item.agendada_para || item.$createdAt)}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ABA: TEMPLATES ───────────────────────────────── */}
      {aba === 'templates' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={() => setFiltroTipoTpl('')} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: filtroTipoTpl === '' ? 'rgba(255,255,255,0.1)' : 'transparent', color: filtroTipoTpl === '' ? '#fff' : '#555', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Todos</button>
              {Object.entries(TIPOS).map(([k, v]) => (
                <button key={k} onClick={() => setFiltroTipoTpl(k)} style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${filtroTipoTpl === k ? v.cor + '55' : 'rgba(255,255,255,0.1)'}`, background: filtroTipoTpl === k ? `${v.cor}15` : 'transparent', color: filtroTipoTpl === k ? v.cor : '#555', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                  {v.emoji} {v.label}
                </button>
              ))}
            </div>
            <button onClick={abrirCriarTemplate} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>
              <Plus size={14} /> Novo Template
            </button>
          </div>

          {loadingTpl ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#444' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {templates.filter(t => !filtroTipoTpl || t.tipo === filtroTipoTpl).map(tpl => {
                const cfg = TIPOS[tpl.tipo] || TIPOS.geral;
                return (
                  <div key={tpl.$id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ background: `${cfg.cor}20`, color: cfg.cor, fontSize: '0.6rem', fontWeight: 900, padding: '2px 8px', borderRadius: '100px' }}>{cfg.emoji} {cfg.label}</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => abrirEditarTemplate(tpl)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: '#888' }}><Edit3 size={12} /></button>
                        <button onClick={() => excluirTemplate(tpl)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <div style={{ color: '#777', fontSize: '0.7rem', fontWeight: 700 }}>{tpl.nome}</div>
                    <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 800 }}>{tpl.titulo}</div>
                    <div style={{ color: '#555', fontSize: '0.73rem', lineHeight: 1.5, flex: 1 }}>{tpl.conteudo}</div>
                    <button onClick={() => usarTemplate(tpl)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '8px', borderRadius: '8px', border: `1px solid ${cfg.cor}33`, background: `${cfg.cor}10`, color: cfg.cor, fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                      <ChevronRight size={13} /> Usar template
                    </button>
                  </div>
                );
              })}
              {templates.filter(t => !filtroTipoTpl || t.tipo === filtroTipoTpl).length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#333' }}>
                  <LayoutTemplate size={36} style={{ marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 700 }}>Nenhum template encontrado</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: Gerar com IA ──────────────────────────── */}
      <AnimatePresence>
        {showAiModal && (
          <>
            <motion.div key="ai-bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAiModal(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, backdropFilter: 'blur(4px)' }} />
            <motion.div key="ai-modal" initial={{ opacity: 0, scale: 0.94, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 2001, width: 'min(520px, calc(100vw - 32px))', background: '#111', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', padding: '28px', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 900, fontSize: '1rem' }}>✨ Gerar com ChatGPT</div>
                  <div style={{ color: '#555', fontSize: '0.72rem', marginTop: '2px' }}>Tipo: <span style={{ color: tipoAtual.cor }}>{tipoAtual.emoji} {tipoAtual.label}</span></div>
                </div>
                <button onClick={() => setShowAiModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px', cursor: 'pointer', color: '#666' }}><X size={15} /></button>
              </div>

              <textarea style={{ ...inputStyle, minHeight: '80px', marginBottom: '14px' }} rows={3}
                placeholder="Contexto: produto, preço, motivo, evento... Ex: Picanha premium de R$89,90 por R$69,90/kg, queima de estoque"
                value={aiContexto} onChange={e => setAiContexto(e.target.value)} />

              <button onClick={gerarComAI} disabled={aiLoading} style={{
                width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                color: '#fff', fontWeight: 900, fontSize: '0.88rem', cursor: aiLoading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px',
              }}>
                {aiLoading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</> : <><Sparkles size={15} /> Gerar 3 sugestões</>}
              </button>

              {aiSugestoes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ color: '#555', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>Escolha uma sugestão</div>
                  {aiSugestoes.map((sug, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px' }}>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.85rem', marginBottom: '5px' }}>{sug.titulo}</div>
                      <div style={{ color: '#666', fontSize: '0.76rem', lineHeight: 1.5, marginBottom: '12px' }}>{sug.conteudo}</div>
                      <button onClick={() => usarSugestao(sug)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', border: `1px solid ${tipoAtual.cor}44`, background: `${tipoAtual.cor}12`, color: tipoAtual.cor, fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                        <ChevronRight size={13} /> Usar esta
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MODAL: Template ──────────────────────────────── */}
      <AnimatePresence>
        {showTplModal && (
          <>
            <motion.div key="tpl-bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTplModal(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, backdropFilter: 'blur(4px)' }} />
            <motion.div key="tpl-modal" initial={{ opacity: 0, scale: 0.94, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 2001, width: 'min(480px, calc(100vw - 32px))', background: '#111', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: '1rem' }}>{editingTpl ? '✏️ Editar Template' : '📚 Novo Template'}</div>
                <button onClick={() => setShowTplModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px', cursor: 'pointer', color: '#666' }}><X size={15} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ color: '#666', fontSize: '0.72rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Nome do template</label>
                  <input style={inputStyle} placeholder="Ex: Promoção Flash" value={tplForm.nome} onChange={e => setTplForm(f => ({ ...f, nome: e.target.value }))} />
                </div>
                <div>
                  <label style={{ color: '#666', fontSize: '0.72rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Tipo</label>
                  <select style={inputStyle} value={tplForm.tipo} onChange={e => setTplForm(f => ({ ...f, tipo: e.target.value }))}>
                    {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#666', fontSize: '0.72rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Título</label>
                  <input style={inputStyle} maxLength={80} placeholder="Título da mensagem" value={tplForm.titulo} onChange={e => setTplForm(f => ({ ...f, titulo: e.target.value }))} />
                </div>
                <div>
                  <label style={{ color: '#666', fontSize: '0.72rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Mensagem</label>
                  <textarea style={{ ...inputStyle, minHeight: '70px' }} rows={3} maxLength={300} value={tplForm.conteudo} onChange={e => setTplForm(f => ({ ...f, conteudo: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px' }}>
                  <button onClick={() => setShowTplModal(false)} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#666', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={salvarTemplate} disabled={savingTpl} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 800, cursor: savingTpl ? 'wait' : 'pointer' }}>
                    {savingTpl && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}Salvar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Preview */}
      <AnuncioPopup anuncio={previewData} onClose={() => setPreviewData(null)} />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
