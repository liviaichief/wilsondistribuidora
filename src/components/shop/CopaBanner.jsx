
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNextCopaMatch, isCopaMatchLive, getCurrentSeason } from '../../services/seasonalService';
import { getSettings } from '../../services/dataService';
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
  const [match, setMatch]         = useState(null);
  const [isLive, setIsLive]       = useState(false);
  const [timeLeft, setTimeLeft]   = useState('');
  const [isCopaActive, setIsCopaActive] = useState(false);

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
          {/* LIVE badge */}
          {isLive && (
            <motion.span
              className="copa-live-badge"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              🔴 AO VIVO
            </motion.span>
          )}

          {/* Ball */}
          <motion.span
            className="copa-ball"
            animate={isLive ? { rotate: [0, 360] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            ⚽
          </motion.span>

          {/* Match info */}
          <span className="copa-match-text">
            {isLive
              ? `${match.home} — Acontecendo agora!`
              : `${match.home} · ${dateStr}, ${timeStr}`
            }
          </span>

          {/* Countdown */}
          {!isLive && timeLeft && (
            <span className="copa-countdown">
              em {timeLeft}
            </span>
          )}

          {/* Venue — oculto no PWA */}
          <span className="copa-venue">
            📍 {match.venue}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
