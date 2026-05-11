import { useEffect } from 'react';
import { getCurrentSeason } from '../../services/seasonalService';
import { getSettings } from '../../services/dataService';
import '../../styles/seasonal.css';

/**
 * Lê active_season do Appwrite settings (ou detecta pela data)
 * e aplica data-season="copa|natal|..." no <body> para ativar
 * o tema CSS da temporada correspondente.
 */
export default function SeasonalThemeInjector() {
  useEffect(() => {
    const applyTheme = async () => {
      try {
        const settings = await getSettings();
        const seasonId = settings.active_season || getCurrentSeason()?.id || '';
        document.body.setAttribute('data-season', seasonId);
      } catch {
        const auto = getCurrentSeason();
        document.body.setAttribute('data-season', auto?.id || '');
      }
    };

    applyTheme();

    return () => {
      document.body.removeAttribute('data-season');
    };
  }, []);

  return null;
}
