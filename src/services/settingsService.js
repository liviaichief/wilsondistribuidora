/**
 * settingsService — Configurações do sistema
 *
 * Gerencia todas as configurações armazenadas na collection 'settings'
 * do Appwrite. Cada configuração é um documento {key, value} onde
 * value é sempre string (JSON serializado quando necessário).
 */

import { databases, DATABASE_ID } from '../lib/appwrite';
import { Query, Permission, Role } from 'appwrite';

// Chaves que nunca devem ser expostas no contexto do navegador público
const SENSITIVE_KEYS = ['whatsapp_api_key', 'whatsapp_api_url', 'smtp_password', 'google_maps_api_key'];

/**
 * Carrega todas as configurações do sistema
 * Faz parse automático de JSON, boolean e números
 * @returns {Promise<Object>} Mapa de chave → valor
 */
export const getSettings = async () => {
  try {
    const response = await databases.listDocuments(DATABASE_ID, 'settings', [Query.limit(100)]);

    const settings = {};
    response.documents.forEach(doc => {
      let val = doc.value;
      if (val === 'true')       val = true;
      else if (val === 'false') val = false;
      else {
        try { val = JSON.parse(doc.value); } catch (_) { /* mantém string */ }
      }
      settings[doc.key] = val;
    });

    // Filtra dados sensíveis em páginas públicas (defesa em camadas — a real está no Appwrite Console)
    const isPublicPage = typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin');
    if (isPublicPage) {
      SENSITIVE_KEYS.forEach(key => { if (settings[key]) settings[key] = '***'; });
    }

    return settings;
  } catch (err) {
    console.error('[settingsService] getSettings:', err);
    return {};
  }
};

/**
 * Salva ou atualiza uma configuração
 * Tenta update primeiro; se não existir (404), cria o documento
 * @param {string} key - Chave da configuração
 * @param {*} value - Valor (será serializado para string se não for string)
 */
export const updateSettings = async (key, value) => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    try {
      await databases.updateDocument(DATABASE_ID, 'settings', key, { value: stringValue });
    } catch (err) {
      if (err.code === 404) {
        await databases.createDocument(DATABASE_ID, 'settings', key, { key, value: stringValue }, [
          Permission.read(Role.any()),
        ]);
      } else {
        throw err;
      }
    }
    return true;
  } catch (err) {
    console.error('[settingsService] updateSettings:', err);
    throw err;
  }
};

/**
 * Salva múltiplas configurações de uma vez
 * @param {Object} settingsMap - { key: value, ... }
 */
export const updateMultipleSettings = async (settingsMap) => {
  const entries = Object.entries(settingsMap);
  await Promise.all(entries.map(([key, value]) => updateSettings(key, value)));
};
