/**
 * Configuração global dos testes
 *
 * Executado antes de cada arquivo de teste pelo Vitest.
 * Configura mocks globais para APIs do navegador e serviços externos
 * que não podem ser chamados em ambiente de testes.
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Adiciona matchers do jest-dom (toBeInTheDocument, toHaveTextContent, etc.)
expect.extend(matchers);

// Limpa o DOM após cada teste para evitar vazamentos entre testes
afterEach(() => cleanup());

// ── Mocks do navegador ────────────────────────────────────────────────────────

// IntersectionObserver (usado pelo infinite scroll)
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) { this.callback = callback; }
  observe()    {}
  unobserve()  {}
  disconnect() {}
};

// ResizeObserver (usado por alguns componentes de layout)
global.ResizeObserver = class ResizeObserver {
  observe()    {}
  unobserve()  {}
  disconnect() {}
};

// matchMedia (usado por hooks de responsividade)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches:             false,
    media:               query,
    onchange:            null,
    addListener:         vi.fn(),
    removeListener:      vi.fn(),
    addEventListener:    vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent:       vi.fn(),
  })),
});

// scrollTo (usado no filtro de marca da Home)
window.scrollTo = vi.fn();

// ── Mocks do Appwrite ────────────────────────────────────────────────────────
// Evita chamadas reais ao banco durante os testes
vi.mock('../lib/appwrite', () => ({
  client:    {},
  account:   {},
  databases: {
    listDocuments:   vi.fn().mockResolvedValue({ documents: [], total: 0 }),
    getDocument:     vi.fn().mockResolvedValue({}),
    createDocument:  vi.fn().mockResolvedValue({ $id: 'mock-id' }),
    updateDocument:  vi.fn().mockResolvedValue({}),
    deleteDocument:  vi.fn().mockResolvedValue({}),
  },
  storage:   {
    createFile:      vi.fn().mockResolvedValue({ $id: 'mock-file-id' }),
    getFilePreview:  vi.fn().mockReturnValue('https://mock-url.com/img.jpg'),
    deleteFile:      vi.fn().mockResolvedValue({}),
  },
  functions: {
    createExecution: vi.fn().mockResolvedValue({ responseBody: JSON.stringify({ success: true }) }),
  },
  DATABASE_ID: 'test-db',
  BUCKET_ID:   'test-bucket',
  COLLECTIONS: {
    PRODUCTS: 'products',
    BANNERS:  'banners',
    ORDERS:   'orders',
    PROFILES: 'profiles',
  },
}));

// ── Mock do OpenAI ───────────────────────────────────────────────────────────
vi.mock('openai', () => ({
  default: class OpenAI {
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Descrição gerada pela IA de teste.' } }],
        }),
      },
    };
    images = {
      generate: vi.fn().mockResolvedValue({
        data: [{ url: 'https://mock-dalle-image.com/img.jpg' }],
      }),
    };
  },
}));
