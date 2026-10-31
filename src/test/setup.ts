import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Explicit RTL cleanup between tests — vitest runs without `globals: true`,
// so @testing-library/react's auto-cleanup is not registered and the DOM
// would otherwise accumulate across renders in the same file.
afterEach(cleanup);

// jsdom lacks matchMedia — mock it (used by some UI deps).
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// requestAnimationFrame polyfill (framer-motion + others).
if (typeof window !== 'undefined' && !window.requestAnimationFrame) {
  window.requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 0) as unknown as number;
  window.cancelAnimationFrame = (id: number) => clearTimeout(id);
}
