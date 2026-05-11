/**
 * FeatureGate — Controle de acesso a funcionalidades por plano
 *
 * Renderiza filhos apenas se a feature estiver disponível no plano atual.
 * Opcionalmente exibe um componente de fallback (ex: card de upgrade).
 *
 * @example
 * // Esconde completamente se não disponível
 * <FeatureGate feature={FEATURES.BBQ_MASTER_AI}>
 *   <BBQMasterChat />
 * </FeatureGate>
 *
 * // Mostra card de upgrade como fallback
 * <FeatureGate feature={FEATURES.ADVANCED_DASHBOARD} fallback={<UpgradeCard />}>
 *   <AdvancedDashboard />
 * </FeatureGate>
 */

import { usePlan } from '../../hooks/usePlan';
import { PLAN_INFO, PLANS, PLAN_FEATURES, FEATURE_LABELS } from '../../config/plans';

// Plano mínimo que inclui cada feature (calculado dinamicamente)
function getMinPlanForFeature(feature) {
  const order = [PLANS.BASIC, PLANS.INTERMEDIATE, PLANS.PREMIUM];
  for (const plan of order) {
    if (PLAN_FEATURES[plan].includes(feature)) return plan;
  }
  return PLANS.PREMIUM;
}

// Card padrão exibido quando o plano não inclui a feature
function DefaultUpgradeCard({ feature }) {
  const featureLabel = FEATURE_LABELS[feature];
  const requiredPlan = getMinPlanForFeature(feature);
  const planInfo = PLAN_INFO[requiredPlan];

  return (
    <div className="feature-gate-upgrade-card">
      <div className="upgrade-icon">🔒</div>
      <p className="upgrade-feature-name">{featureLabel?.label ?? feature}</p>
      <p className="upgrade-description">
        Disponível a partir do{' '}
        <strong style={{ color: planInfo.color }}>{planInfo.name}</strong>
        {' '}— R$ {planInfo.price}/mês
      </p>
      <a
        href="https://wa.me/message/upgrade"
        target="_blank"
        rel="noreferrer"
        className="upgrade-cta-btn"
        style={{ borderColor: planInfo.color, color: planInfo.color }}
      >
        Fazer Upgrade
      </a>
    </div>
  );
}

export function FeatureGate({ feature, children, fallback = null, showUpgradeCard = false }) {
  const { hasFeature, loading } = usePlan();

  // Aguarda carregamento do plano para evitar flash de conteúdo incorreto
  if (loading) return null;

  if (hasFeature(feature)) return children;

  if (showUpgradeCard) return <DefaultUpgradeCard feature={feature} />;
  return fallback;
}
