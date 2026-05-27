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

// Copa do Mundo 2026 — Jogos do Brasil — Grupo C
// Horários em BRT (UTC-3). Atualizado via ESPN API diariamente a partir de 11/06.
export const COPA_MATCHES = [
  {
    id: 1,
    home: 'Brasil 🇧🇷',
    away: 'Marrocos 🇲🇦',
    date: '2026-06-13T19:00:00-03:00',
    venue: 'MetLife Stadium, Nova Jersey',
    group: 'Fase de Grupos — Grupo C'
  },
  {
    id: 2,
    home: 'Brasil 🇧🇷',
    away: 'Haiti 🇭🇹',
    date: '2026-06-19T21:30:00-03:00',
    venue: 'Lincoln Financial Field, Filadélfia',
    group: 'Fase de Grupos — Grupo C'
  },
  {
    id: 3,
    home: 'Escócia 🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    away: 'Brasil 🇧🇷',
    date: '2026-06-24T19:00:00-03:00',
    venue: 'Hard Rock Stadium, Miami',
    group: 'Fase de Grupos — Grupo C'
  },
];

// Cache em memória para sobrescrever com dados vindos do Appwrite (via update-copa-schedule)
let _dynamicMatches = null;

export function setDynamicCopaMatches(matches) {
  if (Array.isArray(matches) && matches.length > 0) _dynamicMatches = matches;
}

/**
 * Retorna o próximo jogo do Brasil.
 * Usa dados dinâmicos do Appwrite se disponíveis, senão usa array estático.
 * @param {Date} [now=new Date()]
 * @returns {object|null}
 */
export function getNextCopaMatch(now = new Date()) {
  const source = _dynamicMatches ?? COPA_MATCHES;
  return source.find(m => new Date(m.date) > now) ?? null;
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
 * Filtra banners sazonais:
 * - Banners sem season_tag aparecem sempre
 * - Banners com season_tag só aparecem se a estação deles estiver ativa
 * @param {Array} banners
 * @param {string|null} [seasonId]
 * @returns {Array}
 */
export function getSeasonalBanners(banners = [], seasonId = null) {
  const activeSeason = seasonId ?? getCurrentSeason()?.id ?? null;

  return banners.filter(b => {
    const tag = b.season_tag || '';
    if (!tag) return true;           // sem tag → sempre visível
    return tag === activeSeason;     // com tag → só na estação correta
  });
}
