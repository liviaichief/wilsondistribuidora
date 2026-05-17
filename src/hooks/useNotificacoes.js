/**
 * useNotificacoes
 * Gerencia busca, Realtime e controle de "não lidas" das notificações do usuário.
 *
 * Fontes de dados:
 *   - campanhas_comunicacao  → anúncios e comunicados da loja (broadcast)
 *
 * Controle de não lidas:
 *   - localStorage "notif_last_seen" → timestamp ISO da última vez que o painel foi aberto
 *   - qualquer documento com $createdAt > lastSeen é "não lido"
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { databases, client, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query } from 'appwrite';

const LS_KEY = 'notif_last_seen';
const PAGE_SIZE = 30;

export function useNotificacoes() {
  const [notificacoes, setNotificacoes]   = useState([]);
  const [loading,      setLoading]         = useState(false);
  const [unreadCount,  setUnreadCount]     = useState(0);
  const lastSeenRef = useRef(localStorage.getItem(LS_KEY) || new Date(0).toISOString());

  /* ── Calcula não lidas ── */
  const calcUnread = useCallback((docs) => {
    const last = lastSeenRef.current;
    return docs.filter(d => d.$createdAt > last).length;
  }, []);

  /* ── Busca inicial ── */
  const fetchNotificacoes = useCallback(async () => {
    if (!DATABASE_ID || !COLLECTIONS.CAMPANHAS) return;
    setLoading(true);
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CAMPANHAS,
        [Query.orderDesc('$createdAt'), Query.limit(PAGE_SIZE)]
      );
      const docs = res.documents || [];
      setNotificacoes(docs);
      setUnreadCount(calcUnread(docs));
    } catch (err) {
      console.warn('[useNotificacoes] Erro ao buscar:', err.message);
    } finally {
      setLoading(false);
    }
  }, [calcUnread]);

  useEffect(() => { fetchNotificacoes(); }, [fetchNotificacoes]);

  /* ── Realtime: adiciona novo documento no topo ── */
  useEffect(() => {
    if (!DATABASE_ID || !COLLECTIONS.CAMPANHAS) return;
    const canal = `databases.${DATABASE_ID}.collections.${COLLECTIONS.CAMPANHAS}.documents`;
    const unsub = client.subscribe(canal, (response) => {
      if (response.events.some(e => e.includes('.create'))) {
        setNotificacoes(prev => [response.payload, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });
    return () => unsub();
  }, []);

  /* ── Marca todas como lidas (chamado ao abrir o painel) ── */
  const marcarLidas = useCallback(() => {
    const agora = new Date().toISOString();
    lastSeenRef.current = agora;
    localStorage.setItem(LS_KEY, agora);
    setUnreadCount(0);
  }, []);

  return { notificacoes, loading, unreadCount, marcarLidas, refresh: fetchNotificacoes };
}
