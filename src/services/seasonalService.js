/**
 * seasonalService — Gatilhos Sazonais
 *
 * Identifica o evento sazonal atual e filtra banners/promoções
 * de acordo com a data e configurações.
 */

// Eventos sazonais pré-definidos com datas aproximadas
const SEASONAL_EVENTS = [
  { id: 'natal',         name: 'Natal',              startMonth: 12, startDay: 1,  endMonth: 12, endDay: 31, emoji: '🎄' },
  { id: 'carnaval',      name: 'Carnaval',            startMonth: 2,  startDay: 1,  endMonth: 2,  endDay: 28, emoji: '🎉' },
  { id: 'dia_dos_pais',  name: 'Dia dos Pais',        startMonth: 8,  startDay: 1,  endMonth: 8,  endDay: 14, emoji: '👨' },
  { id: 'dia_das_maes',  name: 'Dia das Mães',        startMonth: 5,  startDay: 1,  endMonth: 5,  endDay: 14, emoji: '💐' },
  { id: 'copa',          name: 'Copa do Mundo',       startMonth: 6,  startDay: 1,  endMonth: 7,  endDay: 19, emoji: '⚽' },
  { id: 'sao_joao',      name: 'São João',            startMonth: 6,  startDay: 10, endMonth: 6,  endDay: 30, emoji: '🎆' },
  { id: 'ano_novo',      name: 'Réveillon',           startMonth: 12, startDay: 26, endMonth: 1,  endDay: 2,  emoji: '🥂' },
];

// Copa do Mundo 2026 — Jogos do Brasil (atualizar conforme sorteio oficial)
export const COPA_MATCHES = [
  {
    id: 1,
    home: 'Brasil 🇧🇷',
    away: 'Grupo A — Jogo 1',
    date: '2026-06-14T18:00:00-03:00',
    venue: 'MetLife Stadium, NJ',
    group: 'Fase de Grupos'
  },
  {
    id: 2,
    home: 'Brasil 🇧🇷',
    away: 'Grupo A — Jogo 2',
    date: '2026-06-20T15:00:00-03:00',
    venue: 'AT&T Stadium, TX',
    group: 'Fase de Grupos'
  },
  {
    id: 3,
    home: 'Brasil 🇧🇷',
    away: 'Grupo A — Jogo 3',
    date: '2026-06-26T12:00:00-03:00',
    venue: 'SoFi Stadium, CA',
    group: 'Fase de Grupos'
  },
];

/**
 * Retorna o próximo jogo da Copa do Brasil
 * @param {Date} [now=new Date()]
 * @returns {object|null}
 */
export function getNextCopaMatch(now = new Date()) {
  return COPA_MATCHES.find(m => new Date(m.date) > now) ?? null;
}

/**
 * Retorna verdadeiro se o jogo está ocorrendo agora (janela de 2h)
 */
export function isCopaMatchLive(match, now = new Date()) {
  if (!match) return false;
  const start = new Date(match.date);
  const end   = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return now >= start && now <= end;
}

/**
 * Retorna o evento sazonal ativo para a data fornecida
 * @param {Date} [date=new Date()] - Data a verificar
 * @returns {{ id, name, emoji } | null}
 */
export function getCurrentSeason(date = new Date()) {
  const month = date.getMonth() + 1;
  const day   = date.getDate();

  return SEASONAL_EVENTS.find(event => {
    const afterStart = month > event.startMonth || (month === event.startMonth && day >= event.startDay);
    const beforeEnd  = month < event.endMonth  || (month === event.endMonth  && day <= event.endDay);
    return afterStart && beforeEnd;
  }) ?? null;
}

/**
 * Filtra banners para mostrar somente os do evento sazonal ativo
 * Se não houver evento ativo, retorna todos os banners
 * @param {Array} banners - Lista de banners (com campo season_tag opcional)
 * @param {string|null} [seasonId] - ID do evento (usa getCurrentSeason() se omitido)
 * @returns {Array} Banners filtrados
 */
export function getSeasonalBanners(banners = [], seasonId = null) {
  const activeSeason = seasonId ?? getCurrentSeason()?.id ?? null;
  if (!activeSeason) return banners;

  const seasonal = banners.filter(b => b.season_tag === activeSeason);
  return seasonal.length > 0 ? seasonal : banners;
}
