/* ============================================================================
 * Lens read adapter — the publishing rail
 * ----------------------------------------------------------------------------
 * NEWS_DESK's blog/graph half reads from Lens. This module is the READ side and
 * the only place that knows Lens' wire format.
 *
 * EVERYTHING BELOW WAS VERIFIED AGAINST THE LIVE API before it was written —
 * schema introspected, then the exact query in this file executed (see the
 * commit that added it). Findings that change the obvious plan:
 *
 *   1. The data model says `posts`, NOT `publications`. Querying `publications`
 *      fails: "Unknown field publications on type Query". The concept is a post.
 *   2. `AnyPost` is a union of exactly `Post | Repost`, and `Post` has no
 *      `upvotes`/`downvotes`. Its real counters are:
 *          comments · reposts · quotes · collects · tips · reactions · bookmarks
 *   3. `pageSize` is an ENUM with exactly two members: TEN, FIFTY. Not an Int.
 *   4. `metadata` is a 16-member union (ArticleMetadata, TextOnlyMetadata,
 *      ImageMetadata, VideoMetadata, AudioMetadata, LivestreamMetadata, …).
 *      A union member must be selected with an inline fragment or it comes back
 *      as `{}` — which is why a naive post query "succeeds" with no content.
 *   5. The global feed is mostly not articles: of the first page of 10, ZERO had
 *      ArticleMetadata. A blog desk must filter by mainContentFocus / author, not
 *      read the firehose.
 *
 * SDK WARNING (this is why there is no SDK dependency here):
 *   `@lens-protocol/react@2.3.2` — the only stable `latest` — is the PREVIOUS
 *   generation. Its peers are `react ^18` and it pulls `@ethersproject/*` (v5)
 *   and Apollo, against this repo's React 19 + viem + wagmi 3. Installing it
 *   downgrades React. `@lens-chain/sdk@1.0.3` is the current one but needs
 *   `ethers ^6` + `zksync-ethers` as peers. The GraphQL read path below needs
 *   NO new dependency and works unchanged on React 19, so reads use it.
 *
 * SELF-CUSTODY NOTE: reads are public and need no auth. WRITES (posting,
 * collecting, splitting) are a separate, signing concern and are NOT here.
 * ========================================================================= */

/** Verified live: POST { __typename } -> 200. Public reads need no auth. */
export const LENS_API = 'https://api.lens.xyz/graphql';

/** The only two members of the PageSize enum. Verified by introspection. */
export type PageSize = 'TEN' | 'FIFTY';

export interface LensAuthor {
  address: string;
  /** `localName` is the handle; `value` is the fully-qualified `lens/handle`. */
  handle: string | null;
  handleFull: string | null;
}

export interface LensStats {
  comments: number;
  reposts: number;
  quotes: number;
  collects: number;
  tips: number;
  reactions: number;
  bookmarks: number;
}

/** The content shapes a post can carry. Only the ones we render are unwrapped. */
export interface LensPost {
  /** 77-digit id — a string, never a number. */
  id: string;
  slug: string;
  /** ISO timestamp as the API returns it. */
  timestamp: string;
  /** `lens://<hash>` — content-addressed, resolved through the Lens API. */
  contentUri: string;
  author: LensAuthor;
  /** Present only when metadata resolved to a known union member. */
  title: string | null;
  body: string | null;
  tags: string[];
  /** The metadata union member we matched, or 'unresolved'. */
  kind: string;
  stats: LensStats;
}

export type LensRead<T> =
  | { status: 'ok'; data: T; endpoint: string }
  | { status: 'error'; reason: string; endpoint: string };

/* ── the query (this exact string is the one that was executed) ───────────── */

const POSTS_QUERY = `
  query Posts($pageSize: PageSize!) {
    posts(request: { pageSize: $pageSize }) {
      items {
        ... on Post {
          id slug timestamp contentUri
          author { address username { localName value } }
          metadata {
            ... on ArticleMetadata { title content tags }
            ... on TextOnlyMetadata { content tags }
          }
          stats { comments reposts quotes collects tips reactions bookmarks }
        }
      }
    }
  }
`;

/** The namespace read — a franchise's own posts, filtered by author EVM
 *  address. Verified against the live API: `filter.authors` is
 *  `[EvmAddress!]` (addresses, NOT handles). This is what "the namespace's
 *  Verbs" means for LEX — the words a franchise actually published, not the
 *  global firehose. */
