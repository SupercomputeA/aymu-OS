/* ============================================================================
 * Presence chain facts — ported from canon `apps/web/lib/contracts.ts`
 * ----------------------------------------------------------------------------
 * Presence runs on Base SEPOLIA (84532), not Base mainnet. The resolver is
 * testnet-only (`revert InvalidChainId when block.chainid != 84532`).
 *
 * The resolver was deployed and the canon schemas registered on Base Sepolia
 * (the Phase A5 action the canon placeholder "TBD_DEPLOY_A5" pointed at):
 *   resolver       0x6ffaAE8728afd9CCF1756afe070217B665Fa6783
 *   PresenceEvent  UID 0x1bce2b5e92ec45caa02b89aa1d2ff3724df744004359677e988ac2e742de72b1
 *   PresenceMoment UID 0x910d6ebca7d06435f2c0dea9534284e4f30bfe683237746c42baeb30b8db18bb
 * See contracts/script/DeployPresence.s.sol (broadcast: DeployPresence.s.sol/84532).
 * ========================================================================= */

import { baseSepolia } from 'wagmi/chains';

/** The canon chainId every Presence artifact agrees on. */
export const PRESENCE_CHAIN_ID = baseSepolia.id; // 84532

export const PRESENCE_CHAIN = {
  chainId: PRESENCE_CHAIN_ID,
  chainName: 'Base Sepolia',
  testnet: true,
  mainnet: false,
  /** official Base Sepolia public RPC — read-only, no key */
  rpcUrl: 'https://sepolia.base.org',
  /** Deployed on Base Sepolia (see DeployPresence.s.sol broadcast). */
  resolverAddress: '0x6ffaAE8728afd9CCF1756afe070217B665Fa6783',
  explorer: 'https://sepolia.basescan.org',
} as const;

/** EAS deployments on Base Sepolia (canonical, same CREATE2 addresses as Base). */
export const PRESENCE_EAS_ADDRESSES = {
  eas: '0x4200000000000000000000000000000000000021',
  schemaRegistry: '0x4200000000000000000000000000000000000020',
  eip712Proxy: '0xF095fE4b23958b08D38e52d5d5674bBF0C03cbF6',
} as const;

/** True when an address value is not yet a real deployed address. */
export function isUnverifiedAddress(value: string): boolean {
  return !/^0x[0-9a-fA-F]{40}$/.test(value);
}

export function shortHex(value: string, head = 10, tail = 8): string {
  if (!value || value.length <= head + tail + 2) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}
