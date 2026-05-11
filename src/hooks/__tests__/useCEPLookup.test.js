import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCEPLookup } from '../useCEPLookup';

const mockViaCEPResponse = {
  logradouro: 'Avenida Paulista',
  bairro:     'Bela Vista',
  localidade: 'São Paulo',
  uf:         'SP',
};

describe('useCEPLookup', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with loading=false and no error', () => {
    const { result } = renderHook(() => useCEPLookup());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns null for CEP shorter than 8 digits', async () => {
    const { result } = renderHook(() => useCEPLookup());
    let ret;
    await act(async () => { ret = await result.current.lookupCEP('1234'); });
    expect(ret).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('strips non-digit characters before lookup', async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockViaCEPResponse),
    });
    const { result } = renderHook(() => useCEPLookup());
    await act(async () => { await result.current.lookupCEP('01310-100'); });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('01310100')
    );
  });

  it('returns address fields on success', async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockViaCEPResponse),
    });
    const { result } = renderHook(() => useCEPLookup());
    let address;
    await act(async () => { address = await result.current.lookupCEP('01310100'); });
    expect(address).toEqual({
      street:       'Avenida Paulista',
      neighborhood: 'Bela Vista',
      city:         'São Paulo',
      state:        'SP',
    });
  });

  it('returns null and sets error when CEP is not found (erro: true)', async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ erro: true }),
    });
    const { result } = renderHook(() => useCEPLookup());
    let address;
    await act(async () => { address = await result.current.lookupCEP('99999999'); });
    expect(address).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it('returns null and sets error on network failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useCEPLookup());
    let address;
    await act(async () => { address = await result.current.lookupCEP('01310100'); });
    expect(address).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it('sets loading=true during fetch and false after', async () => {
    let resolveJson;
    const promise = new Promise(res => { resolveJson = res; });
    global.fetch.mockResolvedValueOnce({ json: () => promise });

    const { result } = renderHook(() => useCEPLookup());
    let fetchPromise;
    act(() => { fetchPromise = result.current.lookupCEP('01310100'); });
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveJson(mockViaCEPResponse);
      await fetchPromise;
    });
    expect(result.current.loading).toBe(false);
  });

  it('handles missing fields in ViaCEP response gracefully', async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ localidade: 'Brasília', uf: 'DF' }),
    });
    const { result } = renderHook(() => useCEPLookup());
    let address;
    await act(async () => { address = await result.current.lookupCEP('70000000'); });
    expect(address.street).toBe('');
    expect(address.neighborhood).toBe('');
    expect(address.city).toBe('Brasília');
  });
});
