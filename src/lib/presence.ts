/* ============================================================================
 * PRESENCE — gasless proof-of-attendance / proof-of-experience
 * ----------------------------------------------------------------------------
 * PORTED FROM CANON. The authoritative source is the private monorepo
 * `SupercomputeA/presence` (MIT). Its real, implemented artifacts are:
 *
 *   packages/contracts/schemas.json                ← the EAS schema strings
 *   packages/contracts/src/PresenceResolver.sol    ← on-chain postures
 *   apps/web/lib/contracts.ts                      ← chain facts
 *   apps/web/lib/eip712.ts                         ← EIP-712 shape
 *   apps/web/lib/mock-chain.ts                     ← rotation + gate semantics
 *
 * Everything below is a faithful port of those. Where canon has no answer yet,
 * this file says so instead of inventing one.
 *
 * THE SDK (checked against the repo, not assumed):
 *   packages/sdk/package.json declares name "@prsn/sdk", version 0.0.1,
 *   `"private": true`, main "dist/index.js" — but the package contains ONLY
 *   README.md ("*Placeholder — filled in Phase A2.*") and package.json. No
 *   source, no dist/, private, and `npm view @prsn/sdk` → 404. @prsn/core is
 *   the same (placeholder, Phase A3).
 *
 *   So the brief's "import @prsn/sdk" cannot be satisfied today — not because
 *   the package is imaginary, but because it is a declared-but-unimplemented
 *   private stub. This module implements the A2 signing surface ahead of it,
 *   shaped so that when @prsn/sdk ships this file becomes a thin re-export and
 *   no calling component changes.
 * ========================================================================= */

import {
  concat,
  encodeAbiParameters,
  hashTypedData,
  keccak256,
  numberToHex,
  parseAbiParameters,
  toHex,
  type Address,
  type Hex,
  type WalletClient,
} from 'viem';
import { PRESENCE_CHAIN } from './presence-chain';

/* ── Canon constants ──────────────────────────────────────────────────────── */

/** Rotating-QR window length. Canon: 15s — short so rotation is visible. */
export const ROTATION_MS = 15_000;

/** A claim is accepted from the current window or the immediately-previous one. */
export const GRACE_WINDOWS = 1;

/**
 * Canon EAS EIP-712 domain. The name is the generic "EAS" and the version is
 * the canonical EAS contract version — NOT a bespoke "Supercompute Presence"
 * domain — and there is deliberately NO verifyingContract (the domain is the
 * EAS EIP-712 proxy shape, not the resolver).
 */
export const EAS_DOMAIN = {
  name: 'EAS',
  version: '1.4.0',
  chainId: PRESENCE_CHAIN.chainId,
} as const;

/**
 * Canon EIP-712 primary type. Gasless claiming = the organiser signs an EAS
 * `Attest` payload off-chain; a relayer submits it later.
 */
export const EAS_ATTEST_TYPES = {
  Attest: [
    { name: 'schema', type: 'bytes32' },
    { name: 'recipient', type: 'address' },
    { name: 'expirationTime', type: 'uint64' },
    { name: 'revocable', type: 'bool' },
    { name: 'refUID', type: 'bytes32' },
    { name: 'data', type: 'bytes' },
    { name: 'value', type: 'uint256' },
  ],
} as const;

export interface AttestMessage {
  schema: Hex;
  recipient: Address;
  expirationTime: bigint;
  revocable: boolean;
  refUID: Hex;
  data: Hex;
  value: bigint;
}

export interface AttestTypedData {
  domain: typeof EAS_DOMAIN;
  types: typeof EAS_ATTEST_TYPES;
  primaryType: 'Attest';
  message: AttestMessage;
}

export function attestTypedData(message: AttestMessage): AttestTypedData {
  return {
    domain: EAS_DOMAIN,
    types: EAS_ATTEST_TYPES,
    primaryType: 'Attest',
    message,
  };
}

