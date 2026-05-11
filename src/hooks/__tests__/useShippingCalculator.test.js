import { describe, it, expect } from 'vitest';
import { calculateShippingFee } from '../useShippingCalculator';

const defaultSettings = {
  shipping_free_radius:      5,
  shipping_fixed_rate:       8,
  shipping_fixed_radius_max: 15,
  shipping_per_km_rate:      2,
};

describe('calculateShippingFee() — pure function', () => {
  it('returns 0 for distance within free radius', () => {
    expect(calculateShippingFee(3, defaultSettings)).toBe(0);
    expect(calculateShippingFee(5, defaultSettings)).toBe(0);
  });

  it('returns fixed rate for distance within fixed radius', () => {
    expect(calculateShippingFee(6,  defaultSettings)).toBe(8);
    expect(calculateShippingFee(10, defaultSettings)).toBe(8);
    expect(calculateShippingFee(15, defaultSettings)).toBe(8);
  });

  it('returns fixed + per-km for distance beyond fixed radius', () => {
    // 16 km: beyond fixed radius (15) by 1 km → 8 + 1*2 = 10
    expect(calculateShippingFee(16, defaultSettings)).toBe(10);
    // 20 km: beyond by 5 km → 8 + 5*2 = 18
    expect(calculateShippingFee(20, defaultSettings)).toBe(18);
  });

  it('uses defaults when settings are null', () => {
    // null settings → freeRadius=5, fixedRate=8, fixedRadius=15, perKm=2
    expect(calculateShippingFee(3, null)).toBe(0);
    expect(calculateShippingFee(10, null)).toBe(8);
    expect(calculateShippingFee(20, null)).toBe(18);
  });

  it('uses defaults when settings are empty object', () => {
    expect(calculateShippingFee(10, {})).toBe(8);
  });

  it('respects custom settings', () => {
    const custom = {
      shipping_free_radius:      3,
      shipping_fixed_rate:       5,
      shipping_fixed_radius_max: 10,
      shipping_per_km_rate:      3,
    };
    expect(calculateShippingFee(2,  custom)).toBe(0);  // within free
    expect(calculateShippingFee(5,  custom)).toBe(5);  // within fixed
    expect(calculateShippingFee(13, custom)).toBe(14); // 5 + (13-10)*3
  });

  it('handles distance exactly at boundaries', () => {
    // Exactly at free radius → still free
    expect(calculateShippingFee(5, defaultSettings)).toBe(0);
    // Exactly at fixed radius → fixed rate
    expect(calculateShippingFee(15, defaultSettings)).toBe(8);
  });

  it('handles 0 distance (pickup)', () => {
    expect(calculateShippingFee(0, defaultSettings)).toBe(0);
  });
});
