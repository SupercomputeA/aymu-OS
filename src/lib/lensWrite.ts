/* ============================================================================
 * lensWrite — the Lens Chain WRITE side (thin viem adapter, no SDK)
 * ----------------------------------------------------------------------------
 * Gate B · Turn 1. The READ side (src/lib/lens.ts) reads the namespace over
 * GraphQL. This module is the WRITE side: post a Verb and collect it, as raw
 * on-chain transactions composed with viem — no @lens-chain/sdk, no ethers,
 * no zksync.
 *
 * WHAT IS VERIFIED (against lens-protocol/lens-v3 @ development, fetched while
 * building this): the contract addresses (scripts/out/addresses.csv) and the
 * ABIs (ABIs/*.abi.json) reproduced below, plus the collect-config key
 * constants (keccak256 of "lens.param.*", from SimpleCollectAction.sol).
 *
 * THE ON-CHAIN SHAPE (Lens v3):
 *   · post   = Feed.createPost(CreatePostParams) — the content, no action yet.
 *   · attach = ActionHub.configurePostAction(SimpleCollectAction, feed, postId,
 *              collectConfig) — attaches the collect action.
 *   · collect= ActionHub.executePostAction(SimpleCollectAction, feed, postId,
 *              []) — a user collects the Verb (the mint).
 *
 * WHAT IS NOT DONE YET, AND SAYS SO: the live post + collect need the
 * franchise Lens account (VITE_LENS_NAMESPACE_AUTHOR), its feed address, and
 * GHO gas. The composition below is unit-tested offline; the broadcast path
 * reports a real reason when those are missing — it never invents a hash.
 *
 * Collect config (v0.1): isImmutable = true (the Verb snapshots at mint),
 * free (no payToCollect), open (no limit / end time / follower gate).
 * ========================================================================= */

import {
  encodeAbiParameters,
  encodeFunctionData,
  type Hex,
} from 'viem';
import { pinJson, type PinResult } from './ipfs';

/* ── verified constants ──────────────────────────────────────────────────── */

/** Lens Chain chain id. This gate targets the testnet (37111); the mainnet
 *  (232) switch is a later gate, not a defect here. */
export const LENS_CHAIN_ID = 37111;

/** SimpleCollectAction — the built-in post action (free/open/immutable). */
export const SIMPLE_COLLECT_ACTION =
  '0x17d5B3917Eab14Ab4923DEc597B39EF64863C830' as const;

/** ActionHub — orchestrates configure + execute of post actions. */
export const ACTION_HUB = '0x4A92a97Ff3a3604410945ae8CA25df4fBB2fDC11' as const;

/** keccak256("lens.param.isImmutable") — verified in SimpleCollectAction.sol. */
export const PARAM__IS_IMMUTABLE =
  '0x4d1cad3e438026974130ac84979964dd6019eace55216c3de16bc79e36a4c44b' as const;

/* ── ABIs (verified from lens-protocol/lens-v3 ABIs/) ─────────────────────── */

const KEY_VALUE = [
  { name: 'key', type: 'bytes32' },
  { name: 'value', type: 'bytes' },
] as const;

const RULE_PROCESSING_PARAMS = [
  { name: 'ruleAddress', type: 'address' },
  { name: 'configSalt', type: 'bytes32' },
  { name: 'ruleParams', type: 'tuple[]', components: KEY_VALUE },
] as const;

