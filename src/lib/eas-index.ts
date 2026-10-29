/* ============================================================================
 * EAS read layer — attestations the holder actually owns
 * ----------------------------------------------------------------------------
 * Writes live in lib/eas.ts (schema UIDs, canon payload encoding, the EAS and
 * SchemaRegistry ABIs). This module is the READ side: what attestations exist
 * against an address, and whether a schema is registered yet.
 *
 * Two different sources, and the difference matters enough to say out loud:
 *
 *   • `eth_call` against the EAS contract (lib/eas.ts ABIs) reads the CHAIN.
 *     It answers one attestation at a time, by UID — which you can only ask for
 *     if you already know the UID.
 *   • The EAS indexer GraphQL endpoint answers "everything for this address",
 *     but it is a THIRD-PARTY INDEX of the chain, not the chain. It can lag or
 *     be down entirely. Every read here returns the endpoint it used so the UI
 *     can attribute the number instead of presenting it as chain state.
 *
 * Endpoints verified live (2026-10-01) with `attestations` / `aggregateAttestation`
 * / `schemata` queries before this file was written. EAS indexers run the same
 * schema everywhere, so the query shape is shared across chains.
 *
 * FAIL CLOSED: a chain with no configured indexer is reported as `no-indexer`,
 * never silently treated as "zero attestations". Zero and unknown are different
 * answers and the passport must not confuse them — an absent count reads as a
 * clean record.
 * ========================================================================= */

import { base, baseSepolia, mainnet } from 'wagmi/chains';

/** EAS indexer per chain. Keyed by chainId; a missing entry is reported, not guessed. */
export const EAS_INDEXER: Readonly<Record<number, string>> = {
  [mainnet.id]: 'https://easscan.org/graphql',
  [base.id]: 'https://base.easscan.org/graphql',
  [baseSepolia.id]: 'https://base-sepolia.easscan.org/graphql',
};

export interface DecodedField {
  name: string;
  type: string;
  value: string;
}

export interface IndexedAttestation {
  uid: `0x${string}`;
  schemaId: `0x${string}`;
  /** Name of the schema the attestation was made under, when the index returns it. */
  schemaName?: string;
  attester: string;
  recipient: string;
  /** Unix seconds. */
  time: number;
  revoked: boolean;
  refUID: string;
  /** Decoded payload fields, normalised to display strings. */
  fields: DecodedField[];
}

/** Discriminated so a caller cannot read `data` without checking `status`. */
export type EasRead<T> =
  | { status: 'ok'; data: T; endpoint: string; indexer: true }
  | { status: 'no-indexer'; reason: string }
  | { status: 'no-subject'; reason: string }
  | { status: 'error'; reason: string; endpoint: string };

export function indexerFor(chainId: number): string | undefined {
  return EAS_INDEXER[chainId];
}

/* ── value normalisation ──────────────────────────────────────────────────── */

/**
 * The indexer returns `decodedDataJson` as a JSON string of EAS field objects.
 * Scalars arrive raw; tuples arrive wrapped as `{ name, type, value }`. Both
 * shapes appear in the same array, so a tuple-shaped value is unwrapped rather
 * than stringified into something unreadable.
 */
function normaliseValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  if (Array.isArray(v)) return v.map(normaliseValue).join(', ');
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if ('value' in o) return normaliseValue(o.value);
    try {
      return JSON.stringify(o);
    } catch {
      return '[unreadable]';
    }
  }
  return String(v);
}

function parseDecoded(raw: unknown): DecodedField[] {
  if (typeof raw !== 'string' || raw.length === 0) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.map((entry) => {
      const e = entry as Record<string, unknown>;
      return {
        name: typeof e.name === 'string' ? e.name : 'field',
        type: typeof e.type === 'string' ? e.type : '',
        value: normaliseValue(e.value),
      };
    });
  } catch {
    return [];
  }
}

/* ── transport ────────────────────────────────────────────────────────────── */

const TIMEOUT_MS = 12_000;

async function gql<T>(
  endpoint: string,
  query: string,
): Promise<{ data?: T; error?: string }> {
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    return {
      error: e instanceof Error && e.name === 'TimeoutError'
        ? `indexer timed out after ${TIMEOUT_MS / 1000}s`
        : `indexer unreachable (${e instanceof Error ? e.message : 'network error'})`,
    };
  }
  if (!res.ok) return { error: `indexer returned HTTP ${res.status}` };
  let body: { data?: T; errors?: { message: string }[] };
  try {
    body = (await res.json()) as typeof body;
  } catch {
    return { error: 'indexer returned a non-JSON body' };
  }
  // GraphQL reports a rejected query in `errors` with HTTP 200, so a response
  // that merely parses is not a successful read.
  if (body.errors?.length) return { error: body.errors[0].message };
  if (!body.data) return { error: 'indexer returned no data' };
  return { data: body.data };
}

function q(s: string): string {
  return JSON.stringify(s);
}

/* ── reads ────────────────────────────────────────────────────────────────── */

interface RawAttestation {
  id: string;
  schemaId: string;
  attester: string;
  recipient: string;
  time: number;
  revoked: boolean;
  refUID: string;
  decodedDataJson: string | null;
  schema?: { schema: string } | null;
}

/**
 * Attestations made OUT TO an address — the holder's stamps.
 *
 * `schemaId` narrows to one schema (e.g. the PresenceEvent UID). It is applied
 * server-side, so an unregistered schema returns an empty set rather than
 * every attestation the address has ever received.
 */
