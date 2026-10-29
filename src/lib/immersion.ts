/* ============================================================================
 * THE IMMERSION NFT — token-bound smart wallet container
 * ----------------------------------------------------------------------------
 * The Immersion NFT is the OS's root object: one NFT whose token-bound account
 * holds identity, roles, modules and assets for a single person or project.
 *
 * That is ERC-6551 (Non-fungible Token Bound Accounts). Everything in this file
 * about ERC-6551 is VERIFIED, not assumed:
 *
 *   • registry  0x000000006551c19487814612e58FE06813775758 — code confirmed on
 *     Base (8453) and Base Sepolia (84532)
 *   • impl      0x41C8f39463A868d3A88af00cd0fe7102F30E44eC — code confirmed on both
 *   • the create2 derivation below matches the DEPLOYED registry's `account()`
 *     for both chains (see scripts/erc6551-conformance.ts)
 *
 * Interface (eips.ethereum.org/EIPS/eip-6551):
 *   account(address implementation, bytes32 salt, uint256 chainId,
 *           address tokenContract, uint256 tokenId) view returns (address)
 *
 * Two traps worth remembering, both of which bit an earlier draft:
 *   1. argument order is (implementation, salt, chainId, tokenContract, tokenId)
 *   2. create2 uses the RAW salt — it is NOT re-hashed. The appended tail is
 *      abi.encode(salt, chainId, tokenContract, tokenId), and the creation code
 *      is `constructor prologue + deployed runtime`.
 * ========================================================================= */

import {
  encodeAbiParameters,
  getContractAddress,
  parseAbiParameters,
  type Address,
  type Hex,
} from 'viem';
import { baseSepolia } from 'wagmi/chains';

/* ── Verified protocol constants ──────────────────────────────────────────── */

export const ERC6551_REGISTRY =
  '0x000000006551c19487814612e58FE06813775758' as const;

/** Canonical ERC6551Account implementation. */
export const ERC6551_ACCOUNT_IMPLEMENTATION =
  '0x41C8f39463A868d3A88af00cd0fe7102F30E44eC' as const;

/** Base 0xSplits SplitMain — code confirmed on Base and Base Sepolia. */
export const SPLITS_MAIN = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE' as const;

/**
 * The Immersion collection is deployed on Base SEPOLIA (84532), NOT Base mainnet.
 * Every Immersion TBA derivation must anchor here; a mainnet chainId produces a
 * franchise address that can never match the on-chain tokenBoundAccount for the
 * deployed collection.
 */
export const IMMERSION_CHAIN_ID = baseSepolia.id; // 84532

/**
 * The Immersion NFT collection, Base Sepolia — deployed block 48127866,
 * tx 0x2db3165abd887894bdb6c859bd6bdd3a49cb8e1effacb3e593adad875be52844.
 * Public on-chain data (non-secret); committed so the app can boot against the
 * live deployment without a local `.env`. `VITE_IMMERSION_TOKEN_CONTRACT`
 * still overrides it (e.g. for a later mainnet deploy).
 */
export const IMMERSION_TOKEN_CONTRACT =
  '0x4416023Cd7fb88f435f8788227092037C8871066' as const;

const ERC1167_HEADER = '3d60ad80600a3d3981f3363d3d373d3d3d363d73';
const ERC1167_FOOTER = '5af43d82803e903d91602b57fd5bf3';

/**
 * Derive the token-bound account address for an Immersion NFT.
 *
 * Mirrors the reference registry's create2 maths exactly; verified against the
 * deployed registry on Base and Base Sepolia.
 */
export function computeTokenBoundAccount(
  implementation: Address,
  salt: Hex,
  chainId: bigint,
  tokenContract: Address,
  tokenId: bigint,
): Address {
  const tail = encodeAbiParameters(
    parseAbiParameters('bytes32,uint256,address,uint256'),
    [salt, chainId, tokenContract, tokenId],
  );
  const creationCode =
    `0x${ERC1167_HEADER}${implementation.slice(2)}${ERC1167_FOOTER}${tail.slice(2)}` as Hex;
  return getContractAddress({
    bytecode: creationCode,
    from: ERC6551_REGISTRY,
    salt,
    opcode: 'CREATE2',
  });
}

export const ZERO_SALT = `0x${'00'.repeat(32)}` as Hex;

/** Convenience: the Immersion account for a token on a supported chain. */
export function immersionAccount(
  tokenContract: Address,
  tokenId: bigint,
  chainId: number = IMMERSION_CHAIN_ID,
  salt: Hex = ZERO_SALT,
): Address {
  return computeTokenBoundAccount(
    ERC6551_ACCOUNT_IMPLEMENTATION,
    salt,
    BigInt(chainId),
    tokenContract,
    tokenId,
  );
}

