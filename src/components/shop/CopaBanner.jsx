
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { getNextCopaMatch, isCopaMatchLive } from '../../services/seasonalService';
import './CopaBanner.css';

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
  const { theme } = useTheme();
  const [match, setMatch]     = useState(null);
  const [isLive, setIsLive]   = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (theme !== 'world_cup') return;
    const tick = () => {
      const next = getNextCopaMatch();
      setMatch(next);
      if (next) {
        const live = isCopaMatchLive(next);
        setIsLive(live);
        setTimeLeft(live ? '' : formatCountdown(new Date(next.date) - new Date()));
      }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [theme]);

  // Só exibe quando o tema Copa está ativo e há jogo
  if (theme !== 'world_cup' || !match) return null;

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
        className={`copa-banner-outer ${isLive ? 'is-live' : ''}`}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.4 }}
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

        <div className="copa-banner-inner">
          {isLive && (
            <motion.span
              className="copa-live-badge"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              🔴 AO VIVO
            </motion.span>
          )}

          <motion.span
            className="copa-ball"
            animate={isLive ? { rotate: [0, 360] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            ⚽
          </motion.span>

          <span className="copa-match-text">
            {isLive
              ? `${match.home} — Acontecendo agora!`
              : `${match.home} · ${dateStr}, ${timeStr}`
            }
          </span>

          {!isLive && timeLeft && (
            <span className="copa-countdown">em {timeLeft}</span>
          )}

          <span className="copa-venue">📍 {match.venue}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
