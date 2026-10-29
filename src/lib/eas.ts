/* ============================================================================
 * EAS — Ethereum Attestation Service schemas, ABIs and payload encoding
 * ----------------------------------------------------------------------------
 * TWO populations of schema live here, and they are NOT the same thing:
 *
 *  1. CANON PRESENCE SCHEMAS (authoritative)
 *     Copied verbatim from the private `SupercomputeA/presence` monorepo:
 *       packages/contracts/schemas.json  →  PresenceEvent, PresenceMoment
 *     Status per canon metadata: version 0.0.1, phase A1, chainId 84532,
 *     resolverAddress "TBD_DEPLOY_A5". The Phase A5 registration is now DONE:
 *     the resolver is deployed and the schemas are registered on Base Sepolia
 *     (see PRESENCE_RESOLVER_ADDRESS / PRESENCE_EVENT_UID below).
 *
 *  2. SUPERCOMPUTE-LOCAL DISPATCH SCHEMA (not canon, ours)
 *     NEWS_DESK.EXE's broadsheet dispatch. Marked `canon: false` throughout. It
 *     is a proposal, not part of the Presence program.
 * ========================================================================= */

import {
  encodeAbiParameters,
  encodePacked,
  keccak256,
  parseAbiParameters,
  toHex,
  type Address,
  type Hex,
} from 'viem';
import { base, baseSepolia, mainnet } from 'wagmi/chains';
import {
  EAS_ADDRESSES,
  SCHEMA_REGISTRY_ADDRESSES,
} from './supercompute';

export const ZERO_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as const;

export const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000' as const;

/* ── ABIs (hand-written minimal surface; no codegen step) ─────────────────── */

export const EAS_ABI = [
  {
    type: 'function',
    name: 'attest',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'request',
        type: 'tuple',
        components: [
          { name: 'schema', type: 'bytes32' },
          {
            name: 'data',
            type: 'tuple',
            components: [
              { name: 'recipient', type: 'address' },
              { name: 'expirationTime', type: 'uint64' },
              { name: 'revocable', type: 'bool' },
              { name: 'refUID', type: 'bytes32' },
              { name: 'data', type: 'bytes' },
              { name: 'value', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'getAttestation',
    stateMutability: 'view',
    inputs: [{ name: 'uid', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'uid', type: 'bytes32' },
          { name: 'schema', type: 'bytes32' },
          { name: 'time', type: 'uint64' },
          { name: 'expirationTime', type: 'uint64' },
          { name: 'revocationTime', type: 'uint64' },
          { name: 'refUID', type: 'bytes32' },
          { name: 'recipient', type: 'address' },
          { name: 'attester', type: 'address' },
          { name: 'revocable', type: 'bool' },
          { name: 'data', type: 'bytes' },
        ],
      },
    ],
  },
  {
    type: 'event',
    name: 'Attested',
    inputs: [
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'attester', type: 'address', indexed: true },
      { name: 'uid', type: 'bytes32', indexed: false },
      { name: 'schemaUID', type: 'bytes32', indexed: true },
    ],
  },
] as const;

export const SCHEMA_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'register',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'schema', type: 'string' },
      { name: 'resolver', type: 'address' },
      { name: 'revocable', type: 'bool' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'getSchema',
    stateMutability: 'view',
    inputs: [{ name: 'uid', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'uid', type: 'bytes32' },
          { name: 'resolver', type: 'address' },
          { name: 'revocable', type: 'bool' },
          { name: 'schema', type: 'string' },
        ],
      },
    ],
  },
] as const;

/**
 * PresenceResolver inherits the canonical EAS SchemaResolver. Its external
 * entry points are the standard four; the only Presence-specific surface is
 * `isPayable()`, which canon returns false for.
 */
export const PRESENCE_RESOLVER_ABI = [
  {
    type: 'function',
    name: 'isPayable',
    stateMutability: 'pure',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'error',
    name: 'InvalidChainId',
    inputs: [{ name: 'chainId', type: 'uint256' }],
  },
  {
    type: 'error',
    name: 'InvalidRecipient',
    inputs: [{ name: 'recipient', type: 'address' }],
  },
] as const;

export function easAddress(chainId: number): Address {
  if (chainId === mainnet.id) return EAS_ADDRESSES[mainnet.id] as Address;
  if (chainId === base.id) return EAS_ADDRESSES[base.id] as Address;
  return EAS_ADDRESSES[baseSepolia.id] as Address;
}

export function schemaRegistryAddress(chainId: number): Address {
  if (chainId === mainnet.id)
    return SCHEMA_REGISTRY_ADDRESSES[mainnet.id] as Address;
  if (chainId === base.id)
    return SCHEMA_REGISTRY_ADDRESSES[base.id] as Address;
  return SCHEMA_REGISTRY_ADDRESSES[baseSepolia.id] as Address;
}

/* ── Schema definitions ───────────────────────────────────────────────────── */

export interface SchemaDef {
  key: string;
  title: string;
  /** EAS schema string — field order IS the ABI encoding order. */
  schema: string;
  /** viem parameter list matching `schema`, used to encode the payload. */
  abiParams: string;
  revocable: boolean;
  chainId: number;
  resolverAddress: string;
  /** false ⇒ this is a Supercompute proposal, not part of the Presence program. */
  canon: boolean;
  note: string;
}

