import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSettings } from '../services/dataService';

const ThemeContext = createContext({
  theme: 'none',
  isLive: false,
  schedule: [],
  liveScore: null,
  reloadTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme]           = useState('none');
  const [isLive, setIsLive]         = useState(false);
  const [schedule, setSchedule]     = useState([]);
  const [liveScore, setLiveScore]   = useState(null);

  const loadTheme = useCallback(async () => {
    try {
      const s = await getSettings();
      const activeTheme = s.active_theme || 'none';
      const forceLive   = s.world_cup_force_live === true || s.world_cup_force_live === 'true';

      let sched = [];
      try {
        if (s.world_cup_schedule) {
          sched = typeof s.world_cup_schedule === 'string'
            ? JSON.parse(s.world_cup_schedule)
            : s.world_cup_schedule;
        }
      } catch { /* malformed JSON — use empty */ }

      setTheme(activeTheme);
      setSchedule(sched);

      // Placar ao vivo (formato "2-1" ou "0-0")
      const score = s.world_cup_live_score || null;
      setLiveScore(score);

      // Detecta jogo ao vivo (janela de 2h)
      const now = new Date();
      const live = sched.some(m => {
        const start = new Date(`${m.date}T${m.time}:00`);
        const end   = new Date(start.getTime() + 2 * 60 * 60 * 1000);
        return now >= start && now <= end;
      });
      setIsLive(forceLive || live);

      document.body.setAttribute('data-theme', activeTheme);
    } catch {
      document.body.setAttribute('data-theme', 'none');
    }
  }, []);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  return (
    <ThemeContext.Provider value={{ theme, isLive, schedule, liveScore, reloadTheme: loadTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