export const FEED_CREATE_POST_ABI = {
  type: 'function',
  name: 'createPost',
  stateMutability: 'nonpayable',
  inputs: [
    {
      name: 'postParams',
      type: 'tuple',
      components: [
        { name: 'author', type: 'address' },
        { name: 'contentURI', type: 'string' },
        { name: 'repostedPostId', type: 'uint256' },
        { name: 'quotedPostId', type: 'uint256' },
        { name: 'repliedPostId', type: 'uint256' },
        {
          name: 'ruleChanges',
          type: 'tuple[]',
          components: [
            { name: 'ruleAddress', type: 'address' },
            { name: 'configSalt', type: 'bytes32' },
            {
              name: 'configurationChanges',
              type: 'tuple',
              components: [
                { name: 'configure', type: 'bool' },
                { name: 'ruleParams', type: 'tuple[]', components: KEY_VALUE },
              ],
            },
            {
              name: 'selectorChanges',
              type: 'tuple[]',
              components: [
                { name: 'ruleSelector', type: 'bytes4' },
                { name: 'isRequired', type: 'bool' },
                { name: 'enabled', type: 'bool' },
              ],
            },
          ],
        },
        { name: 'extraData', type: 'tuple[]', components: KEY_VALUE },
      ],
    },
    { name: 'customParams', type: 'tuple[]', components: KEY_VALUE },
    { name: 'feedRulesParams', type: 'tuple[]', components: RULE_PROCESSING_PARAMS },
    { name: 'rootPostRulesParams', type: 'tuple[]', components: RULE_PROCESSING_PARAMS },
    { name: 'quotedPostRulesParams', type: 'tuple[]', components: RULE_PROCESSING_PARAMS },
  ],
  outputs: [{ name: '', type: 'uint256' }],
} as const;

export const ACTION_HUB_ABI = [
  {
    type: 'function',
    name: 'configurePostAction',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'action', type: 'address' },
      { name: 'feed', type: 'address' },
      { name: 'postId', type: 'uint256' },
      { name: 'params', type: 'tuple[]', components: KEY_VALUE },
    ],
    outputs: [{ name: '', type: 'bytes' }],
  },
  {
    type: 'function',
    name: 'executePostAction',
    stateMutability: 'payable',
    inputs: [
      { name: 'action', type: 'address' },
      { name: 'feed', type: 'address' },
      { name: 'postId', type: 'uint256' },
      { name: 'params', type: 'tuple[]', components: KEY_VALUE },
    ],
    outputs: [{ name: '', type: 'bytes' }],
  },
] as const;

/* ── types ───────────────────────────────────────────────────────────────── */

export interface VerbDraft {
  headword: string;
  definition: string;
  /** Additional namespace tags; "verb" is always prepended. */
  tags?: string[];
}

export interface KeyValue {
  key: Hex;
  value: Hex;
}

/** The honest result of a broadcast attempt. No invented hash, ever. */
export type WriteStatus =
  | { status: 'ok'; txHash: Hex; pinned: PinResult }
  | { status: 'blocked'; reason: string; pinned?: PinResult }
  | { status: 'error'; reason: string; pinned?: PinResult };

export interface WriterContext {
  /** The connected EOA that will sign the transaction. */
  account: Hex;
  /** The franchise's Lens feed (the app primitive posts live on). */
  feed: Hex;
  /** The franchise Lens account (smart wallet) that authors the Verb. */
  author: Hex;
  sendTransaction: (to: Hex, data: Hex) => Promise<Hex>;
}

/* ── metadata (the Verb's content, deterministic) ────────────────────────── */

/**
 * The content metadata pinned to IPFS and referenced by the post's contentURI.
 * `title` + `content` + `tags` are the fields the READ side (src/lib/lens.ts)
 * resolves into ArticleMetadata/TextOnlyMetadata — so the same headword the
 * read side lists is what the write side posts.
 *
 * The `$schema` + `mainContentFocus` follow the Lens v3 metadata envelope; the
 * schema URL is the canonical Lens metadata v3 URL and is the one thing here
 * not independently re-verified at pin time (the live rail will confirm it).
 */
export function composeVerbMetadata({
  headword,
  definition,
  tags = [],
}: VerbDraft): Record<string, unknown> {
  return {
    $schema:
      'https://raw.githubusercontent.com/lens-protocol/LensProtocol/main/metadata/v3/schemas/publication.json',
    lens: {
      id: 'supercompute',
      mainContentFocus: 'ARTICLE',
    },
    title: headword.trim(),
    content: definition.trim(),
    tags: ['verb', ...tags.map((t) => t.trim()).filter(Boolean)],
    attachments: [],
  };
}

/* ── collect config (v0.1: free, open, immutable) ────────────────────────── */

/**
 * The SimpleCollectAction configuration as KeyValue[]. v0.1 is the honest
 * minimum: `isImmutable = true` (the Verb content snapshots at mint). amount,
 * collectLimit, followerOnlyGraph and endTimestamp are all absent, which is
 * their default — free, unlimited, open, no end time.
 */
