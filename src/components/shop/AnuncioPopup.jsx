/**
 * AnuncioPopup
 * Banner flutuante que aparece no cliente quando o admin dispara um anúncio
 * via canal Realtime (coleção campanhas_comunicacao).
 *
 * Props:
 *   anuncio  — { titulo, conteudo, categoria, midia_url } | null
 *   onClose  — callback para dispensar
 */
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone, Bell } from 'lucide-react';

/* ── Gera um som de sino via Web Audio API (sem arquivo externo) ── */
function tocarSino() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Nota principal (Mi5 = 659 Hz) que decai suavemente
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.8);
    gain1.gain.setValueAtTime(0.25, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 1.8);

    // Harmônico mais agudo para textura de sino
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318, ctx.currentTime);
    gain2.gain.setValueAtTime(0.08, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start();
    osc2.stop(ctx.currentTime + 0.8);
  } catch {
    // Navegadores que bloqueiam áudio sem interação — silêncio é aceitável
  }
}

const CATEGORIA_META = {
  anuncio:          { label: '📢 Anúncio',    cor: '#D4AF37' },
  comunicado_geral: { label: '📋 Comunicado', cor: '#6366f1' },
};

/* Parseia o campo actions (JSON string ou array) com segurança */
function parseActions(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

const AUTO_DISMISS_MS = 14000;

export default function AnuncioPopup({ anuncio, onClose }) {
  const timerRef   = useRef(null);
  const actionsArr = parseActions(anuncio?.actions);

  useEffect(() => {
    if (!anuncio) return;

    // Som de sino ao aparecer
    tocarSino();

    // Vibração em mobile (dupla)
    if (navigator.vibrate) navigator.vibrate([250, 100, 250]);

    // Auto-dismiss
    timerRef.current = setTimeout(() => onClose?.(), AUTO_DISMISS_MS);
    return () => clearTimeout(timerRef.current);
  }, [anuncio, onClose]);

  const meta = CATEGORIA_META[anuncio?.categoria] ?? CATEGORIA_META.anuncio;

  return (
    <AnimatePresence>
      {anuncio && (
        <>
          {/* Backdrop semitransparente */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              zIndex: 9000,
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Card do anúncio */}
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 80, scale: 0.92 }}
            animate={{ opacity: 1, y: 0,  scale: 1   }}
            exit={  { opacity: 0, y: 80, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: '28px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(480px, calc(100vw - 32px))',
              background: 'linear-gradient(145deg, #1a1a1a, #111)',
              border: `1px solid ${meta.cor}44`,
              borderRadius: '20px',
              boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 30px ${meta.cor}22`,
              zIndex: 9001,
              overflow: 'hidden',
            }}
          >
            {/* Linha decorativa no topo */}
            <div style={{
              height: '3px',
              background: `linear-gradient(90deg, ${meta.cor}, transparent)`,
            }} />

            <div style={{ padding: '22px 24px 20px' }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '14px',
              }}>
                {/* Ícone + badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                    background: `${meta.cor}22`,
                    border: `1px solid ${meta.cor}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Megaphone size={18} color={meta.cor} />
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.6rem', fontWeight: 900,
                      color: meta.cor, letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                    }}>
                      {meta.label}
                    </div>
                    <div style={{
                      color: '#fff', fontWeight: 900,
                      fontSize: '1rem', lineHeight: 1.25,
                      marginTop: '2px',
                    }}>
                      {anuncio.titulo}
                    </div>
                  </div>
                </div>

                {/* Botão fechar */}
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#888', flexShrink: 0,
                    transition: '0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = '#888'}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Imagem (se houver) */}
              {anuncio.midia_url && (
                <div style={{
                  borderRadius: '12px', overflow: 'hidden',
                  marginBottom: '14px', maxHeight: '180px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <img
                    src={anuncio.midia_url}
                    alt={anuncio.titulo}
                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                    onError={e => { e.target.parentElement.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Conteúdo */}
              <p style={{
                color: '#aaa', fontSize: '0.85rem',
                lineHeight: 1.6, margin: '0 0 16px',
              }}>
                {anuncio.conteudo}
              </p>

              {/* Quick Actions — botões interativos */}
              {actionsArr.length > 0 && (
                <div style={{
                  display: 'flex', gap: '8px', flexWrap: 'wrap',
                  marginBottom: '14px',
                }}>
                  {actionsArr.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onClose?.();
                        if (action.url) {
                          if (action.url.startsWith('http')) {
                            window.open(action.url, '_blank', 'noopener');
                          } else {
                            window.location.href = action.url;
                          }
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: `1px solid ${meta.cor}55`,
                        background: i === 0 ? meta.cor : 'transparent',
                        color: i === 0 ? '#000' : meta.cor,
                        fontSize: '0.78rem', fontWeight: 800,
                        cursor: 'pointer',
                        transition: '0.15s',
                      }}
                      onMouseEnter={e => {
                        if (i !== 0) e.currentTarget.style.background = `${meta.cor}22`;
                      }}
                      onMouseLeave={e => {
                        if (i !== 0) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Barra de progresso auto-dismiss */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
                style={{
                  height: '2px',
                  background: meta.cor,
                  borderRadius: '2px',
                  transformOrigin: 'left',
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
