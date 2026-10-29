/* ============================================================================
 * Root wagmi configuration
 * ----------------------------------------------------------------------------
 * Three chains, three jobs:
 *   • Base Sepolia (84532) — Presence. Canon's PresenceResolver is testnet-only
 *                            and EIP-712 domain chainId is 84532.
 *   • Base (8453)          — the Aragon DAO.
 *   • Mainnet (1)          — ENS resolution + text records.
 *
 * `reconnectOnMount` is deliberately OFF at the provider level (see
 * src/main.tsx) so the wallet does not throw an extension popup on first paint.
 * ========================================================================= */

import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { CHAINS, DEFAULT_CHAIN_ID, RPC_URLS } from './supercompute';

export const wagmiConfig = createConfig({
  chains: CHAINS,
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [CHAINS[0].id]: http(RPC_URLS[CHAINS[0].id]),
    [CHAINS[1].id]: http(RPC_URLS[CHAINS[1].id]),
    [CHAINS[2].id]: http(RPC_URLS[CHAINS[2].id]),
  },
  multiInjectedProviderDiscovery: true,
  ssr: false,
});

export { DEFAULT_CHAIN_ID };

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
