/* ============================================================================
 * The Sub-Apps & Feature Matrix — as data
 * ----------------------------------------------------------------------------
 * The matrix is the product roadmap. It lives here, typed, so every module
 * carries its own status and its own blocker and no surface has to guess what is
 * real. Signed off as: IMMERSION OS — SUB-APPS & FEATURE MATRIX.
 *
 * THE ANCHOR RULE (from the directive): every sub-instrument is anchored to the
 * franchise token-bound account. One owner, resolved once — not a per-feature
 * address. `anchor` below records that, and `FRANCHISE_ANCHOR` states why the
 * anchor currently does not resolve.
 *
 * STATUS VOCABULARY — deliberately narrow, so it cannot flatter:
 *   live            working now, in this repo, with real reads or real output
 *   partial         one half works and the other half is named
 *   scaffolded      the model and the surface exist; the mechanism does not
 *   planned         specified, nothing built
 *   sequenced-late  deliberately deferred — legal before engineering
 *   blocked         waiting on something outside this repo
 * ========================================================================= */

export type ModuleStatus =
  | 'live'
  | 'partial'
  | 'scaffolded'
  | 'planned'
  | 'sequenced-late'
  | 'blocked';

export type MatrixCategory =
  | 'Identity & Trust'
  | 'Knowledge & Data'
  | 'Governance & Voting'
  | 'Financial Engine';

export interface MatrixModule {
  id: string;
  /** The primitive, as the matrix names it. */
  primitive: string;
  /** Execution & function, as the matrix states it. */
  fn: string;
  /** Which desk owns it. Every module has one owner or it has none. */
  desk: string;
  status: ModuleStatus;
  /** What is actually in the repo today, when anything is. */
  inRepo?: string;
  blockedBy?: string;
}

/** Every sub-instrument is anchored to the franchise TBA. One owner. */
export const INSTRUMENT_ANCHOR = 'franchise-tba' as const;

export const FRANCHISE_ANCHOR = {
  anchor: INSTRUMENT_ANCHOR,
  rule:
    'Instruments are created under the franchise address, not as independent contracts. The token-bound account already is the community\u2019s address and can own what it creates.',
  /** The anchor resolves once a token is minted and its account exists. */
  resolves: false,
  blockedBy:
    'collection deployed — nothing minted yet, so no token-bound account exists to anchor instruments',
} as const;

