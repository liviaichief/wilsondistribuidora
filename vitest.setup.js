
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extends Vitest with matchers from jest-dom
expect.extend(matchers);

// Cleanup after each test case (clears JSDOM)
afterEach(() => {
    cleanup();
});

// Mock IntersectionObserver
class IntersectionObserver {
    observe() { return null; }
    unobserve() { return null; }
    disconnect() { return null; }
}
window.IntersectionObserver = IntersectionObserver;
