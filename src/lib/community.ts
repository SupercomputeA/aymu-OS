/* ============================================================================
 * THE COMMUNITY — a franchise's lived identity
 * ----------------------------------------------------------------------------
 * An Immersion franchise (charter.ts) is a *grant*: the rights a holder buys.
 * The COMMUNITY is what that franchise *looks like to the people in it* — the
 * name on the door, the mascot on the wall, the message over the PA, the token
 * in the wallet, and the events on the marquee.
 *
 * Two layers, kept separate on purpose:
 *   • charter.ts   — what the holder is GRANTED (rights, revenue, instruments).
 *   • community.ts — what the community IS (brand, token, events, roles).
 *
 * TWO ROLE LAYERS — do not collapse them:
 *   • src/lib/roles.ts     — the PLATFORM's 14-role matrix (founder, member,
 *     fiscal, …). Governance of the Supercompute org itself.
 *   • CommunityBrand.roles — THIS franchise's community roles (Student, Parent,
 *     Teacher, … for a school). What EAS attests FOR THE FRANCHISEE, issued by
 *     the franchise's own token-bound account. A school community's "Teacher"
 *     is not a Supercompute platform role.
 *
 * HONEST STATE: no collection, no community-token contract, and no roles
 * contract are deployed. Everything here is DATA — the shape a community takes
 * — and every value that needs on-chain reality carries a `status` that says so.
 * The UI renders a community from this data; it never invents a live balance,
 * a minted token, or an issued role from a shape.
 * ========================================================================= */

export interface CommunityRole {
  /** Stable id. These are the community's own ids, not platform role ids. */
  id: string;
  label: string;
  /** What this role sees — its screen, in plain words. */
  sees: string;
}

export interface CommunityToken {
  name: string;
  symbol: string;
  /** Honest: no community token is deployed, so there is no supply to show. */
  supply: null;
  status: 'not-wired';
  note: string;
}

export interface CommunityEvent {
  title: string;
  when: string;
  where: string;
  kind: 'fundraiser' | 'club' | 'event' | 'announcement';
}

export interface CommunityBrand {
  name: string;
  /** Sprite id — resolves to /pixel/<mascot>.svg. */
  mascot: string;
  /** Franchise message — the line over the PA. */
  tagline: string;
  /** Provenance line. */
  blurb: string;
  roles: readonly CommunityRole[];
}

export interface Community {
  brand: CommunityBrand;
  token: CommunityToken;
  /** The community-event ads: what scrolls across the marquee. */
  events: readonly CommunityEvent[];
}

export const SCHOOL_COMMUNITY: Community = {
  brand: {
    name: 'Riverbank School',
    mascot: 'owl',
    tagline: 'Learn the rails · keep your keys · own your diploma',
    blurb: 'A Supercompute Immersion · est. by the whole neighbourhood',
    roles: [
      { id: 'student', label: 'Student', sees: 'classes · stickers · my wallet' },
      { id: 'parent', label: 'Parent', sees: "my child's day · announcements" },
      { id: 'teacher', label: 'Teacher', sees: 'my classroom · issue stickers' },
      { id: 'principal', label: 'Principal', sees: 'the fund · the council' },
      { id: 'district', label: 'District', sees: 'outcomes · attendance' },
      { id: 'investor', label: 'Investor', sees: 'school health · the fund' },
      { id: 'community', label: 'Community member', sees: 'events · the shop' },
      { id: 'partner', label: 'Partner', sees: 'sponsorship · the lab' },
      { id: 'developer', label: 'Developer', sees: 'under the hood · the ledger' },
    ],
  },
  token: {
    name: 'Riverbank Points',
    symbol: 'RBP',
    supply: null,
    status: 'not-wired',
    note: 'No community-token contract is deployed. This is the shape a community transacts in, not a minted balance.',
  },
  events: [
    { title: 'Bake sale', when: 'Friday · 3pm', where: 'Gym lobby', kind: 'fundraiser' },
    { title: 'Robotics showcase', when: 'Friday · 5pm', where: 'Makerspace', kind: 'club' },
    { title: 'Field day', when: 'Saturday', where: 'Upper field', kind: 'event' },
    { title: 'Spirit wear', when: 'All week', where: 'The store', kind: 'announcement' },
  ],
};

/** Resolve a community's mascot to its sprite path. */
export function mascotSrc(community: Community): string {
  return `/pixel/${community.brand.mascot}.svg`;
}

/** The seeded communities. The School is the first; forks add more. */
export const COMMUNITIES: readonly Community[] = [SCHOOL_COMMUNITY];

export function communityByName(name: string): Community | undefined {
  return COMMUNITIES.find((c) => c.brand.name === name);
}
