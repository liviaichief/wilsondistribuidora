/**
 * productService — Operações de produtos
 *
 * CRUD completo para a collection de produtos no Appwrite.
 * Inclui lógica de SKU sequencial, sanitização de inputs e
 * verificação de bloqueio do sistema.
 */

import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query, Permission, Role } from 'appwrite';

// Sanitização básica anti-XSS para strings vindas de formulários
const sanitize = (val) => {
  if (typeof val !== 'string') return val;
  return val
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
    .replace(/on\w+="[^"]*"/gim, '')
    .replace(/javascript:/gim, '')
    .trim();
};

const processDoc = (doc) => ({ ...doc, id: doc.$id });

// Gera o próximo SKU sequencial (ex: WD0101)
const getNextSKU = async () => {
  try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [
      Query.orderDesc('sku'),
      Query.limit(1),
    ]);
    if (response.documents.length === 0) return 'WD0100';
    const lastSku = response.documents[0].sku;
    let lastNumber = 99;
    if (lastSku?.startsWith('WD')) {
      const parsed = parseInt(lastSku.substring(2), 10);
      if (!isNaN(parsed)) lastNumber = parsed;
    }
    return `WD${String(lastNumber + 1).padStart(4, '0')}`;
  } catch {
    return `WD${Math.floor(1000 + Math.random() * 9000)}`;
  }
};

/**
 * Lista produtos com filtros opcionais de categoria e promoção
 * - Categoria 'all': retorna somente promoções (aba Geral da loja)
 * - Categoria 'all' sem promoções: retorna todos os ativos (CRO-1)
 * - Categoria específica: retorna produtos daquela categoria
 */
export const getProducts = async (category) => {
  try {
    const [response, blockDoc] = await Promise.all([
      databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [
        Query.limit(100),
        Query.orderDesc('$createdAt'),
      ]),
      databases.getDocument(DATABASE_ID, 'settings', 'system_blocked').catch(() => null),
    ]);

    if (blockDoc?.value === 'true') {
      return { documents: [], total: 0, system_blocked: true };
    }

    let docs = response.documents.map(processDoc);

    if (category && category !== 'all') {
      // Filtra pela categoria escolhida
      docs = docs.filter(d => (d.category || '').toLowerCase() === category.toLowerCase());
    } else if (category === 'all') {
      // Aba Geral: prefere promoções; se não houver, exibe tudo (CRO-1)
      const promos = docs.filter(d => d.is_promotion === true);
      docs = promos.length > 0 ? promos : docs;
    }

    // Em contexto de loja pública, oculta produtos inativos
    if (category !== undefined && category !== null) {
      docs = docs.filter(d => d.active !== false);
    }

    return { documents: docs, total: docs.length };
  } catch (err) {
    console.error('[productService] getProducts:', err);
    return { documents: [], total: 0 };
  }
};

/**
 * Busca um produto pelo ID
 * @returns {Object|null} Produto ou null se não encontrado
 */
export const getProductById = async (id) => {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, id);
    return processDoc(doc);
  } catch (err) {
    console.error('[productService] getProductById:', err);
    return null;
  }
};

/**
 * Cria ou atualiza um produto
 * - Sem ID → cria com SKU gerado automaticamente
 * - Com ID → atualiza mantendo o SKU existente
 */
export const saveProduct = async (product) => {
  try {
    const docId = product.id || product.$id;
    const payload = {
      title:                  sanitize(product.title),
      description:            sanitize(product.description),
      price:                  parseFloat(product.price) || 0,
      category:               product.category,
      image:                  product.image,
      uom:                    product.uom || 'KG',
      is_promotion:           !!product.is_promotion,
      promo_price:            product.promo_price ? parseFloat(product.promo_price) || 0 : null,
      active:                 product.active !== false,
      manage_stock:           !!product.manage_stock,
      stock_quantity:         parseInt(product.stock_quantity) || 0,
      allow_backorder:        !!product.allow_backorder,
      disable_on_zero_stock:  !!product.disable_on_zero_stock,
      has_box_option:         !!product.has_box_option,
      box_price:              product.box_price ? parseFloat(product.box_price) || 0 : null,
      has_bundle_option:      !!product.has_bundle_option,
      unit_price:             product.unit_price ? parseFloat(product.unit_price) || 0 : null,
      has_assorted_min:       !!product.has_assorted_min,
      assorted_min_qty:       product.assorted_min_qty ? parseInt(product.assorted_min_qty) || 0 : null,
      external_code:          product.external_code || null,
      brand:                  product.brand || null,
    };

    if (product.image_2 !== undefined)  payload.image_2   = product.image_2;
    if (product.image_3 !== undefined)  payload.image_3   = product.image_3;
    if (product.cost_price !== undefined) payload.cost_price = parseFloat(product.cost_price) || 0;
    if (product.video_url !== undefined) payload.video_url  = product.video_url;

    let response;
    if (docId) {
      payload.sku = product.sku;
      response = await databases.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, docId, payload);
    } else {
      const sku = await getNextSKU();
      payload.sku = sku;
      response = await databases.createDocument(
        DATABASE_ID, COLLECTIONS.PRODUCTS, sku, payload,
        [Permission.read(Role.any())],
      );
    }
    return processDoc(response);
  } catch (err) {
    console.error('[productService] saveProduct:', err);
    throw err;
  }
};

/**
 * Remove um produto permanentemente
 */
export const deleteProduct = async (id) => {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, id);
  } catch (err) {
    console.error('[productService] deleteProduct:', err);
    throw err;
  }
};

/**
 * Resequencia SKUs de todos os produtos (operação admin)
 */
export const backfillSKUs = async () => {
  try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [
      Query.limit(100),
      Query.orderAsc('$createdAt'),
    ]);
    let nextNum = 100;
    let updatedCount = 0;
    for (const doc of response.documents) {
      const newSku = `WD${String(nextNum).padStart(4, '0')}`;
      if (doc.sku !== newSku) {
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, doc.$id, { sku: newSku });
        updatedCount++;
      }
      nextNum++;
    }
    return { success: true, updatedCount };
  } catch (err) {
    console.error('[productService] backfillSKUs:', err);
    return { success: false, error: err.message };
  }
};
