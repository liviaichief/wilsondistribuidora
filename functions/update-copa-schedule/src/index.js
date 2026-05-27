/**
 * update-copa-schedule — Appwrite Function
 *
 * Consulta a ESPN API para buscar os próximos jogos do Brasil na Copa do Mundo 2026
 * e salva o resultado em Appwrite settings (chave: copa_matches).
 *
 * Deve ser agendada para rodar diariamente a partir de 11/06/2026.
 *
 * ESPN endpoints usados:
 *   - Schedule: https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams/6/schedule
 *   - Scoreboard: https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
 */

import { Client, Databases } from 'node-appwrite';

const DATABASE_ID  = 'main_db';
const SETTINGS_COL = 'settings';

// ID do Brasil na ESPN (soccer)
const ESPN_BRAZIL_TEAM_ID = '6';
const ESPN_SCHEDULE_URL   = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams/${ESPN_BRAZIL_TEAM_ID}/schedule`;

// Fallback estático caso a ESPN esteja indisponível
const STATIC_MATCHES = [
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

const FLAG = { BRA: '🇧🇷', MAR: '🇲🇦', HAI: '🇭🇹', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', ARG: '🇦🇷', FRA: '🇫🇷', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', GER: '🇩🇪', ESP: '🇪🇸', POR: '🇵🇹', URU: '🇺🇾', MEX: '🇲🇽', USA: '🇺🇸', COL: '🇨🇴', ECU: '🇪🇨', PAR: '🇵🇾' };

function teamLabel(abbr, name) {
  const flag = FLAG[abbr] || '';
  return flag ? `${name} ${flag}` : name;
}

async function fetchFromESPN() {
  try {
    const res = await fetch(ESPN_SCHEDULE_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const data = await res.json();
    const events = data.events || [];

    const matches = events
      .filter(e => e.competitions?.[0])
      .map((e, i) => {
        const comp = e.competitions[0];
        const home = comp.competitors?.find(c => c.homeAway === 'home');
        const away = comp.competitors?.find(c => c.homeAway === 'away');
        const venue = comp.venue;

        return {
          id: i + 1,
          home: teamLabel(home?.team?.abbreviation, home?.team?.displayName || 'Casa'),
          away: teamLabel(away?.team?.abbreviation, away?.team?.displayName || 'Fora'),
          date: e.date,
          venue: venue ? `${venue.fullName}, ${venue.address?.city || ''}`.trim().replace(/,\s*$/, '') : '',
          group: e.season?.slug || 'Copa do Mundo 2026',
          status: e.status?.type?.state || 'pre',
          score: e.status?.type?.state === 'in' || e.status?.type?.state === 'post'
            ? `${home?.score ?? 0}-${away?.score ?? 0}`
            : null,
        };
      });

    return matches.length > 0 ? matches : null;
  } catch {
    return null;
  }
}

async function upsertSetting(db, key, value) {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  try {
    await db.updateDocument(DATABASE_ID, SETTINGS_COL, key, { value: str });
  } catch (err) {
    if (err.code === 404) {
      const { Permission, Role } = await import('node-appwrite');
      await db.createDocument(DATABASE_ID, SETTINGS_COL, key, { key, value: str }, [
        Permission.read(Role.any()),
      ]);
    } else {
      throw err;
    }
  }
}

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);

  log('Buscando agenda do Brasil na ESPN...');
  let matches = await fetchFromESPN();

  if (matches) {
    log(`ESPN retornou ${matches.length} jogos.`);
  } else {
    log('ESPN indisponível — usando fallback estático.');
    matches = STATIC_MATCHES;
  }

  await upsertSetting(db, 'copa_matches', matches);
  await upsertSetting(db, 'copa_matches_updated_at', new Date().toISOString());

  log(`✅ copa_matches atualizado com ${matches.length} jogos.`);
  return res.json({ success: true, count: matches.length, updated_at: new Date().toISOString() });
};
