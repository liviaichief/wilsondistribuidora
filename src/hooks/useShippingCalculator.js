/**
 * useShippingCalculator — Cálculo de frete por distância
 *
 * Calcula o frete baseado em:
 * 1. Coordenadas da loja (configuradas no admin)
 * 2. Endereço do cliente (geocodificado via Google Maps)
 * 3. Regras de frete: raio grátis, taxa fixa, taxa por km
 *
 * Fallback: taxa fixa configurada quando Google Maps não está disponível
 */

import { useState, useCallback } from 'react';

/**
 * Calcula o valor do frete dado a distância em km e as configurações
 * Função pura exportada separadamente para facilitar testes unitários
 */
export function calculateShippingFee(distanceKm, settings) {
  const freeRadius  = parseFloat(settings?.shipping_free_radius  ?? 5);
  const fixedRate   = parseFloat(settings?.shipping_fixed_rate   ?? 8);
  const fixedRadius = parseFloat(settings?.shipping_fixed_radius_max ?? 15);
  const perKmRate   = parseFloat(settings?.shipping_per_km_rate  ?? 2);

  if (distanceKm <= freeRadius)   return 0;
  if (distanceKm <= fixedRadius)  return fixedRate;
  return fixedRate + (distanceKm - fixedRadius) * perKmRate;
}

export function useShippingCalculator() {
  const [deliveryFee, setDeliveryFee]         = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState(null);
  const [calculating, setCalculating]           = useState(false);

  /**
   * Calcula frete a partir de um endereço e as configurações da loja
   * @param {Object} address - { street, number, neighborhood, city, state, cep }
   * @param {Object} settings - Configurações carregadas do Appwrite
   */
  const calculateForAddress = useCallback(async (address, settings) => {
    if (!address?.street) return;

    const apiKey   = settings?.google_api_key;
    const storeLat = settings?.store_latitude;
    const storeLng = settings?.store_longitude;

    setCalculating(true);
    try {
      // Monta string de endereço para geocodificação
      const addrStr = [address.street, address.number, address.neighborhood, address.city, address.state]
        .filter(Boolean).join(', ');

      if (apiKey && storeLat && storeLng) {
        // Usa Google Distance Matrix para distância real (respeita ruas e trânsito)
        const origin      = `${storeLat},${storeLng}`;
        const destination = encodeURIComponent(addrStr);
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving&key=${apiKey}`;

        const resp = await fetch(`/api/proxy-distance?url=${encodeURIComponent(url)}`);
        if (resp.ok) {
          const data     = await resp.json();
          const element  = data?.rows?.[0]?.elements?.[0];
          if (element?.status === 'OK') {
            const distKm = element.distance.value / 1000;
            setDeliveryDistance(distKm);
            setDeliveryFee(calculateShippingFee(distKm, settings));
            return;
          }
        }
      }

      // Fallback: aplica taxa fixa configurada
      const fallbackFee = parseFloat(settings?.shipping_fixed_rate ?? 8);
      setDeliveryDistance(null);
      setDeliveryFee(fallbackFee);
    } catch (err) {
      console.warn('[useShippingCalculator] Fallback para taxa fixa:', err.message);
      setDeliveryFee(parseFloat(settings?.shipping_fixed_rate ?? 8));
      setDeliveryDistance(null);
    } finally {
      setCalculating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setDeliveryFee(0);
    setDeliveryDistance(null);
  }, []);

  return { deliveryFee, deliveryDistance, calculating, calculateForAddress, reset };
}
