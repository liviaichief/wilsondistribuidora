import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNextCopaMatch, isCopaMatchLive, getCurrentSeason } from '../../services/seasonalService';
import { getSettings } from '../../services/dataService';

function formatCountdown(ms) {
  if (ms <= 0) return '';
  const days  = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins  = Math.floor((ms % 3600000) / 60000);
  if (days > 0)  return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}min`;
  return `${mins} minutos`;
}

export default function CopaBanner() {
  const [match, setMatch]         = useState(null);
  const [isLive, setIsLive]       = useState(false);
  const [timeLeft, setTimeLeft]   = useState('');
  const [isCopaActive, setIsCopaActive] = useState(false);
  const isPwa = typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

  useEffect(() => {
    getSettings().then(s => {
      const season = s.active_season || getCurrentSeason()?.id || '';
      setIsCopaActive(season === 'copa');
    }).catch(() => {
      setIsCopaActive(getCurrentSeason()?.id === 'copa');
    });
  }, []);

  useEffect(() => {
    if (!isCopaActive) return;
    const tick = () => {
      const next = getNextCopaMatch();
      setMatch(next);
      if (next) {
        const live = isCopaMatchLive(next);
        setIsLive(live);
        if (!live) {
          setTimeLeft(formatCountdown(new Date(next.date) - new Date()));
        }
      }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [isCopaActive]);

  if (!isCopaActive || !match) return null;

  const matchDate = new Date(match.date);
  const dateStr = matchDate.toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short'
  });
  const timeStr = matchDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          ...(isPwa ? { width: '70%', margin: '0 auto', borderRadius: '0 0 12px 12px' } : {}),
          background: isLive
            ? 'linear-gradient(90deg, #006400 0%, #009c3b 30%, #cc0000 50%, #009c3b 70%, #006400 100%)'
            : 'linear-gradient(90deg, #004d20 0%, #009c3b 50%, #FFDF00 100%)',
          backgroundSize: isLive ? '300% 100%' : '100% 100%',
          overflow: 'hidden',
        }}
      >
        {isLive && (
          <motion.div
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              pointerEvents: 'none',
            }}
          />
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isPwa ? '6px' : '10px',
          padding: isPwa ? '4px 10px' : '8px 16px',
          flexWrap: isPwa ? 'nowrap' : 'wrap',
          overflow: isPwa ? 'hidden' : 'visible',
          position: 'relative',
        }}>
          {/* LIVE badge */}
          {isLive && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              style={{
                background: '#cc0000',
                color: '#fff',
                borderRadius: '5px',
                padding: isPwa ? '1px 5px' : '2px 7px',
                fontSize: isPwa ? '0.42rem' : '0.6rem',
                fontWeight: 900,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                boxShadow: '0 0 10px rgba(204,0,0,0.6)',
              }}
            >
              🔴 AO VIVO
            </motion.span>
          )}

          {/* Ball icon */}
          <motion.span
            animate={isLive ? { rotate: [0, 360] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: isPwa ? '0.7rem' : '1rem' }}
          >
            ⚽
          </motion.span>

          {/* Match info */}
          <span style={{
            color: '#fff',
            fontWeight: 800,
            fontSize: isPwa ? '0.57rem' : '0.82rem',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
          }}>
            {isLive
              ? `${match.home} — Acontecendo agora!`
              : `${match.home} · ${dateStr}, ${timeStr}`
            }
          </span>

          {/* Countdown */}
          {!isLive && timeLeft && (
            <span style={{
              background: 'rgba(0,0,0,0.35)',
              borderRadius: '6px',
              padding: isPwa ? '1px 6px' : '2px 9px',
              fontSize: isPwa ? '0.5rem' : '0.72rem',
              fontWeight: 900,
              color: '#FFDF00',
              letterSpacing: '0.5px',
            }}>
              em {timeLeft}
            </span>
          )}

          {/* Venue — oculto no PWA para evitar quebra de linha */}
          {!isPwa && (
            <span style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}>
              📍 {match.venue}
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
