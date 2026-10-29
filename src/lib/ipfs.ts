/* ============================================================================
 * IPFS pinning
 * ----------------------------------------------------------------------------
 * Used by both Presence metadata and NewsDesk dispatch bodies. No credentials
 * are baked in: if VITE_IPFS_PIN_ENDPOINT is unset the pin is honestly reported
 * as `pinned: false` and an ephemeral data: URI is returned instead, so the UI
 * can show "NOT PINNED — configure a pinner" rather than pretending.
 * ========================================================================= */

export interface PinResult {
  pinned: boolean;
  /** ipfs:// URI when pinned; data: URI when not. */
  uri: string;
  cid?: string;
  provider?: string;
  /** Why it was not pinned (present only when pinned === false). */
  reason?: string;
}

function endpoint(): string | undefined {
  return import.meta.env.VITE_IPFS_PIN_ENDPOINT;
}

function token(): string | undefined {
  return import.meta.env.VITE_IPFS_PIN_TOKEN;
}

/** Offline fallback: a self-contained, un-pinned data URI. */
function dataUri(value: unknown): string {
  const json = JSON.stringify(value);
  // btoa is latin1-only; encode UTF-8 first.
  const b64 = btoa(
    Array.from(new TextEncoder().encode(json))
      .map((b) => String.fromCharCode(b))
      .join(''),
  );
  return `data:application/json;base64,${b64}`;
}

function extractCid(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const o = body as Record<string, unknown>;
  const candidates = [o.IpfsHash, o.cid, o.Hash, o.value];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return undefined;
}

export interface PinOptions {
  /** Filename hint sent to Pinata-style endpoints. */
  name?: string;
}

/**
 * Pin a JSON document. Supports Pinata (`pinJSONToIPFS`) and generic
 * web3.storage / kubo HTTP-pin endpoints that accept a raw JSON body.
 */
export async function pinJson(
  value: unknown,
  opts: PinOptions = {},
): Promise<PinResult> {
  const url = endpoint();
  if (!url) {
    return {
      pinned: false,
      uri: dataUri(value),
      reason: 'No IPFS pinning endpoint configured (VITE_IPFS_PIN_ENDPOINT unset).',
    };
  }

  const isPinata = url.includes('pinata.cloud');
  const payload = isPinata
    ? {
        pinataContent: value,
        pinataMetadata: { name: opts.name ?? 'supercompute-webos' },
      }
    : value;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token() ? { authorization: `Bearer ${token()}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        pinned: false,
        uri: dataUri(value),
        reason: `pin endpoint ${res.status}: ${JSON.stringify(body)}`,
      };
    }
    const cid = extractCid(body);
    if (!cid) {
      return {
        pinned: false,
        uri: dataUri(value),
        reason: `pin endpoint returned no CID: ${JSON.stringify(body)}`,
      };
    }
    return {
      pinned: true,
      cid,
      uri: `ipfs://${cid}`,
      provider: isPinata ? 'pinata' : new URL(url).host,
    };
  } catch (err) {
    return {
      pinned: false,
      uri: dataUri(value),
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Gateway URL for an ipfs:// URI (defaults to ipfs.io). */
export function toGateway(uri: string, gateway = 'https://ipfs.io/ipfs/'): string {
  return uri.startsWith('ipfs://') ? gateway + uri.slice(7) : uri;
}