/** Real EIP-712 digest of an `Attest` payload. */
export function attestDigest(message: AttestMessage): Hex {
  return hashTypedData(attestTypedData(message));
}

/* ── Rotation hash-chain (canon) ──────────────────────────────────────────── */

export function randomBytes32(): Hex {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return toHex(bytes);
}

/**
 * Canon secret derivation. Window 0's secret IS the root secret; every later
 * window is `keccak256(rootSecret ‖ uint32(index))` — a deterministic chain,
 * not a per-window random, so any window is recomputable from the root.
 */
export function secretForIndex(rootSecret: Hex, index: number): Hex {
  if (index <= 0) return rootSecret;
  return keccak256(concat([rootSecret, numberToHex(index, { size: 4 })]));
}

export interface RotationWindow {
  index: number;
  /** the secret carried by the QR for this window */
  secret: Hex;
  /** keccak256(secret) — the value that goes into the attested payload */
  secretHash: Hex;
  startedAt: number;
}

export function makeWindow(
  rootSecret: Hex,
  index: number,
  startedAt: number,
): RotationWindow {
  const secret = secretForIndex(rootSecret, index);
  return { index, secret, secretHash: keccak256(secret), startedAt };
}

/** Canon bytes32 eventId = keccak256(abi.encode(eventName, location, timestamp)). */
export function deriveEventId(
  eventName: string,
  location: string,
  timestamp: bigint,
): Hex {
  return keccak256(
    encodeAbiParameters(parseAbiParameters('string,string,uint64'), [
      eventName,
      location,
      timestamp,
    ]),
  );
}

/* ── Claim evaluation — canon's ordered gates ─────────────────────────────── */

export type ClaimCode = 'OK' | 'NOT_IN_CHAIN' | 'STALE' | 'ALREADY_ATTENDED';

export interface ClaimVerdict {
  ok: boolean;
  code: ClaimCode;
  reason: string;
  windowIndex: number;
  /** secretHash of the window in force when the claim was accepted */
  secretHash?: Hex;
}

export interface ClaimRecord {
  eventId: Hex;
  recipient: Address;
  secretHash: Hex;
  windowIndex: number;
  at: number;
}

/**
 * Canon `hasAttended(eventId, recipient)` — the soulbound gate: one proof per
 * recipient per event.
 */
export function hasAttended(
  claims: readonly ClaimRecord[],
  eventId: Hex,
  recipient: Address,
): boolean {
  const r = recipient.toLowerCase();
  return claims.some(
    (c) =>
      c.eventId.toLowerCase() === eventId.toLowerCase() &&
      c.recipient.toLowerCase() === r,
  );
}

/**
 * Canon applies its gates in this exact order:
 *   1. the presented secret must belong to this event's rotation hash-chain
 *   2. it must be within the grace window  (else: screenshot replay → stale)
 *   3. hasAttended(eventId, recipient) must be false (else: soulbound block)
 */
export function evaluateClaim(
  windows: readonly RotationWindow[],
  claims: readonly ClaimRecord[],
  eventId: Hex,
  recipient: Address,
  presentedSecret: Hex,
): ClaimVerdict {
  const current = windows[windows.length - 1];
  if (!current) {
    return {
      ok: false,
      code: 'NOT_IN_CHAIN',
      reason: 'REJECTED · no rotation windows exist for this event',
      windowIndex: -1,
    };
  }

  // Gate 1 — a real link in this event's chain
  const matched = windows.find(
    (w) => w.secret.toLowerCase() === presentedSecret.toLowerCase(),
  );
  if (!matched) {
    return {
      ok: false,
      code: 'NOT_IN_CHAIN',
      reason:
        'REJECTED · presented secret is not in this event’s rotation hash-chain',
      windowIndex: current.index,
    };
  }

  // Gate 2 — grace window
  if (current.index - matched.index > GRACE_WINDOWS) {
    return {
      ok: false,
      code: 'STALE',
      reason: `REJECTED · stale rotating secret — window ${matched.index} presented, current window ${current.index} (grace ${GRACE_WINDOWS}). A photographed QR stops working.`,
      windowIndex: current.index,
    };
  }

  // Gate 3 — soulbound
  if (hasAttended(claims, eventId, recipient)) {
    return {
      ok: false,
      code: 'ALREADY_ATTENDED',
      reason:
        'BLOCKED · hasAttended(eventId, recipient) == true — soulbound, one proof per recipient',
      windowIndex: current.index,
    };
  }

  return {
    ok: true,
    code: 'OK',
    reason: `OK · claim accepted in window ${matched.index} (gasless)`,
    windowIndex: matched.index,
    secretHash: matched.secretHash,
  };
}

