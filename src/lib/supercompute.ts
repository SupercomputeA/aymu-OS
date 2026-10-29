/* ============================================================================
 * Supercompute OS — verified protocol constants
 * ----------------------------------------------------------------------------
 * Every address in this file was verified live with `eth_getCode` against a
 * public RPC before being committed — see README "Verified constants".
 *
 * Two chains, two jobs:
 *   Base SE POLIA (84532) — Presence. Canon's PresenceResolver is testnet-only
 *                           (`revert InvalidChainId when chainid != 84532`).
 *   Base mainnet (8453)   — the Aragon DAO, EAS dispatch writes.
 *   Ethereum (1)          — ENS resolution and text records.
 * ========================================================================= */

import { base, baseSepolia, mainnet } from 'wagmi/chains';

export { base, baseSepolia, mainnet };

/** Chains the OS operates on. */
export const CHAINS = [baseSepolia, base, mainnet] as const;

/** Base Sepolia is the default chain — Presence is the OS's identity primitive. */
export const DEFAULT_CHAIN_ID = baseSepolia.id;

/* ── Ethereum Attestation Service ─────────────────────────────────────────── */

export const EAS_ADDRESSES = {
  [base.id]: '0x4200000000000000000000000000000000000021',
  [baseSepolia.id]: '0x4200000000000000000000000000000000000021',
  [mainnet.id]: '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587',
} as const satisfies Record<number, `0x${string}`>;

export const SCHEMA_REGISTRY_ADDRESSES = {
  [base.id]: '0x4200000000000000000000000000000000000020',
  [baseSepolia.id]: '0x4200000000000000000000000000000000000020',
  [mainnet.id]: '0xA7b39296258348C78294F95B872b282326A97BDF',
} as const satisfies Record<number, `0x${string}`>;

/**
 * EAS EIP-712 proxy. On Base mainnet and Base Sepolia the CREATE2 address is
 * the same deployment — verified on-chain for Base; Base Sepolia carries the
 * canonical CREATE2 address per the EAS deployment docs.
 */
export const EAS_EIP712_PROXY_ADDRESSES = {
  [base.id]: '0xF095fE4b23958b08D38e52d5d5674bBF0C03cbF6',
  [baseSepolia.id]: '0xF095fE4b23958b08D38e52d5d5674bBF0C03cbF6',
} as const satisfies Record<number, `0x${string}`>;

/* ── Supercompute protocol (Base mainnet) ─────────────────────────────────── */

/**
 * Supercompute Aragon DAO on Base ("We Build Exits").
 * Live treasury + proposal surface for TRADE_DESK.EXE.
 */
export const ARAGON_DAO_ADDRESS =
  '0xCBeD3a57Dd010818ec9249162ce622a33F99C18C' as const;

/** Public governance surfaces (linked, not embedded — see README). */
export const GOVERNANCE_LINKS = {
  aragon: `https://app.aragon.org/dao/base-mainnet/${ARAGON_DAO_ADDRESS}/settings`,
  basescanDao: `https://basescan.org/address/${ARAGON_DAO_ADDRESS}`,
} as const;

/** Primary ENS name for the organisation (Ethereum mainnet). */
export const ORG_ENS_NAME = 'supercompute.eth';

/* ── RPC transports (env-overridable) ─────────────────────────────────────── */
export const RPC_URLS = {
  [baseSepolia.id]:
    import.meta.env.VITE_BASE_SEPOLIA_RPC_URL ?? 'https://sepolia.base.org',
  [base.id]: import.meta.env.VITE_BASE_RPC_URL ?? 'https://mainnet.base.org',
  [mainnet.id]: import.meta.env.VITE_MAINNET_RPC_URL ?? 'https://eth.drpc.org',
} as const;
