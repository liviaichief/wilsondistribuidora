/**
 * AdminComunicacao — Painel de Disparo de Anúncios (Vitrini Digital)
 * Rota: /admin/comunicacao  |  Role: master, owner, admin
 *
 * Fluxo:
 *   Admin preenche form → clica "Enviar" → chama Appwrite Function
 *   "send-campanha" → cria documento em campanhas_comunicacao →
 *   Realtime entrega o evento para todos os clientes conectados.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { functions, databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query } from 'appwrite';
import { Megaphone, Send, Image, Clock, CheckCircle, XCircle, Loader2, Bell, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnuncioPopup from '../components/shop/AnuncioPopup';

const FUNC_ID = import.meta.env.VITE_FUNC_SEND_CAMPANHA || 'send-campanha';
const API_KEY = import.meta.env.VITE_APPWRITE_API_KEY || '';

const CATEGORIAS = [
  { value: 'anuncio',          label: '📢 Anúncio',    desc: 'Promoção ou oferta relâmpago' },
  { value: 'comunicado_geral', label: '📋 Comunicado', desc: 'Aviso geral da loja' },
];

const CATEGORIA_COR = {
  anuncio:          '#D4AF37',
  comunicado_geral: '#6366f1',
};

/* ─── Helpers ─────────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ─── Component ───────────────────────────────────────────────── */
export default function AdminComunicacao() {
  /* Form state */
  const [titulo,    setTitulo]    = useState('');
  const [conteudo,  setConteudo]  = useState('');
  const [categoria, setCategoria] = useState('anuncio');
  const [midiaUrl,  setMidiaUrl]  = useState('');

  /* UI state */
  const [enviando,  setEnviando]  = useState(false);
  const [feedback,  setFeedback]  = useState(null); // { tipo: 'ok'|'erro', msg }
  const [historico, setHistorico] = useState([]);
  const [loadingH,  setLoadingH]  = useState(true);
  const [preview,   setPreview]   = useState(null); // anuncio fake para testar popup

  /* ── Carrega histórico de campanhas ── */
  useEffect(() => {
    (async () => {
      setLoadingH(true);
      try {
        const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CAMPANHAS, [
          Query.orderDesc('$createdAt'),
          Query.limit(20),
        ]);
        setHistorico(res.documents || []);
      } catch (err) {
        console.warn('[AdminComunicacao] Erro ao carregar histórico:', err.message);
      } finally {
        setLoadingH(false);
      }
    })();
  }, []);

  /* ── Enviar campanha ── */
  const handleEnviar = async () => {
    if (!titulo.trim() || !conteudo.trim()) return;
    setEnviando(true);
    setFeedback(null);

    try {
      const exec = await functions.createExecution(
        FUNC_ID,
        JSON.stringify({ titulo, conteudo, categoria, midia_url: midiaUrl || null, apiKey: API_KEY }),
        false
      );
      const result = JSON.parse(exec.responseBody || '{}');

      if (!result.ok) throw new Error(result.error || 'Falha desconhecida');

      setFeedback({ tipo: 'ok', msg: 'Anúncio enviado! Todos os clientes conectados receberam em tempo real.' });

      // Atualiza histórico localmente
      const novoDoc = {
        $id: result.id,
        $createdAt: new Date().toISOString(),
        titulo, conteudo, categoria, midia_url: midiaUrl || null,
      };
      setHistorico(prev => [novoDoc, ...prev]);

      // Limpa o form
      setTitulo('');
      setConteudo('');
      setMidiaUrl('');
      setCategoria('anuncio');
    } catch (err) {
      setFeedback({ tipo: 'erro', msg: err.message });
    } finally {
      setEnviando(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const canEnviar = titulo.trim() && conteudo.trim() && !enviando;
  const corCategoria = CATEGORIA_COR[categoria];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 20px' }}>

      {/* ── Cabeçalho ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Megaphone size={18} color="#D4AF37" />
          </div>
          <div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: 900 }}>
              Vitrini Digital
            </h1>
            <p style={{ margin: 0, color: '#555', fontSize: '0.75rem', fontWeight: 700 }}>
              Anúncios em tempo real para clientes conectados
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

        {/* ── Formulário de envio ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h2 style={{ margin: '0 0 20px', color: '#fff', fontSize: '0.95rem', fontWeight: 900 }}>
            Novo Anúncio
          </h2>

          {/* Categoria */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 900, color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              Tipo
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {CATEGORIAS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategoria(c.value)}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                    border: `1px solid ${categoria === c.value ? CATEGORIA_COR[c.value] + '66' : 'rgba(255,255,255,0.08)'}`,
                    background: categoria === c.value ? CATEGORIA_COR[c.value] + '18' : 'rgba(255,255,255,0.03)',
                    color: categoria === c.value ? '#fff' : '#555',
                    fontSize: '0.75rem', fontWeight: 800, textAlign: 'center',
                    transition: '0.2s',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 900, color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              Título *
            </label>
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Alcatra com 20% de desconto!"
              maxLength={80}
              style={{
                width: '100%', background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                padding: '11px 14px', color: '#fff', fontSize: '0.85rem',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.6rem', color: '#444', marginTop: '4px' }}>
              {titulo.length}/80
            </div>
          </div>

          {/* Conteúdo */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 900, color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              Mensagem *
            </label>
            <textarea
              value={conteudo}
              onChange={e => setConteudo(e.target.value)}
              placeholder="Detalhe a oferta, horário especial, produto disponível..."
              maxLength={300}
              rows={4}
              style={{
                width: '100%', background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                padding: '11px 14px', color: '#fff', fontSize: '0.85rem',
                outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.6rem', color: '#444', marginTop: '4px' }}>
              {conteudo.length}/300
            </div>
          </div>

          {/* URL de mídia (opcional) */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 900, color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              URL de Imagem <span style={{ color: '#333', fontWeight: 700 }}>(opcional)</span>
            </label>
            <input
              value={midiaUrl}
              onChange={e => setMidiaUrl(e.target.value)}
              placeholder="https://..."
              style={{
                width: '100%', background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                padding: '11px 14px', color: '#fff', fontSize: '0.82rem',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px 14px', borderRadius: '10px', marginBottom: '14px',
                  background: feedback.tipo === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${feedback.tipo === 'ok' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                }}
              >
                {feedback.tipo === 'ok'
                  ? <CheckCircle size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: '1px' }} />
                  : <XCircle    size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                }
                <span style={{ fontSize: '0.78rem', color: feedback.tipo === 'ok' ? '#86efac' : '#fca5a5', lineHeight: 1.5 }}>
                  {feedback.msg}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botões */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setPreview(titulo || conteudo ? { titulo: titulo || 'Título do anúncio', conteudo: conteudo || 'Mensagem de exemplo.', categoria, midia_url: midiaUrl || null } : null)}
              style={{
                padding: '12px 16px', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                color: '#888', fontSize: '0.78rem', fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Pré-visualizar
            </button>
            <button
              onClick={handleEnviar}
              disabled={!canEnviar}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px', borderRadius: '12px', border: 'none',
                background: canEnviar ? `linear-gradient(135deg, ${corCategoria}, ${corCategoria}bb)` : 'rgba(255,255,255,0.05)',
                color: canEnviar ? (categoria === 'anuncio' ? '#000' : '#fff') : '#333',
                fontSize: '0.85rem', fontWeight: 900,
                cursor: canEnviar ? 'pointer' : 'not-allowed',
                transition: '0.2s',
                boxShadow: canEnviar ? `0 4px 16px ${corCategoria}44` : 'none',
              }}
            >
              {enviando
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
                : <><Send size={15} /> Enviar Agora</>
              }
            </button>
          </div>

          <p style={{ margin: '12px 0 0', fontSize: '0.68rem', color: '#444', lineHeight: 1.5 }}>
            O anúncio é entregue instantaneamente via WebSocket para todos os clientes com o app aberto.
          </p>
        </div>

        {/* ── Histórico ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: '24px',
          maxHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <h2 style={{ margin: '0 0 18px', color: '#fff', fontSize: '0.95rem', fontWeight: 900, flexShrink: 0 }}>
            Histórico de Envios
          </h2>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {loadingH ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
                <Loader2 size={22} color="#444" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : historico.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#444', fontSize: '0.8rem' }}>
                Nenhum anúncio enviado ainda.
              </div>
            ) : (
              historico.map(doc => {
                const cor = CATEGORIA_COR[doc.categoria] || '#D4AF37';
                return (
                  <div key={doc.$id} style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${cor}22`,
                    borderLeft: `3px solid ${cor}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 800, lineHeight: 1.3 }}>
                        {doc.titulo}
                      </span>
                      <span style={{
                        fontSize: '0.55rem', fontWeight: 900, color: cor,
                        background: `${cor}18`, border: `1px solid ${cor}33`,
                        padding: '2px 8px', borderRadius: '100px', whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {CATEGORIAS.find(c => c.value === doc.categoria)?.label ?? doc.categoria}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 6px', color: '#666', fontSize: '0.72rem', lineHeight: 1.5 }}>
                      {doc.conteudo?.length > 80 ? doc.conteudo.slice(0, 80) + '…' : doc.conteudo}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#444', fontSize: '0.62rem', fontWeight: 700 }}>
                      <Clock size={10} />
                      {formatDate(doc.$createdAt)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Popup de pré-visualização */}
      <AnuncioPopup anuncio={preview} onClose={() => setPreview(null)} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
