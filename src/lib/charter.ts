/* ============================================================================
 * The Charter — what buying an Immersion NFT actually grants
 * ----------------------------------------------------------------------------
 * The Immersion NFT is not a collectible with a picture. It is a **brand
 * charter**: a franchise. This module is the typed model of what the purchase
 * confers, so the grant is reviewable instead of implied by a paragraph.
 *
 * HONEST STATE: the collection is deployed (committed IMMERSION_TOKEN_CONTRACT),
 * but nothing is minted, so no charter is issued, no token-bound account exists
 * on chain, and no values attestation can be signed.
 * Every right therefore carries a `status`, and the design rule is that an
 * ungranted right keeps its row and says `not-wired` — never an em-dash, never
 * a plausible-looking value.
 *
 * THE VALUES SCORE — settled shape, per franchise, NOT per member:
 *   one collective attestation per period, signed by the franchisee through the
 *   token-bound account (the TBA is the attester, and the TBA is the community's
 *   address). It is revocable, and a correction is a NEW attestation for the same
 *   period referencing the old one — the trail is the point. The rubric hash is
 *   recorded with the score, so a historical score is always readable against the
 *   rubric it was actually measured with.
 *
 *   Deliberately NOT per-member. A soulbound per-person "values score" is a
 *   permanent reputation record that follows a wallet, and that needs an appeal
 *   path this system does not have. A collective, period-scoped score is a
 *   statement about a community, makes no claim about an individual, and expires
 *   into history by construction.
 * ========================================================================= */

import { IMMERSION_CHAIN_ID, SPLITS_MAIN, immersionAccount } from './immersion';

/** Where a granted right stands. `on-purchase` is still not `live` until minted. */
export type GrantStatus = 'on-purchase' | 'proposed' | 'not-wired';

export interface CharterRight {
  key: string;
  label: string;
  /** What the holder gets, in one line. */
  grants: string;
  status: GrantStatus;
  /** The blocker, named. Always present when the status is not `on-purchase`. */
  blockedBy?: string;
}

/**
 * The seven things the charter confers. Ordered as the holder meets them: name,
 * then the publication, then the language, then the community record, then the
 * money, then the instruments.
 */
export const CHARTER_RIGHTS: readonly CharterRight[] = [
  {
    key: 'identity',
    label: 'Own a name first',
    grants:
      'An ENS primary name is the precondition, not a deliverable — the charter reads its holder from ENS and nothing else.',
    status: 'on-purchase',
  },
  {
    key: 'container',
    label: 'A token-bound account',
    grants:
      'An ERC-6551 account owned by the NFT. This IS the franchise address: the community, its treasury, and the signer of its attestations.',
    status: 'not-wired',
    blockedBy: 'collection deployed — nothing minted yet, so no token-bound account exists',
  },
  {
    key: 'newsdesk',
    label: 'Run your own news desk',
    grants:
      'A publication surface and the word-publishing rail: your posts, your readers, your bylines.',
    status: 'proposed',
    blockedBy: 'rail chosen (Lens reads live); writes and the per-holder surface are not built',
  },
  {
    key: 'lexicon',
    label: 'Own your lexicon',
    grants:
      'A namespaced vocabulary you steward: define, canonicalise and deprecate your own terms, publicly and with provenance.',
    status: 'proposed',
    blockedBy: 'no lexicon store; the NewsDesk KG has no per-holder namespace yet',
  },
  {
    key: 'values',
    label: 'Score your community, per period',
    grants:
      'One collective, period-scoped attestation per period, signed by the franchisee through the TBA. Revocable; corrections supersede.',
    status: 'not-wired',
    blockedBy: 'Presence schema registered; writes need a relayer (signed-intent-only for v0)',
  },
  {
    key: 'revenue',
    label: 'Keep the money path',
    grants:
      'Subscription and collect revenue distributed through a split the holder controls.',
    status: 'not-wired',
    blockedBy: 'SplitMain verified on three chains; no split created and no recipient wired',
  },
  {
    key: 'instruments',
    label: 'Create your own instruments',
    grants:
      'Usage and meta markets are created under the franchise address as part of the purchase — creation is in scope, not a separate sale.',
    status: 'not-wired',
    blockedBy:
      'needs a deployed factory; and prediction markets on usage carry event-contract/securities exposure that is a legal gate, not an engineering one',
  },
] as const;

/* ── the values score, as a spec ─────────────────────────────────────────── */

export interface ValuesScoreSpec {
  /** Signed by the franchisee through the TBA — never a member, never the desk. */
  attester: 'token-bound-account';
  /** One attestation covers a whole community for one period. */
  subject: 'community';
  periodDays: number;
  revocable: boolean;
  /** A correction is a new attestation pointing at the old one. */
  supersession: 'refUID';
  /** The rubric is recorded by hash, so an old score stays interpretable. */
  rubric: 'hash-recorded';
  schemaKey: string;
  schema: string;
  chainId: number;
  registered: false;
  note: string;
}

export const VALUES_SCORE: ValuesScoreSpec = {
  attester: 'token-bound-account',
  subject: 'community',
  periodDays: 30,
  revocable: true,
  supersession: 'refUID',
  rubric: 'hash-recorded',
  schemaKey: 'CommunityValuesScore',
  schema:
    'address community, uint64 periodStart, uint64 periodEnd, bytes32 rubricHash, uint16 scoreBps, string evidenceCid, string rubricUri',
  chainId: 84532,
  registered: false,
  note: 'PROPOSED — NOT ENFORCED. Supercompute-local, not a canon Presence schema. A collective statement about a community; it names no individual.',
};