/* ── The architecture, as data ────────────────────────────────────────────── */

export type PillarId = 'identity' | 'operations' | 'modules' | 'finance';

export interface ModuleRef {
  /** Matches an id in src/apps/registry.ts where a desk exists. */
  appId?: string;
  label: string;
  /** Present when this module is specified but not yet built. */
  pending?: boolean;
}

export interface Pillar {
  id: PillarId;
  label: string;
  blurb: string;
  modules: ModuleRef[];
}

/**
 * The four pillars from the architecture brief. `pending` marks capabilities
 * that are specified but have no implementation in this OS yet — the UI shows
 * them as such rather than pretending they exist.
 */
export const PILLARS: readonly Pillar[] = [
  {
    id: 'identity',
    label: 'Identity & DAO',
    blurb: 'Who you are in the bubble, and what you may do.',
    modules: [
      { label: 'ENS login' },
      { label: '15-role matrix' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    blurb: 'What the bubble actually runs.',
    // `appId` must name an id in src/apps/registry.ts — the wizard resolves it to
    // the desk's real title, and an id that names nothing renders as unbuilt.
    // Presence has no desk (it is a lib plus the Embassy's own surface), so it
    // carries no appId and says so.
    modules: [
      { label: 'Presence events', pending: true },
      { appId: 'school', label: 'School / courses' },
      { appId: 'channel', label: 'Channels & live' },
    ],
  },
  {
    id: 'modules',
    label: 'Modules / .EXE',
    blurb: 'The desks themselves.',
    modules: [
      { appId: 'newsdesk', label: 'NewsDesk (blog)' },
      { appId: 'storefront', label: 'StoreFront (merch)' },
      { appId: 'wallet', label: 'Wallet' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance / Assets',
    blurb: 'Money, and what it is doing.',
    modules: [
      { appId: 'tradedesk', label: 'TradeDesk (CDP / LP)' },
      { appId: 'tradedesk', label: '0xSplits distribution' },
      { appId: 'tradedesk', label: 'Local token / splits' },
      { appId: 'tradedesk', label: 'Immersion project' },
    ],
  },
] as const;

/* ── Passport state ───────────────────────────────────────────────────────── */

export interface ImmersionPassport {
  /** Chain the container is anchored on. */
  chainId: number;
  chainName: string;
  tokenContract: Address | null;
  tokenId: bigint | null;
  /** Token-bound account — the container itself. */
  account: Address | null;
  /** Registry that derives/creates it. */
  registry: Address;
  implementation: Address;
  /** Primary ENS for the holder, resolved on mainnet. */
  ensName: string | null;
  /** Role ids held, from src/lib/roles.ts. */
  roles: string[];
  /** Everything is derived locally; nothing is minted yet. */
  minted: false;
}

/** A passport before an Immersion NFT exists — the honest empty state. */
export function emptyPassport(ensName: string | null = null): ImmersionPassport {
  return {
    chainId: IMMERSION_CHAIN_ID,
    chainName: 'Base Sepolia',
    tokenContract: null,
    tokenId: null,
    account: null,
    registry: ERC6551_REGISTRY,
    implementation: ERC6551_ACCOUNT_IMPLEMENTATION,
    ensName,
    roles: [],
    minted: false,
  };
}

/**
 * Derive a passport for a given Immersion token. Until the collection is
 * deployed there is no real tokenContract, so callers pass what they have and
 * the UI renders the derivation as a preview.
 */
export function derivePassport(params: {
  tokenContract: Address;
  tokenId: bigint;
  chainId?: number;
  ensName?: string | null;
  roles?: string[];
}): ImmersionPassport {
  const chainId = params.chainId ?? IMMERSION_CHAIN_ID;
  return {
    chainId,
    chainName: chainId === baseSepolia.id ? 'Base Sepolia' : 'Base',
    tokenContract: params.tokenContract,
    tokenId: params.tokenId,
    account: immersionAccount(params.tokenContract, params.tokenId, chainId),
    registry: ERC6551_REGISTRY,
    implementation: ERC6551_ACCOUNT_IMPLEMENTATION,
    ensName: params.ensName ?? null,
    roles: params.roles ?? [],
    minted: false,
  };
}

/** Deterministic IPFS-ish metadata URI shape for a token (not pinned here). */
export function tokenMetadataUri(tokenId: bigint): string {
  return `ipfs://<collection-cid>/${tokenId.toString()}.json`;
}
