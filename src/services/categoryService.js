/**
 * categoryService — Categorias, UOMs e Marcas
 *
 * Gerencia as listas de categorias, unidades de medida e marcas,
 * que são armazenadas como JSON em documentos da collection 'settings'.
 */

import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query } from 'appwrite';
import { updateSettings } from './settingsService';

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Bovinos',  active: true },
  { id: '2', name: 'Suínos',   active: true },
  { id: '3', name: 'Aves',     active: true },
  { id: '4', name: 'Kits',     active: true },
  { id: '5', name: 'Mercado',  active: true },
];

const DEFAULT_UOMS = [
  { id: '1', name: 'KG',      active: true },
  { id: '2', name: 'Unidade', active: true },
  { id: '3', name: 'Pacote',  active: true },
  { id: '4', name: 'Caixa',   active: true },
];

// ── Categorias ──────────────────────────────────────────────────────────────

export const getCategories = async () => {
  try {
    const doc = await databases.getDocument(DATABASE_ID, 'settings', 'project_categories');
    return doc?.value ? JSON.parse(doc.value) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

export const saveCategories = async (categories) => {
  await updateSettings('project_categories', JSON.stringify(categories));
  return true;
};

/**
 * Atualiza uma categoria e propaga a mudança para todos os produtos afetados
 */
export const updateCategoryGlobal = async (oldId, category) => {
  const current = await getCategories();
  await saveCategories(current.map(c => (c.id === oldId ? category : c)));
  if (oldId !== category.id) {
    const products = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [
      Query.equal('category', oldId),
      Query.limit(500),
    ]);
    await Promise.all(
      products.documents.map(p =>
        databases.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, p.$id, { category: category.id })
      )
    );
  }
};

/**
 * Remove uma categoria e migra produtos para categoria '99' (sem categoria)
 */
export const deleteCategoryGlobal = async (categoryId) => {
  const current = await getCategories();
  await saveCategories(current.filter(c => c.id !== categoryId));
  const products = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [
    Query.equal('category', categoryId),
    Query.limit(500),
  ]);
  await Promise.all(
    products.documents.map(p =>
      databases.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, p.$id, { category: '99' })
    )
  );
};

// ── Unidades de Medida ───────────────────────────────────────────────────────

export const getUOMs = async () => {
  try {
    const doc = await databases.getDocument(DATABASE_ID, 'settings', 'project_uoms');
    return doc?.value ? JSON.parse(doc.value) : DEFAULT_UOMS;
  } catch {
    return DEFAULT_UOMS;
  }
};

export const saveUOMs = async (uoms) => {
  await updateSettings('project_uoms', JSON.stringify(uoms));
  return true;
};

// ── Marcas ───────────────────────────────────────────────────────────────────

export const getBrands = async () => {
  try {
    const doc = await databases.getDocument(DATABASE_ID, 'settings', 'project_brands');
    return doc?.value ? JSON.parse(doc.value) : [];
  } catch {
    return [];
  }
};

export const saveBrands = async (brands) => {
  await updateSettings('project_brands', JSON.stringify(brands));
  return true;
};

export const getBrandsList = async () => {
  try {
    const doc = await databases.getDocument(DATABASE_ID, 'settings', 'project_brands_list');
    return doc?.value ? JSON.parse(doc.value) : [];
  } catch {
    return [];
  }
};

export const saveBrandsList = async (brands) => {
  await updateSettings('project_brands_list', JSON.stringify(brands));
  return true;
};
