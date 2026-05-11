/**
 * auditService — Log de ações administrativas
 *
 * Registra ações críticas feitas por admins para rastreabilidade.
 * Ex: deletar produto, cancelar pedido, alterar configurações.
 *
 * Os logs são salvos na collection 'audit_logs' do Appwrite (se existir).
 * Se a collection não existir, os logs vão apenas ao console — sem quebrar o fluxo.
 */

import { databases, DATABASE_ID } from '../lib/appwrite';
import { ID, Permission, Role } from 'appwrite';

// Tipos de ação padronizados para facilitar filtros e buscas
export const AUDIT_ACTIONS = {
  PRODUCT_CREATE:   'product.create',
  PRODUCT_UPDATE:   'product.update',
  PRODUCT_DELETE:   'product.delete',
  ORDER_STATUS:     'order.status_change',
  BANNER_CREATE:    'banner.create',
  BANNER_DELETE:    'banner.delete',
  SETTINGS_CHANGE:  'settings.change',
  USER_ROLE_CHANGE: 'user.role_change',
  PLAN_CHANGE:      'plan.change',
};

/**
 * Registra uma ação administrativa
 * Falha silenciosamente se a collection não existir (não impede a ação principal)
 *
 * @param {string} userId - ID do admin que executou
 * @param {string} action - Uma das constantes AUDIT_ACTIONS
 * @param {string} target - ID ou nome do recurso afetado
 * @param {Object} [before] - Estado anterior (para updates)
 * @param {Object} [after]  - Novo estado (para updates)
 */
export const logAdminAction = async (userId, action, target, before = null, after = null) => {
  const entry = {
    user_id:    userId,
    action,
    target:     String(target),
    before:     before ? JSON.stringify(before) : null,
    after:      after  ? JSON.stringify(after)  : null,
    timestamp:  new Date().toISOString(),
  };

  // Sempre loga no console para debugging em desenvolvimento
  console.info(`[AUDIT] ${action} | target: ${target} | user: ${userId}`);

  try {
    await databases.createDocument(DATABASE_ID, 'audit_logs', ID.unique(), entry, [
      Permission.read(Role.team('admin')),
    ]);
  } catch (err) {
    // Collection pode não existir em instâncias sem esse recurso configurado
    if (err.code !== 404) {
      console.warn('[auditService] Não foi possível salvar log:', err.message);
    }
  }
};