/* ── Station: the organiser's rotating QR ─────────────────────────────────── */

export interface PresenceEventInput {
  eventName: string;
  location: string;
  timestamp: bigint;
}

export interface PresenceTicket {
  v: 1;
  eventId: Hex;
  eventName: string;
  secret: Hex;
  secretHash: Hex;
  windowIndex: number;
  rotationMs: number;
  graceWindows: number;
  chainId: number;
  resolver: string;
}

export class PresenceStation {
  readonly eventId: Hex;
  readonly eventName: string;
  readonly location: string;
  readonly timestamp: bigint;
  /** event-level secretHash = keccak256(rootSecret) — the "event passport" */
  readonly rootSecret: Hex;
  private windows: RotationWindow[];
  private claims: ClaimRecord[] = [];

  constructor(
    input: PresenceEventInput,
    rootSecret: Hex = randomBytes32(),
    now = Date.now(),
  ) {
    this.eventId = deriveEventId(input.eventName, input.location, input.timestamp);
    this.eventName = input.eventName;
    this.location = input.location;
    this.timestamp = input.timestamp;
    this.rootSecret = rootSecret;
    this.windows = [makeWindow(rootSecret, 0, now)];
  }

  /** Event-level secretHash — the value the PresenceEvent attestation carries. */
  get eventSecretHash(): Hex {
    return keccak256(this.rootSecret);
  }

  get current(): RotationWindow {
    return this.windows[this.windows.length - 1];
  }

  get history(): readonly RotationWindow[] {
    return this.windows;
  }

  get receivedClaims(): readonly ClaimRecord[] {
    return this.claims;
  }

  /**
   * Canon `syncWindows`: rotate forward until the newest window started within
   * ROTATION_MS of `now`. Idempotent — returns false when already current so a
   * React caller can bail out of a re-render.
   */
  sync(now = Date.now()): boolean {
    const last = this.windows[this.windows.length - 1];
    if (now - last.startedAt < ROTATION_MS) return false;
    const steps = Math.floor((now - last.startedAt) / ROTATION_MS);
    for (let i = 0; i < steps; i++) {
      this.windows.push(
        makeWindow(
          this.rootSecret,
          last.index + i + 1,
          last.startedAt + (i + 1) * ROTATION_MS,
        ),
      );
    }
    return true;
  }

  /** ms until the current window expires. */
  msToRotate(now = Date.now()): number {
    return Math.max(0, this.current.startedAt + ROTATION_MS - now);
  }

  /** Canon `claim()`: evaluate the gates, then record on success. */
  claim(
    recipient: Address,
    presentedSecret: Hex,
    now = Date.now(),
  ): ClaimVerdict {
    this.sync(now);
    const verdict = evaluateClaim(
      this.windows,
      this.claims,
      this.eventId,
      recipient,
      presentedSecret,
    );
    if (verdict.ok && verdict.secretHash) {
      this.claims.push({
        eventId: this.eventId,
        recipient,
        secretHash: verdict.secretHash,
        windowIndex: verdict.windowIndex,
        at: now,
      });
    }
    return verdict;
  }

  /** Force a rotation immediately (canon's `$ force rotation now`). */
  forceRotate(now = Date.now()): RotationWindow {
    const last = this.windows[this.windows.length - 1];
    this.windows.push(makeWindow(this.rootSecret, last.index + 1, now));
    return this.current;
  }

