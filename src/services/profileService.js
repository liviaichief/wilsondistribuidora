/**
 * profileService — Gerenciamento de perfis de usuários
 *
 * Operações CRUD sobre a collection 'profiles' do Appwrite.
 * Cada perfil corresponde a um usuário autenticado e armazena
 * dados complementares (endereço, WhatsApp, aniversário, etc.)
 */

import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query, Permission, Role } from 'appwrite';

/**
 * Lista todos os perfis (admin)
 */
export const getProfiles = async () => {
  try {
    return await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.orderDesc('$createdAt'),
      Query.limit(100),
    ]);
  } catch (err) {
    console.error('[profileService] getProfiles:', err);
    throw err;
  }
};

/**
 * Atualiza dados de um perfil existente
 */
export const updateProfile = async (profileId, data) => {
  try {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, profileId, data);
    return true;
  } catch (err) {
    console.error('[profileService] updateProfile:', err);
    throw err;
  }
};

/**
 * Cria um novo perfil de usuário no Appwrite
 *
 * @param {string} profileId - ID do documento (= user.$id quando vem do auth, ou ID gerado para criação manual)
 * @param {Object} data - Campos do perfil
 * @param {string[]} [permissions] - Permissões customizadas; se omitido usa leitura pública
 */
export const createProfile = async (profileId, data, permissions) => {
  // Permissões padrão: apenas leitura pública (sem Role.user — pode não existir no Auth)
  const perms = permissions ?? [Permission.read(Role.any())];
  try {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.PROFILES, profileId, data, perms);
    return true;
  } catch (err) {
    console.error('[profileService] createProfile:', err);
    throw err;
  }
};

/**
 * Remove um perfil (admin)
 */
export const deleteProfile = async (profileId) => {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PROFILES, profileId);
    return true;
  } catch (err) {
    console.error('[profileService] deleteProfile:', err);
    throw err;
  }
};

/**
 * Retorna perfis cujo aniversário é hoje
 * Usado no dashboard para mensagens de feliz aniversário
 */
export const fetchBirthdaysToday = async () => {
  try {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const profiles = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.limit(100),
    ]);
    return profiles.documents.filter(p => {
      if (!p.birthday) return false;
      const d = new Date(p.birthday);
      return (
        String(d.getMonth() + 1).padStart(2, '0') === mm &&
        String(d.getDate()).padStart(2, '0') === dd
      );
    });
  } catch (err) {
    console.error('[profileService] fetchBirthdaysToday:', err);
    return [];
  }
};
