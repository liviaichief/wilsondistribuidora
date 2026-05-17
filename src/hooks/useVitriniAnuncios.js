/**
 * useVitriniAnuncios
 * Inscreve-se no canal Realtime da coleção `campanhas_comunicacao` e
 * chama `onAnuncio(payload)` sempre que um novo documento for criado.
 *
 * Uso:
 *   useVitriniAnuncios({ onAnuncio: (doc) => setAnuncio(doc) });
 */
import { useEffect } from 'react';
import { client, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';

export function useVitriniAnuncios({ onAnuncio } = {}) {
  useEffect(() => {
    if (!DATABASE_ID || !COLLECTIONS.CAMPANHAS) return;

    const canal = `databases.${DATABASE_ID}.collections.${COLLECTIONS.CAMPANHAS}.documents`;

    const unsubscribe = client.subscribe(canal, (response) => {
      const isCriacao = response.events.some(e => e.includes('.documents.') && e.endsWith('.create'));
      if (isCriacao && typeof onAnuncio === 'function') {
        onAnuncio(response.payload);
      }
    });

    return () => unsubscribe();
    // onAnuncio é passado como callback estável (useCallback no consumidor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