  /** The payload carried by the QR for the current window. */
  ticket(): PresenceTicket {
    const w = this.current;
    return {
      v: 1,
      eventId: this.eventId,
      eventName: this.eventName,
      secret: w.secret,
      secretHash: w.secretHash,
      windowIndex: w.index,
      rotationMs: ROTATION_MS,
      graceWindows: GRACE_WINDOWS,
      chainId: PRESENCE_CHAIN.chainId,
      resolver: PRESENCE_CHAIN.resolverAddress,
    };
  }
}

/* ── QR payload ───────────────────────────────────────────────────────────── */

export function encodeTicket(t: PresenceTicket): string {
  return `supercompute://presence?d=${encodeURIComponent(JSON.stringify(t))}`;
}

export function decodeTicket(uri: string): PresenceTicket | null {
  const marker = 'd=';
  const i = uri.indexOf(marker);
  if (i === -1) return null;
  try {
    const parsed = JSON.parse(
      decodeURIComponent(uri.slice(i + marker.length)),
    ) as PresenceTicket;
    if (parsed?.v !== 1 || !parsed.secret || !parsed.eventId) return null;
    return parsed;
  } catch {
    return null;
  }
}

/* ── Organiser signature (the gasless payload) ────────────────────────────── */

/**
 * Sign the EAS `Attest` payload for a claim — the A2 surface. An organiser (or a
 * relayer holding the organiser key) signs off-chain, so the claim costs the
 * attendee nothing.
 *
 * `schema` must be the registered UID (PRESENCE_EVENT_UID on Base Sepolia).
 * A signature over it is a submittable EAS claim once a relayer broadcasts it.
 */
export async function signAttest(
  wallet: WalletClient,
  signer: Address,
  message: AttestMessage,
): Promise<Hex> {
  return wallet.signTypedData({
    account: signer,
    domain: EAS_DOMAIN,
    types: EAS_ATTEST_TYPES,
    primaryType: 'Attest',
    message,
  });
}

/* ── Relay ────────────────────────────────────────────────────────────────── */

export type RelayOutcome =
  | { status: 'relayed'; attestationUID: Hex; via: string }
  | { status: 'signed'; signature: Hex; reason: string }
  | { status: 'error'; error: string };

export interface RelayConfig {
  endpoint?: string;
  bearerToken?: string;
}

export function relayConfigFromEnv(): RelayConfig {
  return {
    endpoint: import.meta.env.VITE_PRESENCE_RELAY_URL,
    bearerToken: import.meta.env.VITE_PRESENCE_RELAY_TOKEN,
  };
}

/**
 * Hand a signed claim to the gasless relayer. With no relayer configured the
 * signature is still returned — the claim is valid, it just has not been
 * broadcast. The UI must surface that distinction rather than claim success.
 */
export async function relayClaim(
  relay: RelayConfig,
  body: Record<string, unknown>,
  signature: Hex,
): Promise<RelayOutcome> {
  if (!relay.endpoint) {
    return {
      status: 'signed',
      signature,
      reason: 'No Presence relayer configured (VITE_PRESENCE_RELAY_URL unset).',
    };
  }
  try {
    const res = await fetch(relay.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(relay.bearerToken
          ? { authorization: `Bearer ${relay.bearerToken}` }
          : {}),
      },
      body: JSON.stringify({ ...body, signature, domain: EAS_DOMAIN }),
    });
    const parsed: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        status: 'error',
        error: `relayer ${res.status}: ${JSON.stringify(parsed)}`,
      };
    }
    const uid =
      parsed && typeof parsed === 'object'
        ? ((parsed as Record<string, unknown>).attestationUID ??
          (parsed as Record<string, unknown>).uid)
        : undefined;
    return {
      status: 'relayed',
      attestationUID: (uid as Hex) ?? ('0x' as Hex),
      via: relay.endpoint,
    };
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
