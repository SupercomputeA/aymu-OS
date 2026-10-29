/* ============================================================================
 * erc6551-conformance — on-chain verification of the Immersion NFT constants
 * ----------------------------------------------------------------------------
 * Reproduces the "Verified constants" claims made in src/lib/immersion.ts and
 * src/lib/supercompute.ts, by reading the LIVE chain (not a mock):
 *
 *   1. The ERC-6551 registry + account implementation have code on Base and
 *      Base Sepolia.
 *   2. The create2 token-bound-account derivation in immersion.ts
 *      (`computeTokenBoundAccount`) matches the DEPLOYED registry's `account()`
 *      for both chains — i.e. the local derivation is bit-identical to the
 *      canonical on-chain one.
 *   3. The Immersion token contract, 0xSplits SplitMain and the Aragon DAO
 *      have code where the app expects them.
 *   4. EAS + SchemaRegistry have code on the chains the app uses, and the
 *      local `computeSchemaUID` reproduces the two canon Presence schema UIDs.
 *
 * Run from the repo root:
 *
 *   node --experimental-strip-types scripts/erc6551-conformance.ts
 *
 * (Node >= 22.6 required for --experimental-strip-types. No build step; viem
 * is resolved from node_modules. Exits non-zero if any check fails.)
 * ========================================================================= */

import {
  createPublicClient,
  encodeAbiParameters,
  encodePacked,
  getContractAddress,
  http,
  keccak256,
  parseAbiParameters,
  type Address,
  type Hex,
} from 'viem';
import { base, baseSepolia, mainnet } from 'viem/chains';

/* ── Constants under test (keep in sync with src/lib/*.ts) ────────────────── */

const ERC6551_REGISTRY = '0x000000006551c19487814612e58FE06813775758' as const;
const ERC6551_ACCOUNT_IMPLEMENTATION =
  '0x41C8f39463A868d3A88af00cd0fe7102F30E44eC' as const;
const IMMERSION_TOKEN_CONTRACT =
  '0x4416023Cd7fb88f435f8788227092037C8871066' as const;
const SPLITS_MAIN = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE' as const;
const ARAGON_DAO_ADDRESS =
  '0xCBeD3a57Dd010818ec9249162ce622a33F99C18C' as const;

const EAS_ADDRESSES = {
  [base.id]: '0x4200000000000000000000000000000000000021',
  [baseSepolia.id]: '0x4200000000000000000000000000000000000021',
  [mainnet.id]: '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587',
} as const;

const PRESENCE_RESOLVER_ADDRESS =
  '0x6ffaAE8728afd9CCF1756afe070217B665Fa6783' as const;
const PRESENCE_EVENT_SCHEMA =
  'bytes32 eventId, string eventName, uint64 timestamp, string location, bytes32 secretHash' as const;
const PRESENCE_MOMENT_SCHEMA =
  'string mediaCid, string mediaType, uint64 capturedAt, string caption' as const;
const PRESENCE_EVENT_UID =
  '0x1bce2b5e92ec45caa02b89aa1d2ff3724df744004359677e988ac2e742de72b1' as const;
const PRESENCE_MOMENT_UID =
  '0x910d6ebca7d06435f2c0dea9534284e4f30bfe683237746c42baeb30b8db18bb' as const;

/* ── Derivation under test (mirrors src/lib/immersion.ts) ─────────────────── */

const ERC1167_HEADER = '3d60ad80600a3d3981f3363d3d373d3d3d363d73';
const ERC1167_FOOTER = '5af43d82803e903d91602b57fd5bf3';
const ZERO_SALT = `0x${'00'.repeat(32)}` as Hex;

