/* ============================================================================
 * THE ROLE MATRIX — 14 designations + the charter holder = 15 roles
 * ----------------------------------------------------------------------------
 * PROPOSAL STATUS — read this first.
 *
 * Unlike Presence (which has canon): there is NO roles contract, no
 * `RolesMatrix.sol`, and no role enum anywhere in the SupercomputeA repos I can
 * see. The 14 designations come from the Immersion NFT architecture brief; the
 * permission decomposition below is *mine*, designed so it can be implemented
 * on-chain later.
 *
 * Consequently:
 *   • this module is the single source of truth for roles in the OS, and
 *   • NOTHING enforces these bits on-chain today. `hasPermission()` is a local
 *     predicate, not an access check. The UI must never imply otherwise.
 *
 * Encoded as a bitfield so that the whole matrix compresses to one uint256 per
 * holder — which is what you would store in the Immersion NFT's token-bound
 * account, or as an EAS attestation.
 * ========================================================================= */

/** Capability bits. Order is stable — never renumber, only append. */
export const PERMISSION = {
  GOV_VIEW: 1n << 0n,
  GOV_PROPOSE: 1n << 1n,
  GOV_VOTE: 1n << 2n,
  GOV_EXECUTE: 1n << 3n,
  GOV_DELEGATE: 1n << 4n,

  MEMBER_INVITE: 1n << 5n,
  MEMBER_ROLE_GRANT: 1n << 6n,
  MEMBER_REVOKE: 1n << 7n,

  FISC_VIEW: 1n << 8n,
  FISC_SPEND: 1n << 9n,
  FISC_DISTRIBUTE: 1n << 10n,
  FISC_ACCOUNTING: 1n << 11n,

  CONTENT_PUBLISH: 1n << 12n,
  CONTENT_MODERATE: 1n << 13n,

  BROADCAST_OWN: 1n << 14n,
  BROADCAST_ORG: 1n << 15n,

  EVENT_CREATE: 1n << 16n,
  EVENT_ATTEND: 1n << 17n,
  EVENT_GATE: 1n << 18n,

  SCHOOL_AUTHOR: 1n << 19n,
  SCHOOL_ENROLL: 1n << 20n,

  STORE_SELL: 1n << 21n,
  STORE_BUY: 1n << 22n,

  WALLET_SIGN_SELF: 1n << 23n,
  WALLET_SIGN_ORG: 1n << 24n,

  LEGAL_ATTEST: 1n << 25n,
  PARTNER_INTEGRATE: 1n << 26n,

  /* Charter rights — what an Immersion franchise confers on its holder. These
     are the only bits that belong to a holder rather than to a participant. */
  LEXICON_STEWARD: 1n << 27n,
  VALUES_SCORE: 1n << 28n,
  CHARTER_CREATE: 1n << 29n,
} as const;

export type PermissionKey = keyof typeof PERMISSION;

export const PERMISSION_KEYS = Object.keys(PERMISSION) as PermissionKey[];

const ALL: bigint = PERMISSION_KEYS.reduce(
  (acc, k) => acc | PERMISSION[k],
  0n,
);

function mask(...keys: PermissionKey[]): bigint {
  return keys.reduce((acc, k) => acc | PERMISSION[k], 0n);
}

/* ── The 14 designations, in the brief's own grouping ─────────────────────── */

export type RoleGroup = 'core' | 'operations';

export interface RoleDef {
  /** Stable id — used in code and in any future on-chain enum. */
  id: string;
  /** Display name exactly as the brief names it. */
  label: string;
  group: RoleGroup;
  /** What this role is for, in one line. */
  purpose: string;
  /** Capability set. */
  permissions: bigint;
  /** Illustrative ENS subname shape, if the org mints subdomains. */
  ensPattern: string;
}

