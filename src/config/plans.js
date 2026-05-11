/**
 * Sistema de Planos e Feature Flags
 *
 * Define os 3 planos de assinatura do produto e quais funcionalidades
 * cada plano inclui. Usado por PlanContext e FeatureGate para controlar
 * o que é exibido para cada cliente.
 *
 * Para adicionar uma nova feature:
 * 1. Adicione a constante em FEATURES
 * 2. Adicione nos planos que devem ter acesso em PLAN_FEATURES
 * 3. Use <FeatureGate feature={FEATURES.SUA_FEATURE}> no componente
 */

// Identificadores únicos de cada funcionalidade do sistema
export const FEATURES = {
  // ── Básico ────────────────────────────────────────────────────────────────
  DIGITAL_CATALOG:       'digital_catalog',       // Catálogo digital com logo e cores
  WHATSAPP_ORDER:        'whatsapp_order',         // Envio de pedido via WhatsApp
  REPEAT_ORDER:          'repeat_order',           // Refazer pedido do histórico
  BASIC_UPSELL:          'basic_upsell',           // Upsell simples (sem grupos)
  BASIC_ADMIN:           'basic_admin',            // Painel admin: produtos e preços
  WHATSAPP_SUPPORT:      'whatsapp_support',       // Suporte via WhatsApp

  // ── Intermediário ─────────────────────────────────────────────────────────
  AI_DESCRIPTIONS:       'ai_descriptions',        // IA para descrições de produtos (GPT-4o-mini)
  ADVANCED_UPSELL:       'advanced_upsell',        // Upsell avançado com grupos de produtos
  FULL_CUSTOMIZATION:    'full_customization',     // Logo, banners e cores completas
  BASIC_DASHBOARD:       'basic_dashboard',        // Dashboard básico de vendas
  PUBLIC_MINI_SITE:      'public_mini_site',       // Página pública da loja
  BANNER_MANUAL:         'banner_manual',          // Upload manual de banners

  // ── Premium ───────────────────────────────────────────────────────────────
  BBQ_MASTER_AI:         'bbq_master_ai',          // Chat IA Mestre do Churrasco
  BEHAVIOR_ANALYTICS:    'behavior_analytics',     // Análise comportamental do cliente
  SEASONAL_TRIGGERS:     'seasonal_triggers',      // Gatilhos sazonais (Copa, Natal, etc.)
  AI_BANNER_GENERATION:  'ai_banner_generation',   // Geração de banners com DALL-E 3
  GOOGLE_ASSISTANT:      'google_assistant',       // Configuração Google Business + Merchant
  ADVANCED_DASHBOARD:    'advanced_dashboard',     // Dashboard avançado com relatórios
  PRIORITY_SUPPORT:      'priority_support',       // Suporte prioritário
};

// Identificadores dos planos comerciais
export const PLANS = {
  BASIC:        'basic',
  INTERMEDIATE: 'intermediate',
  PREMIUM:      'premium',
};

// Metadados exibidos na interface de gestão de planos
export const PLAN_INFO = {
  [PLANS.BASIC]: {
    name:        'Plano Básico',
    price:       200,
    description: 'Açougues tradicionais que querem praticidade',
    color:       '#6B7280',
    badge:       'Básico',
  },
  [PLANS.INTERMEDIATE]: {
    name:        'Plano Intermediário',
    price:       300,
    description: 'Açougues em crescimento que querem aumentar vendas',
    color:       '#3B82F6',
    badge:       'Intermediário',
  },
  [PLANS.PREMIUM]: {
    name:        'Plano Premium',
    price:       400,
    description: 'Boutiques de carne premium que querem o máximo',
    color:       '#D4AF37',
    badge:       'Premium',
  },
};

// Mapeamento de qual plano dá acesso a quais features
// Planos superiores herdam todas as features dos planos inferiores
const BASIC_FEATURES = [
  FEATURES.DIGITAL_CATALOG,
  FEATURES.WHATSAPP_ORDER,
  FEATURES.REPEAT_ORDER,
  FEATURES.BASIC_UPSELL,
  FEATURES.BASIC_ADMIN,
  FEATURES.WHATSAPP_SUPPORT,
];

const INTERMEDIATE_FEATURES = [
  ...BASIC_FEATURES,
  FEATURES.AI_DESCRIPTIONS,
  FEATURES.ADVANCED_UPSELL,
  FEATURES.FULL_CUSTOMIZATION,
  FEATURES.BASIC_DASHBOARD,
  FEATURES.PUBLIC_MINI_SITE,
  FEATURES.BANNER_MANUAL,
];

