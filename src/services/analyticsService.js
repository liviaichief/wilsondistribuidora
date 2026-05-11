/**
 * analyticsService — Análise Comportamental do Cliente
 *
 * Feature Premium: registra eventos de comportamento (visualizações,
 * adições ao carrinho, abandono) e calcula insights de compra.
 *
 * Guardado por <FeatureGate feature={FEATURES.BEHAVIOR_ANALYTICS}>
 *
 * Requer collection "client_behavior" no Appwrite com campos:
 *   user_id (string), event (string), product_id (string),
 *   metadata (string/JSON), timestamp (string)
 */

import { databases, DATABASE_ID } from '../lib/appwrite';
import { ID } from 'appwrite';

const COLLECTION_BEHAVIOR = 'client_behavior';

// Tipos de eventos suportados
export const ANALYTICS_EVENTS = {
  PRODUCT_VIEW:     'product_view',
  ADD_TO_CART:      'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  CART_ABANDON:     'cart_abandon',
  ORDER_COMPLETE:   'order_complete',
  UPSELL_SHOWN:     'upsell_shown',
  UPSELL_ACCEPTED:  'upsell_accepted',
};

/**
 * Registra um evento de comportamento do usuário
 * Falha silenciosamente — nunca deve interromper o fluxo principal
 *
 * @param {string} userId - ID do usuário (ou 'anonymous')
 * @param {string} event  - Constante de ANALYTICS_EVENTS
 * @param {Object} [metadata] - Dados extras (product_id, quantity, etc.)
 */
export async function trackEvent(userId, event, metadata = {}) {
  try {
    await databases.createDocument(DATABASE_ID, COLLECTION_BEHAVIOR, ID.unique(), {
      user_id:   userId ?? 'anonymous',
      event,
      metadata:  JSON.stringify(metadata),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Analíticos nunca devem quebrar a experiência do usuário
    console.debug('[analyticsService] trackEvent falhou silenciosamente:', err.message);
  }
}

/**
 * Retorna insights de compra de um usuário específico
 * Agrupa eventos por produto e calcula frequência e última interação
 *
 * @param {string} userId
 * @returns {{ productId: string, views: number, purchases: number, lastSeen: string }[]}
 */
export async function getUserInsights(userId) {
  try {
    const { Query } = await import('appwrite');
    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_BEHAVIOR, [
      Query.equal('user_id', userId),
      Query.orderDesc('timestamp'),
      Query.limit(200),
    ]);

    const byProduct = {};
    response.documents.forEach(doc => {
      let meta = {};
      try { meta = JSON.parse(doc.metadata || '{}'); } catch { /* ignore */ }
      const pid = meta.product_id;
      if (!pid) return;

      if (!byProduct[pid]) byProduct[pid] = { productId: pid, views: 0, purchases: 0, lastSeen: doc.timestamp };
      if (doc.event === ANALYTICS_EVENTS.PRODUCT_VIEW)   byProduct[pid].views++;
      if (doc.event === ANALYTICS_EVENTS.ORDER_COMPLETE) byProduct[pid].purchases++;
    });

    return Object.values(byProduct).sort((a, b) => b.purchases - a.purchases || b.views - a.views);
  } catch (err) {
    console.warn('[analyticsService] getUserInsights falhou:', err.message);
    return [];
  }
}
