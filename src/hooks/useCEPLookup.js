/**
 * useCEPLookup — Busca de endereço via ViaCEP
 *
 * Ao receber um CEP com 8 dígitos, faz a consulta na API pública
 * do ViaCEP e retorna os campos de endereço preenchidos.
 *
 * Uso:
 *   const { lookupCEP, loading, error } = useCEPLookup();
 *   const address = await lookupCEP('01310100');
 */

import { useState, useCallback } from 'react';

export function useCEPLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  /**
   * Consulta o endereço pelo CEP
   * @param {string} cep - CEP com ou sem hífen
   * @returns {Object|null} Campos de endereço ou null em caso de erro
   */
  const lookupCEP = useCallback(async (cep) => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return null;

    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();

      if (data.erro) {
        setError('CEP não encontrado');
        return null;
      }

      return {
        street:       data.logradouro || '',
        neighborhood: data.bairro     || '',
        city:         data.localidade || '',
        state:        data.uf         || '',
      };
    } catch (err) {
      setError('Erro ao consultar CEP');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookupCEP, loading, error };
}
