import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { fetchWorldCupLiveScore } from '../../services/liveScoreService';

const TEAM_INFO = {
  'Brasil':             { code: 'BRA', iso: 'br' },
  'México':             { code: 'MEX', iso: 'mx' },
  'África do Sul':      { code: 'ÁFR', iso: 'za' },
  'Marrocos':           { code: 'MAR', iso: 'ma' },
  'Haiti':              { code: 'HAI', iso: 'ht' },
  'Escócia':            { code: 'ESC', iso: 'gb-sct' },
  'Canadá':             { code: 'CAN', iso: 'ca' },
  'Bósnia':             { code: 'BOS', iso: 'ba' },
  'Catar':              { code: 'CAT', iso: 'qa' },
  'Suíça':              { code: 'SUI', iso: 'ch' },
  'Coreia do Sul':      { code: 'COR', iso: 'kr' },
  'República Tcheca':   { code: 'TCH', iso: 'cz' },
  'Argentina':          { code: 'ARG', iso: 'ar' },
  'Alemanha':           { code: 'ALE', iso: 'de' },
  'Espanha':            { code: 'ESP', iso: 'es' },
  'Portugal':           { code: 'POR', iso: 'pt' },
  'França':             { code: 'FRA', iso: 'fr' },
  'Inglaterra':         { code: 'ING', iso: 'gb-eng' },
  'Japão':              { code: 'JAP', iso: 'jp' },
  'Estados Unidos':     { code: 'EUA', iso: 'us' },
  'Uruguai':            { code: 'URU', iso: 'uy' },
  'Colômbia':           { code: 'COL', iso: 'co' },
  'Equador':            { code: 'EQU', iso: 'ec' },
  'Austrália':          { code: 'AUS', iso: 'au' },
  'Holanda':            { code: 'HOL', iso: 'nl' },
  'Bélgica':            { code: 'BEL', iso: 'be' },
  'Croácia':            { code: 'CRO', iso: 'hr' },
  'Senegal':            { code: 'SEN', iso: 'sn' },
  'Gana':               { code: 'GHA', iso: 'gh' },
  'Nigéria':            { code: 'NIG', iso: 'ng' },
  'Camarões':           { code: 'CAM', iso: 'cm' },
};

function getTeam(name) {
  return TEAM_INFO[name] ?? { code: name?.slice(0, 3).toUpperCase() ?? '???', iso: null };
}

function FlagImage({ iso, code }) {
  if (!iso) return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', fontSize: '0.7rem', color: '#fff', fontWeight: 900 }}>
      {code}
    </div>
  );
  return (
    <img
      src={`https://flagcdn.com/w80/${iso}.png`}
      alt={code}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
}

function getNextMatch(schedule) {
  const now = new Date();
  if (!schedule?.length) return null;

  const live = schedule.find(m => {
    const start = new Date(`${m.date}T${m.time}:00`);
    const end   = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return now >= start && now <= end;
  });
  if (live) return { ...live, isLive: true };

  const next = schedule
    .filter(m => new Date(`${m.date}T${m.time}:00`) > now)
    .sort((a, b) => new Date(`${a.date}T${a.time}:00`) - new Date(`${b.date}T${b.time}:00`))[0];
  return next ? { ...next, isLive: false } : null;
}

export default function CopaWidget() {
  const { theme, isLive: globalLive, schedule } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [match, setMatch]         = useState(null);
  const [liveScore, setLiveScore] = useState(null);

  useEffect(() => {
    setMatch(getNextMatch(schedule));
    const id = setInterval(() => setMatch(getNextMatch(schedule)), 60000);
    return () => clearInterval(id);
  }, [schedule]);

  const isLive = globalLive || match?.isLive;

  // Busca placar online a cada 60s quando há jogo ao vivo
  useEffect(() => {
    if (!isLive) { setLiveScore(null); return; }

    const poll = async () => {
      const score = await fetchWorldCupLiveScore();
      setLiveScore(score);
    };

    poll();
    const id = setInterval(poll, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [isLive]);

  if (theme !== 'world_cup' || !match) return null;

  const team1     = getTeam(match.team1);
  const team2     = getTeam(match.team2);
  const matchDate = new Date(`${match.date}T${match.time}:00`);
  const dateLabel = `${matchDate.getDate().toString().padStart(2, '0')}/${(matchDate.getMonth() + 1).toString().padStart(2, '0')} · ${match.time}h`;

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .copa-widget { transform: scale(0.65); transform-origin: top left; }
        }
      `}</style>
    <motion.div
      className="copa-widget"
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 180 }}
      style={{
        position: 'absolute',
        left: '16px',
        top: '16px',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{
        background: 'rgba(0, 30, 10, 0.92)',
        border: `2px solid ${isLive ? '#ff3b3b' : '#FEDD00'}`,
        borderRadius: '20px',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        boxShadow: isLive
          ? '0 0 26px rgba(255,59,59,0.4), 0 10px 38px rgba(0,0,0,0.6)'
          : '0 0 26px rgba(254,221,0,0.25), 0 10px 38px rgba(0,0,0,0.6)',
        minWidth: '117px',
        transition: 'border-color 0.3s',
      }}>
        {/* Topo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 13px',
          background: isLive ? 'rgba(255,59,59,0.15)' : 'rgba(0,156,59,0.1)',
          borderBottom: `1px solid ${isLive ? 'rgba(255,59,59,0.3)' : 'rgba(0,156,59,0.3)'}`,
          gap: '6px',
        }}>
          {isLive ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <motion.div
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ff3b3b', boxShadow: '0 0 8px #ff3b3b' }}
              />
              <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#ff3b3b', letterSpacing: '1px' }}>AO VIVO</span>
            </div>
          ) : (
            <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#009c3b', letterSpacing: '0.5px' }}>COPA</span>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '0', display: 'flex', lineHeight: 1 }}
          >
            {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{
                padding: '16px 13px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}>
                {/* Time 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '72px', height: '48px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <FlagImage iso={team1.iso} code={team1.code} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', letterSpacing: '1px' }}>
                    {team1.code}
                  </span>
                </div>

                {/* Placar ao vivo (ESPN) ou VS */}
                {isLive && liveScore ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <motion.div
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{
                        background: 'rgba(255,59,59,0.15)',
                        border: '1px solid rgba(255,59,59,0.4)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', lineHeight: 1, minWidth: '22px', textAlign: 'center' }}>{liveScore.home}</span>
                      <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)' }}>×</span>
                      <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', lineHeight: 1, minWidth: '22px', textAlign: 'center' }}>{liveScore.away}</span>
                    </motion.div>
                    {liveScore.clock ? (
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#ff3b3b', letterSpacing: '1px' }}>
                        {liveScore.clock}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#ff3b3b', letterSpacing: '1px' }}>PLACAR</span>
                    )}
                  </div>
                ) : (
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 900, color: '#FEDD00',
                    background: 'rgba(254,221,0,0.1)', padding: '3px 10px',
                    borderRadius: '4px', letterSpacing: '1px',
                  }}>
                    VS
                  </span>
                )}

                {/* Time 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '72px', height: '48px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <FlagImage iso={team2.iso} code={team2.code} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', letterSpacing: '1px' }}>
                    {team2.code}
                  </span>
                </div>
              </div>

              {/* Data/hora */}
              <div style={{ background: '#FEDD00', padding: '7px 13px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#000', letterSpacing: '0.5px' }}>
                  {isLive ? '⚽ EM ANDAMENTO' : dateLabel}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
    </>
  );
}