const PREMIUM_FEATURES = [
  ...INTERMEDIATE_FEATURES,
  FEATURES.BBQ_MASTER_AI,
  FEATURES.BEHAVIOR_ANALYTICS,
  FEATURES.SEASONAL_TRIGGERS,
  FEATURES.AI_BANNER_GENERATION,
  FEATURES.GOOGLE_ASSISTANT,
  FEATURES.ADVANCED_DASHBOARD,
  FEATURES.PRIORITY_SUPPORT,
];

export const PLAN_FEATURES = {
  [PLANS.BASIC]:        BASIC_FEATURES,
  [PLANS.INTERMEDIATE]: INTERMEDIATE_FEATURES,
  [PLANS.PREMIUM]:      PREMIUM_FEATURES,
};

// Descrições legíveis das features para exibição na UI de planos
export const FEATURE_LABELS = {
  [FEATURES.DIGITAL_CATALOG]:      { label: 'Catálogo Digital',               icon: '📋', group: 'Loja' },
  [FEATURES.WHATSAPP_ORDER]:       { label: 'Pedido via WhatsApp',             icon: '💬', group: 'Loja' },
  [FEATURES.REPEAT_ORDER]:         { label: 'Refazer Pedido',                  icon: '🔄', group: 'Loja' },
  [FEATURES.BASIC_UPSELL]:         { label: 'Sugestões Simples',               icon: '💡', group: 'Vendas' },
  [FEATURES.BASIC_ADMIN]:          { label: 'Painel Admin Básico',             icon: '⚙️', group: 'Admin' },
  [FEATURES.WHATSAPP_SUPPORT]:     { label: 'Suporte via WhatsApp',            icon: '🆘', group: 'Suporte' },
  [FEATURES.AI_DESCRIPTIONS]:      { label: 'IA para Descrições',              icon: '✍️', group: 'IA' },
  [FEATURES.ADVANCED_UPSELL]:      { label: 'Upsell Avançado (Grupos)',        icon: '🎯', group: 'Vendas' },
  [FEATURES.FULL_CUSTOMIZATION]:   { label: 'Personalização Completa',         icon: '🎨', group: 'Visual' },
  [FEATURES.BASIC_DASHBOARD]:      { label: 'Dashboard de Vendas',             icon: '📊', group: 'Admin' },
  [FEATURES.PUBLIC_MINI_SITE]:     { label: 'Mini Site Público',               icon: '🌐', group: 'Loja' },
  [FEATURES.BANNER_MANUAL]:        { label: 'Banners Manuais',                 icon: '🖼️', group: 'Visual' },
  [FEATURES.BBQ_MASTER_AI]:        { label: 'Mestre do Churrasco (Chat IA)',   icon: '🔥', group: 'IA' },
  [FEATURES.BEHAVIOR_ANALYTICS]:   { label: 'Análise Comportamental',          icon: '📈', group: 'Analytics' },
  [FEATURES.SEASONAL_TRIGGERS]:    { label: 'Gatilhos Sazonais',               icon: '🎉', group: 'Vendas' },
  [FEATURES.AI_BANNER_GENERATION]: { label: 'Banners com IA (DALL-E)',         icon: '🤖', group: 'IA' },
  [FEATURES.GOOGLE_ASSISTANT]:     { label: 'Assistente Google Business',      icon: '🔍', group: 'Integrações' },
  [FEATURES.ADVANCED_DASHBOARD]:   { label: 'Dashboard Avançado + Relatórios', icon: '📉', group: 'Admin' },
  [FEATURES.PRIORITY_SUPPORT]:     { label: 'Suporte Prioritário',             icon: '⭐', group: 'Suporte' },
};

/**
 * Verifica se uma feature está disponível em um plano específico
 * @param {string} plan - Um dos valores de PLANS
 * @param {string} feature - Um dos valores de FEATURES
 * @returns {boolean}
 */
export function isFeatureInPlan(plan, feature) {
  const features = PLAN_FEATURES[plan] ?? BASIC_FEATURES;
  return features.includes(feature);
}

/**
 * Retorna a lista de features disponíveis para um plano
 * @param {string} plan - Um dos valores de PLANS
 * @returns {string[]}
 */
export function getFeaturesForPlan(plan) {
  return PLAN_FEATURES[plan] ?? BASIC_FEATURES;
}
