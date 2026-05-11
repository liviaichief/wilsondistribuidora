import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckoutValidation } from '../useCheckoutValidation';

describe('useCheckoutValidation', () => {
  describe('validateField()', () => {
    it('returns error for empty customerName', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      act(() => result.current.validateField('customerName', ''));
      expect(result.current.errors.customerName).toBeTruthy();
    });

    it('returns error for name shorter than 3 chars', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      act(() => result.current.validateField('customerName', 'Jo'));
      expect(result.current.errors.customerName).toBeTruthy();
    });

    it('clears error for valid customerName', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      act(() => result.current.validateField('customerName', ''));
      act(() => result.current.validateField('customerName', 'João Silva'));
      expect(result.current.errors.customerName).toBeNull();
    });

    it('returns error for empty phone', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      act(() => result.current.validateField('customerPhone', ''));
      expect(result.current.errors.customerPhone).toBeTruthy();
    });

    it('returns error for phone without DDD (less than 10 digits)', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      act(() => result.current.validateField('customerPhone', '99998888'));
      expect(result.current.errors.customerPhone).toBeTruthy();
    });

    it('clears error for valid 11-digit phone', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      act(() => result.current.validateField('customerPhone', '11999998888'));
      expect(result.current.errors.customerPhone).toBeNull();
    });

    it('returns error for missing deliveryMode', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      act(() => result.current.validateField('deliveryMode', ''));
      expect(result.current.errors.deliveryMode).toBeTruthy();
    });

    it('returns error for invalid CEP', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      act(() => result.current.validateField('cep', '123'));
      expect(result.current.errors.cep).toBeTruthy();
    });

    it('clears error for valid CEP', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      act(() => result.current.validateField('cep', '01310-100'));
      expect(result.current.errors.cep).toBeNull();
    });

    it('ignores unknown field names gracefully', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      expect(() => {
        act(() => result.current.validateField('unknownField', 'value'));
      }).not.toThrow();
    });
  });

  describe('validateAll()', () => {
    const validPickupValues = {
      customerName:  'João Silva',
      customerPhone: '11999998888',
      deliveryMode:  'pickup',
      paymentMethod: 'PIX',
    };

    const validDeliveryValues = {
      ...validPickupValues,
      deliveryMode: 'delivery',
      cep:          '01310-100',
      street:       'Rua das Flores',
      number:       '123',
      neighborhood: 'Centro',
      city:         'São Paulo',
    };

    it('returns true for valid pickup data', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      let isValid;
      act(() => { isValid = result.current.validateAll(validPickupValues, false); });
      expect(isValid).toBe(true);
    });

    it('returns true for valid delivery data', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      let isValid;
      act(() => { isValid = result.current.validateAll(validDeliveryValues, true); });
      expect(isValid).toBe(true);
    });

    it('returns false when required field is empty', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      let isValid;
      act(() => {
        isValid = result.current.validateAll({ ...validPickupValues, customerName: '' }, false);
      });
      expect(isValid).toBe(false);
    });

    it('returns false for delivery without address fields', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      let isValid;
      act(() => {
        isValid = result.current.validateAll(validPickupValues, true);
      });
      expect(isValid).toBe(false);
    });

    it('does NOT require address fields for pickup mode', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      let isValid;
      act(() => {
        isValid = result.current.validateAll(
          { ...validPickupValues, cep: '', street: '' }, false
        );
      });
      expect(isValid).toBe(true);
    });
  });

  describe('clearErrors()', () => {
    it('resets all errors to empty', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      act(() => result.current.validateField('customerName', ''));
      act(() => result.current.clearErrors());
      expect(Object.values(result.current.errors).every(e => !e)).toBe(true);
    });
  });

  describe('isValid computed', () => {
    it('starts as true (no errors)', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      expect(result.current.isValid).toBe(true);
    });

    it('becomes false after a validation error', () => {
      const { result } = renderHook(() => useCheckoutValidation());
      act(() => result.current.validateField('customerName', ''));
      expect(result.current.isValid).toBe(false);
    });
  });
});