const AUTHOR_POSTS_QUERY = `
  query AuthorPosts($author: EvmAddress!, $pageSize: PageSize!) {
    posts(request: { pageSize: $pageSize, filter: { authors: [$author] } }) {
      items {
        ... on Post {
          id slug timestamp contentUri
          author { address username { localName value } }
          metadata {
            ... on ArticleMetadata { title content tags }
            ... on TextOnlyMetadata { content tags }
          }
          stats { comments reposts quotes collects tips reactions bookmarks }
        }
      }
    }
  }
`;

/* ── transport ───────────────────────────────────────────────────────────── */

const TIMEOUT_MS = 12_000;

async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<{ data?: T; error?: string }> {
  let res: Response;
  try {
    res = await fetch(LENS_API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    return {
      error:
        e instanceof Error && e.name === 'TimeoutError'
          ? `Lens API timed out after ${TIMEOUT_MS / 1000}s`
          : `Lens API unreachable (${e instanceof Error ? e.message : 'network error'})`,
    };
  }
  if (!res.ok) return { error: `Lens API returned HTTP ${res.status}` };
  let body: { data?: T; errors?: { message: string }[] };
  try {
    body = (await res.json()) as typeof body;
  } catch {
    return { error: 'Lens API returned a non-JSON body' };
  }
  // GraphQL reports a rejected query as errors with HTTP 200, so a parseable
  // response is not a successful read.
  if (body.errors?.length) return { error: body.errors[0].message };
  if (!body.data) return { error: 'Lens API returned no data' };
  return { data: body.data };
}

/* ── normalisation ───────────────────────────────────────────────────────── */

interface RawPost {
  id: string;
  slug: string;
  timestamp: string;
  contentUri: string;
  author?: { address: string; username?: { localName?: string; value?: string } | null };
  metadata?: { title?: string; content?: string; tags?: string[] };
  stats?: Partial<LensStats>;
}

function normalisePost(raw: RawPost): LensPost {
  const meta = raw.metadata ?? {};
  // An unmatched union member arrives as {}. Say so rather than rendering blank.
  const kind = meta.title
    ? 'ArticleMetadata'
    : meta.content
      ? 'TextOnlyMetadata'
      : 'unresolved';
  return {
    id: raw.id,
    slug: raw.slug,
    timestamp: raw.timestamp,
    contentUri: raw.contentUri,
    author: {
      address: raw.author?.address ?? '',
      handle: raw.author?.username?.localName ?? null,
      handleFull: raw.author?.username?.value ?? null,
    },
    title: meta.title ?? null,
    body: meta.content ?? null,
    tags: meta.tags ?? [],
    kind,
    stats: {
      comments: raw.stats?.comments ?? 0,
      reposts: raw.stats?.reposts ?? 0,
      quotes: raw.stats?.quotes ?? 0,
      collects: raw.stats?.collects ?? 0,
      tips: raw.stats?.tips ?? 0,
      reactions: raw.stats?.reactions ?? 0,
      bookmarks: raw.stats?.bookmarks ?? 0,
    },
  };
}

/**
 * The latest posts. This is the GLOBAL firehose — on the first page measured,
 * none of the ten were articles. A blog surface must narrow it (by author or
 * mainContentFocus) before it can call itself a publication feed.
 */
export async function fetchLatestPosts(
  pageSize: PageSize = 'TEN',
): Promise<LensRead<LensPost[]>> {
  const { data, error } = await gql<{ posts: { items: RawPost[] } }>(POSTS_QUERY, {
    pageSize,
  });
  if (error) return { status: 'error', reason: error, endpoint: LENS_API };
  const items = data?.posts?.items ?? [];
  return { status: 'ok', data: items.map(normalisePost), endpoint: LENS_API };
}

/**
 * The namespace read — a franchise's own posts by author EVM address. This is
 * what LEX calls "the namespace's Verbs": the words a franchise has actually
 * published on the rail. The global firehose (`fetchLatestPosts`) is not a
 * namespace; this is.
 */
export async function fetchAuthorPosts(
  author: string,
  pageSize: PageSize = 'FIFTY',
): Promise<LensRead<LensPost[]>> {
  const { data, error } = await gql<{ posts: { items: RawPost[] } }>(
    AUTHOR_POSTS_QUERY,
    { author, pageSize },
  );
  if (error) return { status: 'error', reason: error, endpoint: LENS_API };
  const items = data?.posts?.items ?? [];
  return { status: 'ok', data: items.map(normalisePost), endpoint: LENS_API };
}

/* ── what Lens does and does not provide ─────────────────────────────────── */

/**
 * Capability map, so no screen has to guess and no docstring can imply more
 * than exists. `verified` means it was checked in the API schema or Lens' own
 * docs during this work; `note` carries the limit that matters.
 */
export const LENS_CAPABILITIES = [
  {
    cap: 'Posting (blog, comment, quote, repost)',
    lens: true,
    verified: true,
    note: 'A post is the primitive. There is no "publication" object.',
  },
  {
    cap: 'Content-addressed bodies',
    lens: true,
    verified: true,
    note: 'contentUri is lens://<hash>; metadata is a 16-member union.',
  },
  {
    cap: 'Engagement counters',
    lens: true,
    verified: true,
    note: 'comments · reposts · quotes · collects · tips · reactions · bookmarks.',
  },
  {
    cap: 'Per-post collect fee split',
    lens: true,
    verified: true,
    note: 'Multi-recipient collect module: a FLAT split across at most FIVE recipients, in basis points (10000). Not a split graph.',
  },
  {
    cap: 'Arbitrary / nested revenue splits',
    lens: false,
    verified: true,
    note: 'Beyond five flat BPS recipients this needs 0xSplits. The clean pattern: make the split contract ONE of the collect recipients.',
  },
  {
    cap: 'Feeds with rules (payment / follow gating)',
    lens: true,
    verified: true,
    note: 'Feed Rules and Follow Rules exist; a payment rule takes a native or erc20 amount plus a recipient.',
  },
  {
    cap: 'SEO surface',
    lens: false,
    verified: true,
    note: 'No search-console data. Ranking is measured outside Lens; this desk only reports what it can read.',
  },
  {
    cap: 'A React SDK we can install today',
    lens: false,
    verified: true,
    note: '@lens-protocol/react@2.3.2 peers react ^18 + ethers v5 (would downgrade React 19). Reads use GraphQL instead.',
  },
] as const;

/* ── fixtures (mock mode) ────────────────────────────────────────────────── */

/**
 * Used when the API is unreachable, or when a desk is being designed before an
 * account exists. Marked `specimen` wherever it is rendered — never passed off
 * as live.
 */
export const SAMPLE_POSTS: LensPost[] = [
  {
    id: '0x1',
    slug: 'what-the-desk-is',
    timestamp: '2026-09-28T09:00:00+00:00',
    contentUri: 'lens://1a2b3c',
    author: { address: '0x0000000000000000000000000000000000000001', handle: 'supercompute', handleFull: 'lens/supercompute' },
    title: 'What the desk is',
    body: 'Operators, keys, and the one screen that holds them.',
    tags: ['supercompute', 'operations'],
    kind: 'ArticleMetadata',
    stats: { comments: 4, reposts: 12, quotes: 1, collects: 31, tips: 0, reactions: 58, bookmarks: 9 },
  },
  {
    id: '0x2',
    slug: 'settlement-in-stable-value',
    timestamp: '2026-09-19T14:20:00+00:00',
    contentUri: 'lens://4d5e6f',
    author: { address: '0x0000000000000000000000000000000000000001', handle: 'supercompute', handleFull: 'lens/supercompute' },
    title: 'Settlement in stable value',
    body: 'Why the subscription lands in stable value before the split is applied.',
    tags: ['treasury', 'splits'],
    kind: 'ArticleMetadata',
    stats: { comments: 7, reposts: 21, quotes: 3, collects: 64, tips: 2, reactions: 96, bookmarks: 18 },
  },
  {
    id: '0x3',
    slug: 'why-the-school-comes-first',
    timestamp: '2026-09-11T11:05:00+00:00',
    contentUri: 'lens://7g8h9i',
    author: { address: '0x0000000000000000000000000000000000000001', handle: 'supercompute', handleFull: 'lens/supercompute' },
    title: 'Why the school comes first',
    body: 'The compounding loop: teach the rails, issue the credential, open the guild.',
    tags: ['school', 'presence'],
    kind: 'ArticleMetadata',
    stats: { comments: 2, reposts: 8, quotes: 0, collects: 19, tips: 0, reactions: 41, bookmarks: 6 },
  },
];
