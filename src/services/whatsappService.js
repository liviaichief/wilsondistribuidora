/**
 * whatsappService — Envio de mensagens via WhatsApp
 *
 * Suporta dois modos:
 * 1. API direta (Evolution API) — quando configurada em settings
 * 2. Link web.whatsapp.com — fallback universal
 *
 * A construção da mensagem de pedido está em orderMessageBuilder.js
 */

import axios from 'axios';
import { getSettings } from './settingsService';

/**
 * Envia mensagem via Evolution API (ou similar)
 * Requer configuração de whatsapp_api_url e whatsapp_instance em Settings
 * @returns {Promise<boolean>} true se enviado com sucesso
 */
export const sendWhatsAppMessage = async (phone, message) => {
  try {
    const settings = await getSettings();
    if (!settings.whatsapp_use_api || !settings.whatsapp_api_url) return false;

    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone  = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const apiUrl     = settings.whatsapp_api_url.replace(/\/$/, '');
    const endpoint   = `${apiUrl}/message/sendText/${settings.whatsapp_instance}`;

    const response = await axios.post(
      endpoint,
      { number: fullPhone, text: message, delay: 1200, linkPreview: true },
      { headers: { 'Content-Type': 'application/json', apikey: settings.whatsapp_api_key } }
    );
    return response.status === 200 || response.status === 201;
  } catch (err) {
    console.error('[whatsappService] sendWhatsAppMessage:', err.response?.data || err.message);
    return false;
  }
};

/**
 * Abre o WhatsApp com uma mensagem pré-preenchida
 * Mobile: redirect direto | Desktop: popup 600×700
 * @param {string} phone - Número do destinatário (ex: 5511999998888)
 * @param {string} message - Texto da mensagem
 */
export const openWhatsApp = (phone, message) => {
  const cleanPhone = String(phone).replace(/\D/g, '');
  const fullPhone  = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const url        = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(message)}`;
  const isMobile   = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    window.location.href = url;
  } else {
    window.open(url, 'whatsapp', 'width=600,height=700,resizable=yes');
  }
};

/**
 * Formata número de telefone brasileiro para o padrão internacional
 * @param {string} phone - Número com ou sem DDD
 * @returns {string} Número no formato 55XXXXXXXXXXX
 */
export const formatPhoneForWhatsApp = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
};
