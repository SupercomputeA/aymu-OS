import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Dock } from '@/components/os/Dock';

describe('Dock (rendered)', () => {
  it('renders inside the viewport (no off-screen x-shift)', () => {
    const { container } = render(<Dock />);
    const dock = container.querySelector('.dock');
    expect(dock).toBeTruthy();

    // The dock is anchored to the left edge via left-3 (positive), not pushed
    // off-screen with a negative left (the PR #4 regression).
    const outer = dock?.parentElement as HTMLElement;
    expect(outer.className).toContain('left-3');
    expect(outer.className).not.toMatch(/-left-|left-\[-/);

    // No negative horizontal transform (framer-motion x-shift regression).
    const style = outer.getAttribute('style') ?? '';
    expect(style).not.toContain('translateX(-');
  });
});