export const ROLES: readonly RoleDef[] = [
  /* Core & Governance */
  {
    id: 'founder',
    label: 'Founder',
    group: 'core',
    purpose: 'Full authority. The only role that can grant or revoke roles.',
    permissions: ALL,
    ensPattern: 'founder.supercompute.eth',
  },
  {
    id: 'founding',
    label: 'Founding',
    group: 'core',
    purpose: 'Charter members. Broad power, but cannot revoke membership.',
    permissions: ALL & ~PERMISSION.MEMBER_REVOKE,
    ensPattern: 'founding.<name>.supercompute.eth',
  },
  {
    id: 'investor',
    label: 'Investor',
    group: 'core',
    purpose: 'Capital in. Sees the books, votes, publishes, does not operate.',
    permissions: mask(
      'GOV_VIEW', 'GOV_PROPOSE', 'GOV_VOTE', 'GOV_DELEGATE',
      'FISC_VIEW', 'FISC_ACCOUNTING',
      'CONTENT_PUBLISH', 'EVENT_ATTEND', 'SCHOOL_ENROLL',
      'STORE_BUY', 'WALLET_SIGN_SELF',
    ),
    ensPattern: 'investor.<name>.supercompute.eth',
  },
  {
    id: 'member',
    label: 'Member',
    group: 'core',
    purpose: 'A sovereign bubble participant — the baseline governance citizen.',
    permissions: mask(
      'GOV_VIEW', 'GOV_PROPOSE', 'GOV_VOTE',
      'CONTENT_PUBLISH', 'BROADCAST_OWN',
      'EVENT_ATTEND', 'SCHOOL_ENROLL', 'STORE_BUY', 'WALLET_SIGN_SELF',
    ),
    ensPattern: '<name>.supercompute.eth',
  },
  {
    id: 'partner',
    label: 'Partner',
    group: 'core',
    purpose: 'External org with an integration line into the bubble.',
    permissions: mask(
      'GOV_VIEW', 'GOV_PROPOSE',
      'CONTENT_PUBLISH', 'BROADCAST_OWN',
      'EVENT_ATTEND', 'STORE_BUY',
      'WALLET_SIGN_SELF', 'PARTNER_INTEGRATE',
    ),
    ensPattern: 'partner.<org>.supercompute.eth',
  },
  {
    id: 'legal',
    label: 'Legal',
    group: 'core',
    purpose: 'Signs consent, waivers and attestations on the org’s behalf.',
    permissions: mask(
      'GOV_VIEW', 'FISC_ACCOUNTING', 'LEGAL_ATTEST', 'WALLET_SIGN_ORG',
    ),
    ensPattern: 'legal.<name>.supercompute.eth',
  },

  /* Operations & Execution */
  {
    id: 'fiscal',
    label: 'Fiscal',
    group: 'operations',
    purpose: 'Moves money: treasury spend, splits, distribution.',
    permissions: mask(
      'GOV_VIEW',
      'FISC_VIEW', 'FISC_SPEND', 'FISC_DISTRIBUTE', 'FISC_ACCOUNTING',
      'WALLET_SIGN_ORG',
    ),
    ensPattern: 'fiscal.<name>.supercompute.eth',
  },
  {
    id: 'community',
    label: 'Community',
    group: 'operations',
    purpose: 'Runs the bubble: invites, moderation, events, gating.',
    permissions: mask(
      'GOV_VIEW', 'MEMBER_INVITE',
      'CONTENT_PUBLISH', 'CONTENT_MODERATE',
      'BROADCAST_OWN', 'BROADCAST_ORG',
      'EVENT_CREATE', 'EVENT_ATTEND', 'EVENT_GATE',
      'SCHOOL_ENROLL', 'STORE_BUY', 'WALLET_SIGN_SELF',
    ),
    ensPattern: 'community.<name>.supercompute.eth',
  },
  {
    id: 'student',
    label: 'Student',
    group: 'operations',
    purpose: 'Enrolled in the School. Earns Presence-backed certifications.',
    permissions: mask(
      'GOV_VIEW', 'CONTENT_PUBLISH',
      'EVENT_ATTEND', 'SCHOOL_ENROLL',
      'STORE_BUY', 'WALLET_SIGN_SELF',
    ),
    ensPattern: 'student.<handle>.supercompute.eth',
  },
  {
    id: 'client',
    label: 'Client',
    group: 'operations',
    purpose: 'Buys work. Sees engagement spend, not the org’s books.',
    permissions: mask(
      'GOV_VIEW', 'FISC_VIEW',
      'CONTENT_PUBLISH', 'EVENT_ATTEND',
      'STORE_BUY', 'WALLET_SIGN_SELF',
    ),
    ensPattern: 'client.<org>.supercompute.eth',
  },
  {
    id: 'subscriber',
    label: 'Subscriber',
    group: 'operations',
    purpose: 'Receives broadcasts. Read-mostly.',
    permissions: mask(
      'GOV_VIEW', 'EVENT_ATTEND', 'STORE_BUY', 'WALLET_SIGN_SELF',
    ),
    ensPattern: 'sub.<handle>.supercompute.eth',
  },
  {
    id: 'customer',
    label: 'Customer',
    group: 'operations',
    purpose: 'Storefront buyer. The narrowest standing role.',
    permissions: mask(
      'GOV_VIEW', 'STORE_BUY', 'EVENT_ATTEND', 'WALLET_SIGN_SELF',
    ),
    ensPattern: 'customer.<handle>.supercompute.eth',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    group: 'operations',
    purpose: 'Owns the megaphone: broadcasts, campaigns, merch drops.',
    permissions: mask(
      'GOV_VIEW',
      'CONTENT_PUBLISH', 'BROADCAST_OWN', 'BROADCAST_ORG',
      'EVENT_CREATE', 'STORE_SELL', 'WALLET_SIGN_SELF',
    ),
    ensPattern: 'marketing.<name>.supercompute.eth',
  },
  {
    id: 'channel',
    label: 'Channel',
    group: 'operations',
    purpose: 'A syndication partner — a feed that carries our content.',
    permissions: mask(
      'GOV_VIEW', 'CONTENT_PUBLISH', 'BROADCAST_OWN',
      'EVENT_ATTEND', 'STORE_SELL',
      'WALLET_SIGN_SELF', 'PARTNER_INTEGRATE',
    ),
    ensPattern: 'channel.<feed>.supercompute.eth',
  },

  /* ── Charter holders ──────────────────────────────────────────────────────
   * The role the franchise model turns on: someone who bought an Immersion NFT
   * and therefore stewards their OWN community — its words, its period score,
   * and the instruments created under its token-bound account. This is not a
   * rank inside this org; it is standing over a franchise. */
  {
    id: 'franchisee',
    label: 'Franchisee',
    group: 'core',
    purpose:
      'Holds an Immersion charter: owns the community lexicon, signs its period score, and creates its instruments.',
    permissions: mask(
      'GOV_VIEW', 'GOV_PROPOSE', 'GOV_VOTE',
      'CONTENT_PUBLISH', 'CONTENT_MODERATE',
      'BROADCAST_OWN',
      'FISC_VIEW', 'FISC_ACCOUNTING', 'FISC_DISTRIBUTE',
      'MEMBER_INVITE', 'MEMBER_ROLE_GRANT',
      'LEXICON_STEWARD', 'VALUES_SCORE', 'CHARTER_CREATE',
      'WALLET_SIGN_SELF',
    ),
    ensPattern: '<franchise>.supercompute.eth',
  },
] as const;

