/**
 * usePushNotifications
 * Solicita permissão de notificação, subscreve ao Push Service com VAPID
 * e salva o endpoint em campanhas_comunicacao / push_subscriptions no Appwrite.
 *
 * Uso:
 *   const { isSupported, permission, subscribe, isSubscribed } = usePushNotifications();
 */
import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { ID } from 'appwrite';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const LS_SUBSCRIBED    = 'push_subscribed';

/* Converte VAPID public key de base64url → Uint8Array */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const isSupported = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;

  const [permission,    setPermission]    = useState(isSupported ? Notification.permission : 'unsupported');
  const [isSubscribed,  setIsSubscribed]  = useState(!!localStorage.getItem(LS_SUBSCRIBED));
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState(null);

  /* Verifica se já há subscrição ativa no Service Worker */
  useEffect(() => {
    if (!isSupported || isSubscribed) return;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          setIsSubscribed(true);
          localStorage.setItem(LS_SUBSCRIBED, '1');
        }
      } catch { /* silencioso */ }
    })();
  }, [isSupported, isSubscribed]);

  /* Solicita permissão e subscreve ao Push Service */
  const subscribe = useCallback(async () => {
    if (!isSupported || !VAPID_PUBLIC_KEY) {
      setError('Push não suportado neste dispositivo ou chave VAPID não configurada.');
      return false;
    }
    setIsLoading(true);
    setError(null);

    try {
      // 1. Pede permissão ao usuário
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setError('Permissão negada. Habilite notificações nas configurações do navegador.');
        return false;
      }

      // 2. Aguarda o SW estar pronto
      const registration = await navigator.serviceWorker.ready;

      // 3. Cria (ou reutiliza) a subscrição Push
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // 4. Salva o endpoint no Appwrite (ignora duplicatas — erro 409)
      const json = subscription.toJSON();
      try {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.PUSH_SUBSCRIPTIONS,
          ID.unique(),
          {
            endpoint: json.endpoint,
            p256dh:   json.keys?.p256dh  || '',
            auth:     json.keys?.auth    || '',
          }
        );
      } catch (dupErr) {
        // 409 = endpoint já existe → ok, já está registrado
        if (!dupErr.message?.includes('already exists') && dupErr.code !== 409) throw dupErr;
      }

      setIsSubscribed(true);
      localStorage.setItem(LS_SUBSCRIBED, '1');
      return true;
    } catch (err) {
      console.error('[usePushNotifications]', err);
      setError(err.message || 'Erro ao ativar notificações.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  /* Cancela a subscrição */
  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      setIsSubscribed(false);
      localStorage.removeItem(LS_SUBSCRIBED);
    } catch (err) {
      console.warn('[usePushNotifications] unsubscribe:', err.message);
    }
  }, []);

  return { isSupported, permission, isSubscribed, isLoading, error, subscribe, unsubscribe };
}