export async function fetchAttestationsReceived(
  chainId: number,
  recipient: string,
  opts: { schemaId?: string; take?: number } = {},
): Promise<EasRead<IndexedAttestation[]>> {
  const endpoint = indexerFor(chainId);
  if (!endpoint) {
    return {
      status: 'no-indexer',
      reason: `no EAS indexer configured for chain ${chainId}`,
    };
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(recipient)) {
    return { status: 'no-subject', reason: 'no valid address to read against' };
  }

  const take = opts.take ?? 12;
  const where = [
    `recipient: { equals: ${q(recipient)} }`,
    opts.schemaId ? `schemaId: { equals: ${q(opts.schemaId)} }` : null,
  ]
    .filter(Boolean)
    .join(', ');

  const { data, error } = await gql<{ attestations: RawAttestation[] }>(
    endpoint,
    `{
      attestations(where: { ${where} }, take: ${take}, orderBy: [{ time: desc }]) {
        id schemaId attester recipient time revoked refUID decodedDataJson
        schema { schema }
      }
    }`,
  );
  if (error) return { status: 'error', reason: error, endpoint };

  return {
    status: 'ok',
    endpoint,
    indexer: true,
    data: (data?.attestations ?? []).map((a) => ({
      uid: a.id as `0x${string}`,
      schemaId: a.schemaId as `0x${string}`,
      schemaName: a.schema?.schema,
      attester: a.attester,
      recipient: a.recipient,
      time: a.time,
      revoked: a.revoked,
      refUID: a.refUID,
      fields: parseDecoded(a.decodedDataJson),
    })),
  };
}

/**
 * How many attestations an address holds — counted by the indexer, not by
 * fetching and measuring. `_count._all` is exact and cheap, so the passport can
 * say "0" with confidence rather than "0 shown, more may exist".
 */
export async function fetchAttestationCount(
  chainId: number,
  recipient: string,
  opts: { schemaId?: string } = {},
): Promise<EasRead<number>> {
  const endpoint = indexerFor(chainId);
  if (!endpoint) {
    return {
      status: 'no-indexer',
      reason: `no EAS indexer configured for chain ${chainId}`,
    };
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(recipient)) {
    return { status: 'no-subject', reason: 'no valid address to count against' };
  }
  const where = [
    `recipient: { equals: ${q(recipient)} }`,
    opts.schemaId ? `schemaId: { equals: ${q(opts.schemaId)} }` : null,
  ]
    .filter(Boolean)
    .join(', ');

  const { data, error } = await gql<{
    aggregateAttestation: { _count: { _all: number } } | null;
  }>(endpoint, `{ aggregateAttestation(where: { ${where} }) { _count { _all } } }`);
  if (error) return { status: 'error', reason: error, endpoint };
  return {
    status: 'ok',
    endpoint,
    indexer: true,
    data: data?.aggregateAttestation?._count?._all ?? 0,
  };
}

export interface RegisteredSchema {
  uid: `0x${string}`;
  schema: string;
  revocable: boolean;
  resolver: string;
}

/**
 * Whether a computed schema UID is actually registered.
 *
 * This is the check that keeps the Presence pipeline honest: `proposedSchemaUID`
 * in lib/eas.ts returns a well-formed UID for any schema string whether or not
 * anyone ever registered it. Asking the indexer is what turns "we will register
 * this in Phase A5" into a fact either way.
 */
export async function fetchSchemaRegistration(
  chainId: number,
  uid: string,
): Promise<EasRead<RegisteredSchema | null>> {
  const endpoint = indexerFor(chainId);
  if (!endpoint) {
    return {
      status: 'no-indexer',
      reason: `no EAS indexer configured for chain ${chainId}`,
    };
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(uid)) {
    return { status: 'no-subject', reason: 'not a 32-byte schema UID' };
  }
  const { data, error } = await gql<{
    schemata: { id: string; schema: string; revocable: boolean; resolver: string }[];
  }>(
    endpoint,
    `{ schemata(where: { id: { equals: ${q(uid)} } }) { id schema revocable resolver } }`,
  );
  if (error) return { status: 'error', reason: error, endpoint };
  const found = data?.schemata?.[0] ?? null;
  return {
    status: 'ok',
    endpoint,
    indexer: true,
    data: found
      ? {
          uid: found.id as `0x${string}`,
          schema: found.schema,
          revocable: found.revocable,
          resolver: found.resolver,
        }
      : null,
  };
}

/* ── display helpers ──────────────────────────────────────────────────────── */

export function unixToDate(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

export function shortUid(uid: string, head = 10, tail = 6): string {
  if (!uid || uid.length <= head + tail + 2) return uid;
  return `${uid.slice(0, head)}…${uid.slice(-tail)}`;
}

/**
 * ICAO 9303 check digit (7-3-1 weighting, '<' = 0, A-Z = 10-35).
 * Used for the passport's machine zone so the check character is computed from
 * the document number rather than typed in as decoration.
 */
export function icaoCheckDigit(input: string): string {
  const weights = [7, 3, 1];
  let sum = 0;
  let i = 0;
  for (const raw of input.toUpperCase()) {
    let v: number;
    if (raw >= '0' && raw <= '9') v = raw.charCodeAt(0) - 48;
    else if (raw >= 'A' && raw <= 'Z') v = raw.charCodeAt(0) - 55;
    else v = 0;
    sum += v * weights[i % 3];
    i += 1;
  }
  return String(sum % 10);
}

/** Machine-zone filler: anything outside A-Z0-9 becomes '<'. */
export function mrzChars(input: string, length: number): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '<')
    .slice(0, length)
    .padEnd(length, '<');
}
