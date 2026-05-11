/**
 * liveScoreService — Placar ao vivo via ESPN API pública
 * Sem necessidade de chave de API.
 */

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

/**
 * Busca partidas ao vivo da Copa do Mundo.
 * Retorna o placar da primeira partida em andamento, ou null.
 * @returns {Promise<{ home: string, away: string, homeTeam: string, awayTeam: string, clock: string } | null>}
 */
export async function fetchWorldCupLiveScore() {
  try {
    const res = await fetch(ESPN_URL, { cache: 'no-store' });
    if (!res.ok) return null;

    const data = await res.json();
    const events = data.events || [];

    // Procura partida com estado 'in' (em andamento)
    const live = events.find(e => e.status?.type?.state === 'in');
    if (!live) return null;

    const comp = live.competitions?.[0];
    if (!comp) return null;

    const home = comp.competitors?.find(c => c.homeAway === 'home');
    const away = comp.competitors?.find(c => c.homeAway === 'away');

    return {
      home:     home?.score ?? '0',
      away:     away?.score ?? '0',
      homeTeam: home?.team?.abbreviation || home?.team?.shortDisplayName || '',
      awayTeam: away?.team?.abbreviation || away?.team?.shortDisplayName || '',
      clock:    live.status?.displayClock || '',
      period:   live.status?.period || 1,
    };
  } catch {
    return null;
  }
}