/**
 * Canon Presence schemas — verbatim from packages/contracts/schemas.json.
 * Registered on Base Sepolia with the deployed PresenceResolver (Phase A5);
 * the resolver address and resulting UIDs are the on-chain values, not
 * placeholders. See DeployPresence.s.sol + presence-chain.ts.
 */

/** Deployed PresenceResolver on Base Sepolia (84532). */
export const PRESENCE_RESOLVER_ADDRESS =
  '0x6ffaAE8728afd9CCF1756afe070217B665Fa6783' as const;

export const PRESENCE_EVENT_UID =
  '0x1bce2b5e92ec45caa02b89aa1d2ff3724df744004359677e988ac2e742de72b1' as const;

export const PRESENCE_MOMENT_UID =
  '0x910d6ebca7d06435f2c0dea9534284e4f30bfe683237746c42baeb30b8db18bb' as const;

export const PRESENCE_EVENT: SchemaDef = {
  key: 'PresenceEvent',
  title: 'PresenceEvent',
  schema:
    'bytes32 eventId, string eventName, uint64 timestamp, string location, bytes32 secretHash',
  abiParams:
    'bytes32 eventId,string eventName,uint64 timestamp,string location,bytes32 secretHash',
  revocable: true,
  chainId: baseSepolia.id,
  resolverAddress: PRESENCE_RESOLVER_ADDRESS,
  canon: true,
  note: 'Attestation schema for proof-of-attendance at an event.',
};

export const PRESENCE_MOMENT: SchemaDef = {
  key: 'PresenceMoment',
  title: 'PresenceMoment',
  schema: 'string mediaCid, string mediaType, uint64 capturedAt, string caption',
  abiParams:
    'string mediaCid,string mediaType,uint64 capturedAt,string caption',
  revocable: true,
  chainId: baseSepolia.id,
  resolverAddress: PRESENCE_RESOLVER_ADDRESS,
  canon: true,
  note:
    'Media moments pinned to IPFS. The link to the parent PresenceEvent is an ' +
    'attestation-level refUID, NOT a schema field — the schema deliberately has ' +
    'no eventUid.',
};

/** NEWS_DESK.EXE's broadsheet dispatch. Ours, not canon. */
export const DISPATCH: SchemaDef = {
  key: 'dispatch',
  title: 'NEWSDESK_DISPATCH',
  schema:
    'string headline,string bodyURI,string[] tags,uint64 publishedAt,string authorENS',
  abiParams:
    'string headline,string bodyURI,string[] tags,uint64 publishedAt,string authorENS',
  revocable: true,
  chainId: baseSepolia.id,
  resolverAddress: ZERO_ADDRESS,
  canon: false,
  note: 'Supercompute-local proposal. Not part of the Presence program.',
};

export function schemaByKey(key: string): SchemaDef {
  const found = [PRESENCE_EVENT, PRESENCE_MOMENT, DISPATCH].find(
    (s) => s.key === key,
  );
  if (!found) throw new Error(`Unknown schema key: ${key}`);
  return found;
}

/**
 * Deterministic EAS schema UID:
 *   keccak256(abi.encodePacked(schema, resolver, revocable))
 * Matches what `SchemaRegistry.register` yields. With the resolver deployed
 * this helper returns the on-chain UID — verified to equal PRESENCE_EVENT_UID /
 * PRESENCE_MOMENT_UID for the two canon schemas.
 */
export function computeSchemaUID(
  schema: string,
  resolver: Address = ZERO_ADDRESS,
  revocable = true,
): Hex {
  return keccak256(
    encodePacked(['string', 'address', 'bool'], [schema, resolver, revocable]),
  );
}

export function proposedSchemaUID(def: SchemaDef, resolver?: Address): Hex {
  const r =
    resolver ??
    (/^0x[0-9a-fA-F]{40}$/.test(def.resolverAddress)
      ? (def.resolverAddress as Address)
      : ZERO_ADDRESS);
  return computeSchemaUID(def.schema, r, def.revocable);
}

/* ── Canon payload encoding ───────────────────────────────────────────────── */

export interface PresenceEventData {
  eventId: Hex;
  eventName: string;
  timestamp: bigint;
  location: string;
  secretHash: Hex;
}

export interface PresenceMomentData {
  mediaCid: string;
  mediaType: string;
  capturedAt: bigint;
  caption: string;
}

export function encodePresenceEvent(d: PresenceEventData): Hex {
  return encodeAbiParameters(parseAbiParameters(PRESENCE_EVENT.abiParams), [
    d.eventId,
    d.eventName,
    d.timestamp,
    d.location,
    d.secretHash,
  ]);
}

export function encodePresenceMoment(d: PresenceMomentData): Hex {
  return encodeAbiParameters(parseAbiParameters(PRESENCE_MOMENT.abiParams), [
    d.mediaCid,
    d.mediaType,
    d.capturedAt,
    d.caption,
  ]);
}

/* ── Local dispatch payload ───────────────────────────────────────────────── */

export interface DispatchPayload {
  headline: string;
  bodyURI: string;
  tags: string[];
  publishedAt: bigint;
  authorENS: string;
}

export function encodeDispatch(p: DispatchPayload): Hex {
  return encodeAbiParameters(parseAbiParameters(DISPATCH.abiParams), [
    p.headline,
    p.bodyURI,
    p.tags,
    p.publishedAt,
    p.authorENS,
  ]);
}

/** EAS accepts a bytes32 as a plain right-padded string reference. */
export function stringToBytes32(s: string): Hex {
  return toHex(s, { size: 32 });
}