export function encodeCollectConfig(): KeyValue[] {
  return [
    {
      key: PARAM__IS_IMMUTABLE,
      value: encodeAbiParameters([{ type: 'bool' }], [true]),
    },
  ];
}

/* ── calldata composition (pure, unit-tested) ────────────────────────────── */

/** Feed.createPost — posts the Verb (no action attached yet). */
export function buildPostCalldata(params: {
  author: Hex;
  contentURI: string;
}): Hex {
  return encodeFunctionData({
    abi: [FEED_CREATE_POST_ABI],
    functionName: 'createPost',
    args: [
      {
        author: params.author,
        contentURI: params.contentURI,
        repostedPostId: 0n,
        quotedPostId: 0n,
        repliedPostId: 0n,
        ruleChanges: [],
        extraData: [],
      },
      [],
      [],
      [],
      [],
    ],
  });
}

/** ActionHub.configurePostAction — attaches the free/open/immutable collect. */
export function buildConfigurePostActionCalldata(params: {
  feed: Hex;
  postId: bigint;
}): Hex {
  return encodeFunctionData({
    abi: ACTION_HUB_ABI,
    functionName: 'configurePostAction',
    args: [SIMPLE_COLLECT_ACTION, params.feed, params.postId, encodeCollectConfig()],
  });
}

/** ActionHub.executePostAction — the collect (the Verb mint). */
export function buildCollectCalldata(params: {
  feed: Hex;
  postId: bigint;
}): Hex {
  return encodeFunctionData({
    abi: ACTION_HUB_ABI,
    functionName: 'executePostAction',
    args: [SIMPLE_COLLECT_ACTION, params.feed, params.postId, []],
  });
}

/* ── the write adapter ───────────────────────────────────────────────────── */

/**
 * Post a Verb: pin the content metadata, then sign + broadcast a
 * Feed.createPost carrying the pinned URI. The SimpleCollectAction is attached
 * in a second, separate transaction (buildConfigurePostActionCalldata) once
 * the createPost's postId resolves — that ordering is the protocol's, not ours.
 *
 * Honest: without a pin endpoint the metadata degrades to a data: URI and the
 * post would still broadcast; without an account/feed it reports `blocked`.
 */
export async function postVerb(
  draft: VerbDraft,
  ctx: WriterContext,
): Promise<WriteStatus> {
  const metadata = composeVerbMetadata(draft);
  const pinned = await pinJson(metadata, { name: `verb-${draft.headword.trim() || 'unnamed'}` });

  if (!ctx.author || !ctx.feed || !ctx.account) {
    return {
      status: 'blocked',
      reason:
        'No Lens account or feed configured (VITE_LENS_NAMESPACE_AUTHOR and the franchise feed are unset).',
      pinned,
    };
  }

  const data = buildPostCalldata({ author: ctx.author, contentURI: pinned.uri });
  try {
    const txHash = await ctx.sendTransaction(ctx.feed, data);
    return { status: 'ok', txHash, pinned };
  } catch (err) {
    return {
      status: 'error',
      reason: err instanceof Error ? err.message : String(err),
      pinned,
    };
  }
}

/**
 * Collect a Verb: sign + broadcast an ActionHub.executePostAction for the
 * SimpleCollectAction on the given post. This is the mint.
 */
export async function collectVerb(
  params: { feed: Hex; postId: bigint },
  ctx: WriterContext,
): Promise<WriteStatus> {
  if (!ctx.account || !ctx.feed) {
    return {
      status: 'blocked',
      reason: 'No wallet or feed — a collect must be signed by the collector.',
      pinned: { pinned: false, uri: '', reason: 'not applicable' },
    };
  }
  const data = buildCollectCalldata({ feed: params.feed, postId: params.postId });
  try {
    const txHash = await ctx.sendTransaction(ctx.feed, data);
    return {
      status: 'ok',
      txHash,
      pinned: { pinned: false, uri: '', reason: 'collect needs no metadata' },
    };
  } catch (err) {
    return {
      status: 'error',
      reason: err instanceof Error ? err.message : String(err),
      pinned: { pinned: false, uri: '', reason: 'collect needs no metadata' },
    };
  }
}
