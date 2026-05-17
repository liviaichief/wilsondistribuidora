/**
 * NotificacoesPanel
 * Painel lateral deslizante com todas as notificações do usuário.
 * Abre a partir do ícone de perfil no Header.
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Megaphone, RefreshCw, Inbox, BellOff, BellRing, Loader2 } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const CATEGORIA_META = {
  anuncio:          { label: 'Anúncio',    emoji: '📢', cor: '#D4AF37' },
  comunicado_geral: { label: 'Comunicado', emoji: '📋', cor: '#6366f1' },
};

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const agora = new Date();
  const diffMs = agora - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);

  if (diffMin < 1)  return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffH   < 24) return `há ${diffH}h`;
  if (diffD   < 7)  return `há ${diffD} dia${diffD > 1 ? 's' : ''}`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function NotificacoesPanel({ isOpen, onClose, notificacoes, loading, unreadCount, marcarLidas, lastSeen }) {
  const {
    isSupported: pushSupported,
    permission,
    isSubscribed,
    isLoading: pushLoading,
    error: pushError,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  // Marca como lidas ao abrir
  useEffect(() => {
    if (isOpen) marcarLidas?.();
  }, [isOpen, marcarLidas]);

  // Fecha com ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="notif-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 1100,
              backdropFilter: 'blur(3px)',
            }}
          />

          {/* Painel lateral */}
          <motion.div
            key="notif-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            style={{
              position: 'fixed',
              top: 0, right: 0, bottom: 0,
              width: 'min(400px, 100vw)',
              background: '#0d0d0d',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              zIndex: 1101,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* ── Header do painel ── */}
            <div style={{
              padding: '20px 20px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(212,175,55,0.12)',
                  border: '1px solid rgba(212,175,55,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bell size={16} color="#D4AF37" />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 900, fontSize: '0.95rem' }}>
                    Notificações
                  </div>
                  <div style={{ color: '#555', fontSize: '0.65rem', fontWeight: 700 }}>
                    {notificacoes.length === 0 ? 'Nenhuma notificação' : `${notificacoes.length} no total`}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#666',
                  transition: '0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#666'}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Lista de notificações ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>

              {loading ? (
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  height: '200px', gap: '12px',
                }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw size={22} color="#333" />
                  </motion.div>
                  <span style={{ color: '#444', fontSize: '0.78rem', fontWeight: 600 }}>
                    Carregando...
                  </span>
                </div>
              ) : notificacoes.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  height: '260px', gap: '14px', padding: '20px',
                  textAlign: 'center',
                }}>
                  <Inbox size={40} color="#222" />
                  <div>
                    <div style={{ color: '#555', fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px' }}>
                      Tudo em dia!
                    </div>
                    <div style={{ color: '#333', fontSize: '0.72rem' }}>
                      Quando a loja enviar um anúncio ou comunicado, ele aparece aqui.
                    </div>
                  </div>
                </div>
              ) : (
                notificacoes.map((notif, idx) => {
                  const meta = CATEGORIA_META[notif.categoria] ?? CATEGORIA_META.anuncio;
                  const isNova = notif.$createdAt > (localStorage.getItem('notif_last_seen') || new Date(0).toISOString());

                  return (
                    <motion.div
                      key={notif.$id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                      style={{
                        margin: '0 12px 6px',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        background: isNova
                          ? `linear-gradient(135deg, ${meta.cor}0d, rgba(255,255,255,0.02))`
                          : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isNova ? meta.cor + '30' : 'rgba(255,255,255,0.05)'}`,
                        borderLeft: `3px solid ${isNova ? meta.cor : 'rgba(255,255,255,0.08)'}`,
                        position: 'relative',
                      }}
                    >
                      {/* Dot de não lida */}
                      {isNova && (
                        <div style={{
                          position: 'absolute', top: '14px', right: '14px',
                          width: '7px', height: '7px',
                          borderRadius: '50%',
                          background: meta.cor,
                          boxShadow: `0 0 6px ${meta.cor}`,
                        }} />
                      )}

                      {/* Categoria badge */}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        background: `${meta.cor}18`,
                        border: `1px solid ${meta.cor}33`,
                        color: meta.cor,
                        fontSize: '0.55rem', fontWeight: 900,
                        padding: '2px 8px', borderRadius: '100px',
                        letterSpacing: '0.8px', textTransform: 'uppercase',
                        marginBottom: '8px',
                      }}>
                        <span>{meta.emoji}</span>
                        <span>{meta.label}</span>
                      </div>

                      {/* Título */}
                      <div style={{
                        color: isNova ? '#fff' : '#bbb',
                        fontWeight: isNova ? 800 : 700,
                        fontSize: '0.85rem',
                        lineHeight: 1.3,
                        marginBottom: '6px',
                        paddingRight: isNova ? '16px' : 0,
                      }}>
                        {notif.titulo}
                      </div>

                      {/* Conteúdo */}
                      <div style={{
                        color: '#666',
                        fontSize: '0.75rem',
                        lineHeight: 1.6,
                        marginBottom: '10px',
                      }}>
                        {notif.conteudo}
                      </div>

                      {/* Imagem (se houver) */}
                      {notif.midia_url && (
                        <div style={{
                          borderRadius: '8px', overflow: 'hidden',
                          marginBottom: '10px', height: '120px',
                        }}>
                          <img
                            src={notif.midia_url}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.target.parentElement.style.display = 'none'; }}
                          />
                        </div>
                      )}

                      {/* Data */}
                      <div style={{
                        color: '#444', fontSize: '0.62rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        <Bell size={9} />
                        {formatDate(notif.$createdAt)}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* ── Rodapé: Push Notifications ── */}
            <div style={{
              padding: '14px 16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}>
              {/* Contagem de notificações */}
              {notificacoes.length > 0 && (
                <div style={{
                  color: '#333', fontSize: '0.62rem', fontWeight: 700,
                  textAlign: 'center', marginBottom: pushSupported ? '12px' : 0,
                }}>
                  Mostrando os últimos {notificacoes.length} anúncios e comunicados
                </div>
              )}

              {/* Botão de ativar/desativar notificações nativas */}
              {pushSupported && permission !== 'denied' && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={isSubscribed ? unsubscribe : subscribe}
                  disabled={pushLoading}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: isSubscribed
                      ? '1px solid rgba(212,175,55,0.3)'
                      : '1px solid rgba(255,255,255,0.1)',
                    background: isSubscribed
                      ? 'rgba(212,175,55,0.08)'
                      : 'rgba(255,255,255,0.04)',
                    color: isSubscribed ? '#D4AF37' : '#888',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: pushLoading ? 'wait' : 'pointer',
                    transition: '0.2s',
                    letterSpacing: '0.3px',
                  }}
                >
                  {pushLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 size={14} />
                    </motion.div>
                  ) : isSubscribed ? (
                    <BellRing size={14} />
                  ) : (
                    <BellOff size={14} />
                  )}
                  {pushLoading
                    ? 'Ativando...'
                    : isSubscribed
                      ? 'Notificações ativadas no celular'
                      : 'Ativar notificações no celular'}
                </motion.button>
              )}

              {/* Permissão bloqueada */}
              {pushSupported && permission === 'denied' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  justifyContent: 'center',
                  color: '#444', fontSize: '0.65rem', fontWeight: 700,
                }}>
                  <BellOff size={12} />
                  Notificações bloqueadas — habilite nas configurações do navegador
                </div>
              )}

              {/* Erro de push */}
              {pushError && (
                <div style={{
                  marginTop: '8px',
                  color: '#e57373', fontSize: '0.65rem', textAlign: 'center',
                }}>
                  {pushError}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
