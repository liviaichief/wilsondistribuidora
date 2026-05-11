import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const TEAM_INFO = {
  'Brasil':             { code: 'BRA', flag: '🇧🇷' },
  'México':             { code: 'MEX', flag: '🇲🇽' },
  'África do Sul':      { code: 'ÁFR', flag: '🇿🇦' },
  'Marrocos':           { code: 'MAR', flag: '🇲🇦' },
  'Haiti':              { code: 'HAI', flag: '🇭🇹' },
  'Escócia':            { code: 'ESC', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  'Canadá':             { code: 'CAN', flag: '🇨🇦' },
  'Bósnia':             { code: 'BOS', flag: '🇧🇦' },
  'Catar':              { code: 'CAT', flag: '🇶🇦' },
  'Suíça':              { code: 'SUI', flag: '🇨🇭' },
  'Coreia do Sul':      { code: 'COR', flag: '🇰🇷' },
  'República Tcheca':   { code: 'TCH', flag: '🇨🇿' },
  'Argentina':          { code: 'ARG', flag: '🇦🇷' },
  'Alemanha':           { code: 'ALE', flag: '🇩🇪' },
  'Espanha':            { code: 'ESP', flag: '🇪🇸' },
  'Portugal':           { code: 'POR', flag: '🇵🇹' },
  'França':             { code: 'FRA', flag: '🇫🇷' },
  'Inglaterra':         { code: 'ING', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'Japão':              { code: 'JAP', flag: '🇯🇵' },
  'Estados Unidos':     { code: 'EUA', flag: '🇺🇸' },
};

function getTeam(name) {
  return TEAM_INFO[name] ?? { code: name?.slice(0, 3).toUpperCase() ?? '???', flag: '🏳️' };
}

function getNextMatch(schedule) {
  const now = new Date();
  if (!schedule?.length) return null;

  // Se há jogo ao vivo, retorna ele
  const live = schedule.find(m => {
    const start = new Date(`${m.date}T${m.time}:00`);
    const end   = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return now >= start && now <= end;
  });
  if (live) return { ...live, isLive: true };

  // Próximo jogo futuro
  const next = schedule
    .filter(m => new Date(`${m.date}T${m.time}:00`) > now)
    .sort((a, b) => new Date(`${a.date}T${a.time}:00`) - new Date(`${b.date}T${b.time}:00`))[0];
  return next ? { ...next, isLive: false } : null;
}

export default function CopaWidget() {
  const { theme, isLive: globalLive, schedule } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [match, setMatch]         = useState(null);

  useEffect(() => {
    setMatch(getNextMatch(schedule));
    const id = setInterval(() => setMatch(getNextMatch(schedule)), 60000);
    return () => clearInterval(id);
  }, [schedule]);

  if (theme !== 'world_cup' || !match) return null;

  const isLive    = globalLive || match.isLive;
  const team1     = getTeam(match.team1);
  const team2     = getTeam(match.team2);
  const matchDate = new Date(`${match.date}T${match.time}:00`);
  const dateLabel = `${matchDate.getDate().toString().padStart(2, '0')}/${(matchDate.getMonth() + 1).toString().padStart(2, '0')} · ${match.time}h`;

  return (
    <motion.div
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 180 }}
      style={{
        position: 'absolute',
        left: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Card principal */}
      <div style={{
        background: 'rgba(0, 30, 10, 0.92)',
        border: `2px solid ${isLive ? '#ff3b3b' : '#009c3b'}`,
        borderRadius: '16px',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        boxShadow: isLive
          ? '0 0 20px rgba(255,59,59,0.4), 0 8px 30px rgba(0,0,0,0.6)'
          : '0 0 20px rgba(0,156,59,0.3), 0 8px 30px rgba(0,0,0,0.6)',
        minWidth: '90px',
        transition: 'border-color 0.3s',
      }}>
        {/* Topo: AO VIVO + colapsar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: isLive ? 'rgba(255,59,59,0.15)' : 'rgba(0,156,59,0.1)',
          borderBottom: `1px solid ${isLive ? 'rgba(255,59,59,0.3)' : 'rgba(0,156,59,0.3)'}`,
          gap: '6px',
        }}>
          {isLive ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <motion.div
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff3b3b', boxShadow: '0 0 6px #ff3b3b' }}
              />
              <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#ff3b3b', letterSpacing: '1px' }}>AO VIVO</span>
            </div>
          ) : (
            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#009c3b', letterSpacing: '0.5px' }}>PRÓXIMO</span>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '0', display: 'flex', lineHeight: 1 }}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {/* Conteúdo */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{
                padding: '12px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}>
                {/* Time 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                  <span style={{ fontSize: '2rem', lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                    {team1.flag}
                  </span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#fff', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {team1.code}
                  </span>
                </div>

                {/* VS */}
                <span style={{
                  fontSize: '0.6rem', fontWeight: 900, color: '#FEDD00',
                  background: 'rgba(254,221,0,0.1)', padding: '2px 8px',
                  borderRadius: '4px', letterSpacing: '1px',
                }}>
                  VS
                </span>

                {/* Time 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                  <span style={{ fontSize: '2rem', lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                    {team2.flag}
                  </span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#fff', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {team2.code}
                  </span>
                </div>
              </div>

              {/* Data/hora */}
              <div style={{
                background: '#FEDD00',
                padding: '5px 10px',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000', letterSpacing: '0.5px' }}>
                  {dateLabel}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