export const MATRIX: readonly { category: MatrixCategory; modules: readonly MatrixModule[] }[] = [
  {
    category: 'Identity & Trust',
    modules: [
      {
        id: 'ens',
        primitive: 'ENS (Domain)',
        fn: 'Precondition passport; resolves user/franchise handle, avatars, and core namespace.',
        desk: 'EMBASSY.EXE',
        status: 'live',
        inRepo:
          'useWallet resolves primary name + avatar + text records on mainnet; the passport photograph is the ENS avatar and the MRZ derives from the handle.',
      },
      {
        id: 'eas',
        primitive: 'EAS (Attestation)',
        fn: 'Gasless EIP-712 cryptographic proofs for policy locks, event memories, and collective community state.',
        desk: 'EMBASSY.EXE · NEWS_DESK',
        status: 'partial',
        inRepo:
          'Reads are live through the EAS indexer (attestations, per-address counts, schema registration). EIP-712 proxy address verified on Base and Base Sepolia.',
        blockedBy:
          'Presence schema registered; writes still need a relayer (signed-intent-only for v0)',
      },
      {
        id: 'word',
        primitive: 'NFT: Word',
        fn: 'Tokenized vocabulary and conceptual scopes that act as subscription and governance nodes.',
        desk: 'NEWS_DESK',
        status: 'scaffolded',
        inRepo:
          'Term model with headword, namespace, status, steward, aliases, supersession and provenance; four real seed terms; a status vocabulary (canonical/proposed/contested/deprecated/alias/scoped).',
        blockedBy:
          'nothing is tokenized — a term is data, not an asset; and the lexicon store has no home in the KG node shape',
      },
      {
        id: 'blogging',
        primitive: 'NFT: Blogging',
        fn: 'Lens Protocol-powered publication nodes with built-in collector and split hooks.',
        desk: 'NEWS_DESK',
        status: 'partial',
        inRepo:
          'Lens posts read live (verified query: 10 real posts, authors, lens:// content URIs, full engagement counters). Split terms render as a proposal.',
        blockedBy:
          'collect and split hooks not wired; no wallet, so no writes; feed must be narrowed by author or content focus',
      },
      {
        id: 'imaging',
        primitive: 'NFT: Imaging',
        fn: 'Procedurally generated visual assets, station idents, and ad plates bound to the locked palette.',
        desk: 'CHANNEL.EXE',
        status: 'live',
        inRepo:
          'Sprite compiler emitting 26 assets + a 12-frame animated station ident from geometry, raster + vector, palette-locked, integer scales enforced, with grid validation.',
        blockedBy: 'not tokenized — assets are files, not NFTs',
      },
    ],
  },
  {
    category: 'Knowledge & Data',
    modules: [
      {
        id: 'knowledge-graph',
        primitive: 'KnowledgeGraph',
        fn: 'Multi-mode custody viewer mapping nodes by label, type, description, and properties across namespaces.',
        desk: 'NEWS_DESK',
        status: 'blocked',
        inRepo:
          'The four custody modes are modelled and rendered, including the new holder-owned franchise mode. The viewer itself is upstream (SupercomputeA/supercompute-knowledge-graph, v0.1.1, Terminal Dossier).',
        blockedBy:
          'no per-holder namespace; the node shape is label/type/description/properties with no status, steward or supersession, so a term cannot be stored in it as a term',
      },
      {
        id: 'seo-poll',
        primitive: 'SEO-Styled Metadata Polling',
        fn: 'Front-end utility polling publication metrics, tags, and search index health inside the retro HUD.',
        desk: 'NEWS_DESK',
        status: 'partial',
        inRepo:
          'Publication metrics and tags render live from Lens (comments, reposts, quotes, collects, tips, reactions, bookmarks).',
        blockedBy:
          'search-index health has no source: the protocol exposes no search-console data, and no alternative source is wired. It will not be invented.',
      },
      {
        id: 'prediction',
        primitive: 'Micro Prediction Market',
        fn: 'Sequence-sequenced sentiment tool, sequenced for late implementation to handle event-contract parameters cleanly.',
        desk: 'TRADE_DESK.EXE',
        status: 'sequenced-late',
        inRepo: 'Modelled as a franchise instrument with creation in the scope of the purchase.',
        blockedBy:
          'event contracts on community usage carry securities/derivatives exposure. A legal gate before an engineering one, and sequenced last on purpose.',
      },
    ],
  },
  {
    category: 'Governance & Voting',
    modules: [
      {
        id: 'support-dao',
        primitive: 'Support DAO',
        fn: 'Shared treasury management and operational mandate execution.',
        desk: 'TRADE_DESK.EXE',
        status: 'partial',
        inRepo:
          'Aragon DAO address verified and rendered read-only; governance links out to Aragon.',
        blockedBy: 'no proposal or execution path from the desk',
      },
      {
        id: 'support-vote',
        primitive: 'Support ENS / Voting / EAS',
        fn: 'Native UI bindings allowing franchise holders to vote on proposals and sign protocol changes via attestations.',
        desk: 'EMBASSY.EXE · TRADE_DESK.EXE',
        status: 'blocked',
        inRepo:
          'The franchisee role exists with GOV_PROPOSE / GOV_VOTE, and the role matrix is marked PROPOSED — NOT ENFORCED.',
        blockedBy:
          'no roles contract in any repo, so the bits are a local predicate; no proposal contract and no signing path from the desk',
      },
    ],
  },
  {
    category: 'Financial Engine',
    modules: [
      {
        id: 'subsidy-lp',
        primitive: 'Subsidy LP',
        fn: 'PoolTogether-style capital liquidity pools generating baseline yields for community initiatives.',
        desk: 'TRADE_DESK.EXE',
        status: 'planned',
        blockedBy: 'needs a deployed pool; no DEX pool on Base',
      },
      {
        id: 'subsidy-tax',
        primitive: 'Subsidy Tax',
        fn: 'Automated transactional tax routing from subscribers directly into operational policy pools.',
        desk: 'TRADE_DESK.EXE',
        status: 'planned',
        inRepo:
          'Split terms modelled (writing pool / desk / treasury) and rendered, totalling 100.',
        blockedBy:
          'no split created and no taxable flow to route. 0xSplits SplitMain verified as a contract on mainnet, Base and Base Sepolia.',
      },
      {
        id: 'subsidy-redeem',
        primitive: 'Subsidy Redeem',
        fn: 'Claim mechanism allowing members/contributors to draw against community-bonded funds.',
        desk: 'TRADE_DESK.EXE',
        status: 'planned',
        blockedBy: 'needs bonded funds and an entitlement record; the role bits that would gate it are not enforced',
      },
      {
        id: 'support-token',
        primitive: 'Support Token',
        fn: 'Native token utility ($VIRTUAL / Base integration) for bonding, staking, and unlocking feature tiers.',
        desk: 'TRADE_DESK.EXE',
        status: 'partial',
        inRepo:
          'Virtuals agent and ACP revenue model are documented; the capital token is retired and its replacement is not yet named.',
        blockedBy:
          'no DEX pool, so no price; $VIRTUAL is Virtuals\u2019 own token and is not ours to deploy',
      },
    ],
  },
] as const;

/* ── rollups ─────────────────────────────────────────────────────────────── */

export function modulesByStatus(status: ModuleStatus): MatrixModule[] {
  return MATRIX.flatMap((c) => c.modules).filter((m) => m.status === status);
}

export function matrixTotals(): Record<ModuleStatus, number> {
  const base: Record<ModuleStatus, number> = {
    live: 0,
    partial: 0,
    scaffolded: 0,
    planned: 0,
    'sequenced-late': 0,
    blocked: 0,
  };
  for (const m of MATRIX.flatMap((c) => c.modules)) base[m.status] += 1;
  return base;
}

/**
 * The three the directive prioritises. Kept as data so the desks can mark
 * themselves rather than a comment claiming it.
 */
export const PRIORITY_MODULES = ['blogging', 'ens', 'eas', 'subsidy-tax'] as const;

export const STATUS_TONE: Record<ModuleStatus, string> = {
  live: 'badge badge-live',
  partial: 'badge badge-admin',
  scaffolded: 'badge badge-beta',
  planned: 'badge badge-claude',
  'sequenced-late': 'badge badge-claude',
  blocked: 'badge badge-claude',
};

export const DESK_FOR_MODULE: Record<string, string> = Object.fromEntries(
  MATRIX.flatMap((c) => c.modules).map((m) => [m.id, m.desk]),
);