/* ── custody of the data, not the data model ─────────────────────────────── */

/**
 * Four knowledge graphs, one viewer. The differentiator across them is who holds
 * the data — which is also who is allowed to define the words in it.
 */
export interface CustodyMode {
  id: string;
  graph: string;
  custody: string;
  distribution: string;
  /** Can this custodian coin the vocabulary, or only read it? */
  lexicon: string;
  status: 'live' | 'design' | 'new';
}

export const CUSTODY_MODES: readonly CustodyMode[] = [
  {
    id: 'newsdesk-kg',
    graph: 'NewsDesk KG',
    custody: 'SUPERCOMPUTE-owned',
    distribution: 'published, public read',
    lexicon: 'company stewardship — the house words',
    status: 'live',
  },
  {
    id: 'projectdesk-kg',
    graph: 'ProjectDesk KG',
    custody: 'SUPERCOMPUTE-owned',
    distribution: 'pitched, stakeholder-gated',
    lexicon: 'company stewardship, per engagement',
    status: 'live',
  },
  {
    id: 'sgraph-uep',
    graph: 'sGraph UEP',
    custody: 'user-owned, encrypted',
    distribution: 'queried on the user\u2019s behalf',
    lexicon: 'private — the user\u2019s own words',
    status: 'live',
  },
  {
    id: 'franchise-lexicon',
    graph: 'Franchise lexicon',
    custody: 'holder-owned via the TBA',
    distribution: 'published under the holder\u2019s namespace',
    lexicon: 'the franchisee stewards it — this is the new mode',
    status: 'new',
  },
] as const;

/* ── the charter ─────────────────────────────────────────────────────────── */

export type CharterState = 'unissued' | 'issued';

export interface Charter {
  state: CharterState;
  /** ENS is the precondition, so a charter without one cannot exist. */
  holderEns: string | null;
  /** The franchise address — derived from the deployed collection; no token exists until minted. */
  franchise: `0x${string}` | null;
  chainId: number;
  /** Namespaced vocabulary the holder stewards. */
  lexiconNamespace: string | null;
  rights: readonly CharterRight[];
  values: ValuesScoreSpec;
  revenue: {
    splitMain: string;
    /** Terms are a proposal until a split exists. */
    terms: readonly { label: string; bps: number }[];
    created: false;
  };
  instruments: readonly { key: string; label: string; note: string }[];
  minted: false;
}

/** The default distribution shape a new franchise starts from. */
export const DEFAULT_FRANCHISE_TERMS = [
  { label: 'Writing pool', bps: 7000 },
  { label: 'Desk and hosting', bps: 2000 },
  { label: 'Supercompute', bps: 1000 },
] as const;

export const FRANCHISE_INSTRUMENTS = [
  {
    key: 'usage',
    label: 'Usage market',
    note: 'Trades on the franchise\u2019s own activity. Creation in scope of the purchase.',
  },
  {
    key: 'meta',
    label: 'Meta market',
    note: 'Trades on the franchise\u2019s health relative to the network.',
  },
  {
    key: 'prediction',
    label: 'Prediction market',
    note: 'Event contracts. Legal exposure before engineering — sequenced last on purpose.',
  },
] as const;

/**
 * Build the charter a holder would receive. Nothing about this mints anything:
 * the franchise address is derived from the deployed collection, and the type
 * says `minted: false` so no surface can render it as an issued instrument.
 */
export function buildCharter(params: {
  holderEns: string | null;
  tokenContract?: string;
  tokenId?: bigint;
  chainId?: number;
}): Charter {
  const chainId = params.chainId ?? IMMERSION_CHAIN_ID;
  const tokenContract = params.tokenContract;
  const parsed =
    tokenContract && /^0x[0-9a-fA-F]{40}$/.test(tokenContract)
      ? (tokenContract as `0x${string}`)
      : null;

  let franchise: `0x${string}` | null = null;
  if (parsed) {
    try {
      franchise = immersionAccount(parsed, params.tokenId ?? 1n, chainId);
    } catch {
      franchise = null;
    }
  }

  const handle = params.holderEns?.replace(/\.eth$/i, '') ?? null;

  return {
    state: franchise ? 'issued' : 'unissued',
    holderEns: params.holderEns,
    franchise,
    chainId,
    lexiconNamespace: handle ? `${handle}.lexicon` : null,
    rights: CHARTER_RIGHTS,
    values: VALUES_SCORE,
    revenue: {
      splitMain: SPLITS_MAIN,
      terms: DEFAULT_FRANCHISE_TERMS,
      created: false,
    },
    instruments: FRANCHISE_INSTRUMENTS,
    minted: false,
  };
}

/** Honest one-liner for the state of a charter, used wherever it is shown. */
export function charterSummary(c: Charter): string {
  if (c.state === 'unissued') {
    return c.holderEns
      ? 'Unissued — nothing minted, so no franchise address exists.'
      : 'Unissued — a charter needs an ENS name first.';
  }
  return 'Derived — the account is computable, but nothing is minted.';
}