export const ROLE_COUNT = ROLES.length; // 15 — 14 designations + the charter holder

export function roleById(id: string): RoleDef | undefined {
  return ROLES.find((r) => r.id === id);
}

export function rolesByGroup(group: RoleGroup): readonly RoleDef[] {
  return ROLES.filter((r) => r.group === group);
}

/* ── The matrix ───────────────────────────────────────────────────────────── */

/**
 * Union of every role's permissions. NOT enforcement — a local predicate.
 * The UI labels it "PROPOSED · NOT ENFORCED" wherever it is shown.
 */
export function permissionsFor(roleIds: readonly string[]): bigint {
  return roleIds.reduce((acc, id) => acc | (roleById(id)?.permissions ?? 0n), 0n);
}

export function hasPermission(
  roleIds: readonly string[],
  permission: PermissionKey,
): boolean {
  return (permissionsFor(roleIds) & PERMISSION[permission]) !== 0n;
}

export function grantedPermissions(roleIds: readonly string[]): PermissionKey[] {
  const bits = permissionsFor(roleIds);
  return PERMISSION_KEYS.filter((k) => (bits & PERMISSION[k]) !== 0n);
}

/** Roles whose permission set is a subset of `bits` — i.e. what a bitmask implies. */
export function rolesImpliedBy(bits: bigint): RoleDef[] {
  return ROLES.filter((r) => (r.permissions & bits) === r.permissions);
}

/** Every capability key granted by at least one role. */
export function coveredPermissions(): PermissionKey[] {
  return grantedPermissions(ROLES.map((r) => r.id));
}

/** Human label for a permission bit. */
export function permissionLabel(key: PermissionKey): string {
  return key
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
