/**
 * PlanContext — Contexto de Plano e Identidade do Cliente
 *
 * Carrega do Appwrite:
 *   - Plano ativo do cliente (basic | intermediate | premium)
 *   - Configurações de identidade (nome, logo, cores)
 *
 * Expõe para toda a aplicação:
 *   - hasFeature(featureName): boolean
 *   - currentPlan: string
 *   - clientConfig: object
 *   - planInfo: metadados do plano atual
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { PLANS, PLAN_FEATURES, PLAN_INFO, isFeatureInPlan } from '../config/plans';
import { DEFAULT_CLIENT_CONFIG, mergeClientConfig, applyClientTheme } from '../config/clientConfig';
import { getSettings } from '../services/settingsService';

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
  const [currentPlan, setCurrentPlan]     = useState(PLANS.BASIC);
  const [clientConfig, setClientConfig]   = useState(DEFAULT_CLIENT_CONFIG);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    loadPlanAndConfig();
  }, []);

  async function loadPlanAndConfig() {
    try {
      const settings = await getSettings();

      // Carrega o plano ativo (padrão: basic se não configurado)
      const plan = settings.active_plan ?? PLANS.BASIC;
      const validPlan = Object.values(PLANS).includes(plan) ? plan : PLANS.BASIC;
      setCurrentPlan(validPlan);

      // Carrega e mescla a identidade do cliente
      const remoteConfig = settings.client_config
        ? (typeof settings.client_config === 'string'
            ? JSON.parse(settings.client_config)
            : settings.client_config)
        : {};

      const merged = mergeClientConfig({ ...remoteConfig, active_plan: validPlan });
      setClientConfig(merged);

      // Aplica as cores do cliente como CSS variables globais
      applyClientTheme(merged);
    } catch (err) {
      // Em caso de erro, mantém os valores padrão silenciosamente
      console.warn('[PlanContext] Não foi possível carregar configurações:', err.message);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Verifica se uma feature está disponível no plano atual
   * @param {string} feature - Constante de FEATURES
   * @returns {boolean}
   */
  function hasFeature(feature) {
    return isFeatureInPlan(currentPlan, feature);
  }

  const value = {
    currentPlan,
    clientConfig,
    planInfo: PLAN_INFO[currentPlan],
    hasFeature,
    loading,
    refreshPlan: loadPlanAndConfig,
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlanContext() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlanContext deve ser usado dentro de <PlanProvider>');
  return ctx;
}
