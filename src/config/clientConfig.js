/**
 * Configuração de identidade do cliente
 *
 * Centraliza todos os dados de personalização de um cliente específico.
 * Esses dados são carregados do Appwrite settings (chave 'client_config')
 * e ficam disponíveis via hook useClientConfig().
 *
 * Ao implantar para um novo cliente, basta preencher essas configurações
 * via Admin → Configurações → Identidade do Cliente.
 */

// Valores padrão usados enquanto o Appwrite não carrega ou em desenvolvimento
export const DEFAULT_CLIENT_CONFIG = {
  // Identidade
  store_name:      'Meu Açougue',
  store_tagline:   'Carnes Premium de Qualidade',
  logo_url:        '',
  favicon_url:     '',

  // Paleta de cores (CSS custom properties aplicadas no :root)
  color_primary:   '#800020',   // Bordô padrão
  color_accent:    '#D4AF37',   // Dourado padrão
  color_bg:        '#1a1a1a',   // Fundo escuro padrão
  color_text:      '#F5F5F0',   // Texto claro padrão

  // Contato e redes
  whatsapp_number: '',
  instagram_url:   '',
  website_url:     '',

  // Localização
  city:            '',
  state:           '',
  address:         '',
  store_lat:       '',
  store_lng:       '',

  // Horário de funcionamento
  opening_hours:   'Seg-Sáb: 8h–19h | Dom: 8h–13h',

  // Plano ativo (sincronizado com PLANS do plans.js)
  active_plan:     'basic',
};

/**
 * Aplica as cores do cliente como CSS custom properties no :root
 * Chamado pelo PlanContext após carregar as configurações do Appwrite
 * @param {Object} config - Objeto com as cores do cliente
 */
export function applyClientTheme(config) {
  const root = document.documentElement;
  if (config.color_primary) root.style.setProperty('--color-primary', config.color_primary);
  if (config.color_accent)  root.style.setProperty('--color-accent',  config.color_accent);
  if (config.color_bg)      root.style.setProperty('--color-bg',      config.color_bg);
  if (config.color_text)    root.style.setProperty('--color-text',    config.color_text);
}

/**
 * Mescla configurações do Appwrite com os valores padrão
 * Garante que campos ausentes sempre tenham um fallback seguro
 * @param {Object} remoteConfig - Dados carregados do Appwrite
 * @returns {Object} Configuração completa do cliente
 */
export function mergeClientConfig(remoteConfig) {
  return { ...DEFAULT_CLIENT_CONFIG, ...remoteConfig };
}
