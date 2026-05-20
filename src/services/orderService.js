/**
 * orderService — Operações de pedidos
 *
 * Criação, listagem e atualização de pedidos.
 * Inclui lógica de número sequencial (WD0001), decremento de estoque
 * e fallback via Appwrite Function quando disponível.
 */

import { databases, functions, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query, Permission, Role } from 'appwrite';

const PLACE_ORDER_FUNC_ID = import.meta.env.VITE_FUNC_PLACE_ORDER || 'place_order';

const sanitize = (val) => {
  if (typeof val !== 'string') return val;
  return val.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gim, '').replace(/javascript:/gim, '').trim();
};

// Gera o próximo número de pedido sequencial (WD0001, WD0002, ...)
const getNextOrderNumber = async () => {
  try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [
      Query.orderDesc('$createdAt'),
      Query.limit(100),
    ]);
    if (response.documents.length === 0) return 'WD0001';
    let maxNumber = 0;
    response.documents.forEach(doc => {
      if (doc.$id?.startsWith('WD')) {
        const parsed = parseInt(doc.$id.substring(2), 10);
        if (!isNaN(parsed) && parsed > maxNumber) maxNumber = parsed;
      }
    });
    return `WD${String(maxNumber + 1).padStart(4, '0')}`;
  } catch {
    return `WD${Date.now().toString().slice(-6)}`;
  }
};

// Decrementa estoque dos itens após pedido confirmado
const decrementStock = async (items) => {
  const itemList = typeof items === 'string' ? JSON.parse(items) : items;
  for (const item of itemList) {
    if (!item.id) continue;
    try {
      const product = await databases.getDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, item.id);
      if (!product.manage_stock) continue;
      const newStock = Math.max(0, (product.stock_quantity || 0) - item.quantity);
      const updates = { stock_quantity: newStock };
      if (newStock === 0 && product.disable_on_zero_stock) updates.active = false;
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, item.id, updates);
    } catch (err) {
      console.warn('[orderService] Falha ao decrementar estoque:', item.id, err.message);
    }
  }
};

/**
 * Cria um novo pedido
 * Tenta via Appwrite Function; se falhar, grava direto no banco
 * @param {Object} orderData - Dados do pedido
 * @returns {Object} { success, $id, order_number, status }
 */
export const createOrder = async (orderData) => {
  try {
    const payload = {
      customer_name:    sanitize(orderData.customer_name),
      customer_phone:   sanitize(orderData.customer_phone),
      payment_method:   sanitize(orderData.paymentMethod || 'A combinar'),
      total:            parseFloat(orderData.total || 0),
      user_id:          orderData.user_id || null,
      items:            typeof orderData.items === 'string' ? orderData.items : JSON.stringify(orderData.items || []),
      status:           'pending',
      delivery_mode:    orderData.delivery_mode || 'pickup',
      delivery_address: orderData.delivery_address ? JSON.stringify(orderData.delivery_address) : null,
    };

    // Tenta executar via Function (backend seguro com lógica adicional)
    if (PLACE_ORDER_FUNC_ID && PLACE_ORDER_FUNC_ID !== 'place_order') {
      try {
        const exec = await functions.createExecution(PLACE_ORDER_FUNC_ID, JSON.stringify(orderData), false);
        const result = JSON.parse(exec.responseBody);
        if (result.success !== false) {
          await decrementStock(orderData.items);
          return { success: true, $id: result.order?.$id, order_number: result.order?.order_number, status: 'pending' };
        }
      } catch (fnErr) {
        console.warn('[orderService] Function falhou, usando escrita direta:', fnErr.message);
      }
    }

    // Escrita direta com retry em caso de colisão de número
    let res = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const orderNumber = await getNextOrderNumber();
        const permissions = orderData.user_id
          ? [Permission.read(Role.user(orderData.user_id)), Permission.write(Role.user(orderData.user_id))]
          : [Permission.read(Role.any())];
        res = await databases.createDocument(DATABASE_ID, COLLECTIONS.ORDERS, orderNumber, payload, permissions);
        break;
      } catch (err) {
        if (err.code === 409) {
          await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
        } else {
          throw err;
        }
      }
    }

    if (!res) throw new Error('Não foi possível criar o pedido após 3 tentativas');

    await decrementStock(orderData.items);

    return { success: true, $id: res.$id, order_number: res.$id, status: res.status };
  } catch (err) {
    console.error('[orderService] createOrder:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Lista todos os pedidos (admin)
 */
export const getOrders = async () => {
  try {
    return await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [
      Query.orderDesc('$createdAt'),
      Query.limit(100),
    ]);
  } catch (err) {
    console.error('[orderService] getOrders:', err);
    throw err;
  }
};

/**
 * Retorna IDs de produtos ordenados por frequência de compra do usuário
 * Usado pelo sistema de upsell inteligente
 */
export const getUserOrderHistory = async (userId) => {
  if (!userId) return [];
  try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [
      Query.equal('user_id', userId),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ]);
    const freq = {};
    response.documents.forEach(order => {
      try {
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        items.forEach(item => {
          const id = item.id || item.$id;
          if (id) freq[id] = (freq[id] || 0) + 1;
        });
      } catch (_) {}
    });
    return Object.entries(freq).sort(([, a], [, b]) => b - a).map(([id]) => id);
  } catch (err) {
    console.error('[orderService] getUserOrderHistory:', err);
    return [];
  }
};

/**
 * Atualiza o status de um pedido
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.ORDERS, orderId, { status });
    return true;
  } catch (err) {
    console.error('[orderService] updateOrderStatus:', err);
    throw err;
  }
};
