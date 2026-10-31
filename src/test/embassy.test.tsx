import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmbassyApp } from '@/components/apps/EmbassyApp';
import { ROLES } from '@/lib/roles';

vi.mock('wagmi', () => ({
  useAccount: () => ({ address: undefined, isConnected: false, chainId: undefined }),
  useConnect: () => ({ connectors: [], connect: vi.fn() }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
  useEnsName: () => ({ data: null }),
}));

describe('Embassy passport — disconnected', () => {
  it('is honest: not wired, minted false, no fabricated address', () => {
    const { container } = render(<EmbassyApp windowId="w" />);
    const text = container.textContent ?? '';

    expect(text).toContain('not wired until a wallet is presented');
    expect(text).toContain('minted: false');
    expect(text).toContain('NOT ISSUED');
    expect(text).toContain('— not wired');

    // Zero full 40-hex-char (20-byte) Ethereum addresses in the disconnected
    // render — addresses are truncated via shortAddr, nothing is invented.
    const fullAddresses = text.match(/0x[0-9a-fA-F]{40}/g) ?? [];
    expect(fullAddresses).toEqual([]);
  });

  it('renders the full 15-role matrix', () => {
    render(<EmbassyApp windowId="w" />);
    for (const role of ROLES) {
      expect(screen.getAllByText(role.label).length).toBeGreaterThanOrEqual(1);
    }
    expect(ROLES).toHaveLength(15);
    expect(screen.getAllByText(/15 roles/).length).toBeGreaterThanOrEqual(1);
  });
});