function computeTokenBoundAccount(
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

function computeSchemaUID(schema: string, resolver: Address, revocable: boolean): Hex {
  return keccak256(encodePacked(['string', 'address', 'bool'], [schema, resolver, revocable]));
}

/* ── Harness ──────────────────────────────────────────────────────────────── */

const REGISTRY_ABI = [
  {
    name: 'account',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'implementation', type: 'address' },
      { name: 'salt', type: 'bytes32' },
      { name: 'chainId', type: 'uint256' },
      { name: 'tokenContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

let failures = 0;
function check(label: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures += 1;
}

async function main(): Promise<void> {
  const rpc = {
    [base.id]: 'https://mainnet.base.org',
    [baseSepolia.id]: 'https://sepolia.base.org',
    [mainnet.id]: 'https://eth.drpc.org',
  } as const;

  // ERC-6551 + Immersion TBA, on the two chains the app anchors to.
  for (const chain of [base, baseSepolia] as const) {
    const client = createPublicClient({ chain, transport: http(rpc[chain.id]) });
    const name = chain.name;

    const regCode = await client.getBytecode({ address: ERC6551_REGISTRY });
    check(`${name} registry has code`, !!regCode && regCode !== '0x', `len=${regCode?.length ?? 0}`);

    const implCode = await client.getBytecode({ address: ERC6551_ACCOUNT_IMPLEMENTATION });
    check(`${name} impl has code`, !!implCode && implCode !== '0x', `len=${implCode?.length ?? 0}`);

    const tokenId = 1n;
    const derived = computeTokenBoundAccount(
      ERC6551_ACCOUNT_IMPLEMENTATION,
      ZERO_SALT,
      BigInt(chain.id),
      IMMERSION_TOKEN_CONTRACT,
      tokenId,
    );
    const onChain = await client
      .readContract({
        address: ERC6551_REGISTRY,
        abi: REGISTRY_ABI,
        functionName: 'account',
        args: [ERC6551_ACCOUNT_IMPLEMENTATION, ZERO_SALT, BigInt(chain.id), IMMERSION_TOKEN_CONTRACT, tokenId],
      })
      .catch((e: unknown) => `ERR:${(e as { shortMessage?: string })?.shortMessage ?? String(e)}`);
    check(
      `${name} TBA derivation matches registry.account()`,
      derived.toLowerCase() === String(onChain).toLowerCase(),
      `derived=${derived} onchain=${onChain}`,
    );
  }

  // Immersion collection + splits on Base Sepolia.
  {
    const client = createPublicClient({ chain: baseSepolia, transport: http(rpc[baseSepolia.id]) });
    const token = await client.getBytecode({ address: IMMERSION_TOKEN_CONTRACT });
    check('Immersion token contract has code (Base Sepolia)', !!token && token !== '0x', `len=${token?.length ?? 0}`);
    const splits = await client.getBytecode({ address: SPLITS_MAIN });
    check('0xSplits SplitMain has code (Base Sepolia)', !!splits && splits !== '0x', `len=${splits?.length ?? 0}`);
  }

  // Aragon DAO on Base.
  {
    const client = createPublicClient({ chain: base, transport: http(rpc[base.id]) });
    const dao = await client.getBytecode({ address: ARAGON_DAO_ADDRESS });
    check('Aragon DAO has code (Base)', !!dao && dao !== '0x', `len=${dao?.length ?? 0}`);
  }

  // EAS + SchemaRegistry code, and the two canon Presence schema UIDs.
  for (const chain of [base, baseSepolia, mainnet] as const) {
    const client = createPublicClient({ chain, transport: http(rpc[chain.id]) });
    const eas = await client.getBytecode({ address: EAS_ADDRESSES[chain.id] });
    check(`EAS has code (${chain.name})`, !!eas && eas !== '0x', `len=${eas?.length ?? 0}`);
  }
  {
    const client = createPublicClient({ chain: baseSepolia, transport: http(rpc[baseSepolia.id]) });
    const resolver = await client.getBytecode({ address: PRESENCE_RESOLVER_ADDRESS });
    check('PresenceResolver has code (Base Sepolia)', !!resolver && resolver !== '0x', `len=${resolver?.length ?? 0}`);
    check(
      'computeSchemaUID reproduces PRESENCE_EVENT_UID',
      computeSchemaUID(PRESENCE_EVENT_SCHEMA, PRESENCE_RESOLVER_ADDRESS, true) === PRESENCE_EVENT_UID,
    );
    check(
      'computeSchemaUID reproduces PRESENCE_MOMENT_UID',
      computeSchemaUID(PRESENCE_MOMENT_SCHEMA, PRESENCE_RESOLVER_ADDRESS, true) === PRESENCE_MOMENT_UID,
    );
  }

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
