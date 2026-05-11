/**
 * usePlan — Hook de acesso ao sistema de planos
 *
 * Atalho para consumir o PlanContext. Use este hook nos componentes
 * que precisam verificar se uma feature está disponível.
 *
 * @example
 * const { hasFeature, currentPlan } = usePlan();
 * if (!hasFeature(FEATURES.BBQ_MASTER_AI)) return null;
 */

import { usePlanContext } from '../context/PlanContext';

export function usePlan() {
  return usePlanContext();
}
