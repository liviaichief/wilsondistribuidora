/**
 * dataService — Barrel de re-exports (compatibilidade)
 *
 * Este arquivo mantém compatibilidade com todos os imports existentes
 * que usavam `import { ... } from '../services/dataService'`.
 *
 * A lógica foi migrada para serviços por domínio:
 *   - productService.js  → produtos (CRUD, SKU, estoque)
 *   - orderService.js    → pedidos (criar, listar, status)
 *   - profileService.js  → perfis de usuários
 *   - categoryService.js → categorias, UOMs, marcas
 *   - settingsService.js → configurações do sistema
 *   - whatsappService.js → envio de mensagens WhatsApp
 *   - auditService.js    → log de ações admin
 *
 * Para novos imports, prefira importar diretamente do serviço específico.
 */

export { ID } from '../lib/appwrite';

export * from './productService';
export * from './orderService';
export * from './profileService';
export * from './categoryService';
export * from './settingsService';
export * from './whatsappService';
export * from './auditService';

// Re-export getBanners que ainda não tem serviço próprio
import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query } from 'appwrite';

export const getBanners = async () => {
  try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.BANNERS, [
      Query.equal('active', true),
      Query.orderAsc('display_order'),
    ]);
    return response.documents.map(doc => ({
      ...doc,
      id: doc.$id,
      product_id: doc.product ? (doc.product.$id || doc.product) : null,
    }));
  } catch (err) {
    console.error('[dataService] getBanners:', err);
    return [];
  }
};
