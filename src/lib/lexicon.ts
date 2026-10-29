/* ============================================================================
 * Lexicon — the vocabulary a community owns
 * ----------------------------------------------------------------------------
 * A post is authored, dated, and read in sequence. A TERM is not a post:
 *
 *   post                          term
 *   ────                          ────
 *   slug + timestamp              headword + namespace
 *   EDITED                        SUPERSEDED — a canonical definition is never
 *                                 silently rewritten; the trail is the value
 *   author                        steward, plus a status
 *   tags                          see-also / contrasts-with / replaces
 *   published date                who said it first, and when it entered canon
 *
 * The seed terms below are not placeholders. They are the actual arbitrations
 * made while writing this system's own design language — which had four names in
 * circulation and no source of truth to settle them. That is what this desk is
 * for, so it starts with its own first entries.
 * ========================================================================= */

import type { GrantStatus } from './charter';

export type TermStatus =
  | 'canonical'
  | 'proposed'
  | 'contested'
  | 'deprecated'
  | 'alias'
  | 'scoped';

/** `term` is the substrate — a record in the vocabulary. `verb` is the value
 *  unit — one Lens post + one collect NFT, the minted word a community owns. */
export type TermKind = 'term' | 'verb';

export interface Term {
  /** The headword — what you would look up. */
  headword: string;
  /** `term` = substrate (a vocabulary record); `verb` = the minted value unit. */
  kind: TermKind;
  /** Namespace it belongs to. The house lexicon is `supercompute`, per above. */
  namespace: string;
  /** One sentence that can stand alone. */
  definition: string;
  status: TermStatus;
  /** Who may change it. */
  steward: string;
  /** Terms this one points at. */
  seeAlso: string[];
  /** Other spellings that resolve here. */
  aliases: string[];
  /** The term this one replaces, if any. */
  replaces?: string;
  /** The term that replaced this one. Present means: do not use this anymore. */
  supersededBy?: string;
  /** Who defined it, and where the definition can be checked. */
  provenance: string;
  /** ISO date it entered the lexicon. */
  since: string;
  /** True when the definition rests on a value the system can actually check. */
  enforced: boolean;
  note?: string;
}

/* ── the seed: this system's own first arbitrations ──────────────────────── */

export const SEED_TERMS: readonly Term[] = [
  {
    headword: 'Terminal Dossier',
    namespace: 'supercompute',
    kind: 'term',
    definition:
      'The name of Supercompute\u2019s design language: deep-navy ground, brass hairlines, cream display text, mono-blue body, HUD corner brackets over CRT scanlines.',
    status: 'canonical',
    steward: 'Supercompute design system (DesignDesk)',
    seeAlso: ['DesignDesk', 'Cyborg-Agency', 'Immersion'],
    aliases: ['Terminal Blue', 'xmen-blue-gold'],
    provenance:
      'DESIGN.md \u00a71 \u2014 github.com/SupercomputeA/DesignDesk. Name of record; the machine id is xmen-blue-gold.',
    since: '2026-10-02',
    enforced: true,
    note: 'Was carrying four names at once. This entry is the arbitration.',
  },
  {
    headword: 'Cyborg-Agency',
    namespace: 'supercompute',
    kind: 'term',
    definition:
      'The prior Supercompute palette \u2014 pink #E91E8C, cyan #00D4FF, violet #7c3aed, indigo #6366f1 \u2014 with an Inter body and 6\u201320px radii.',
    status: 'deprecated',
    steward: 'Supercompute design system (DesignDesk)',
    seeAlso: ['Terminal Dossier'],
    aliases: [],
    supersededBy: 'Terminal Dossier',
    provenance:
      'DESIGN.md \u00a77 hard bans. Still present in legacy files: colors_and_type.css, the marketing kit tokens, 9 preview specimens, 2 pattern sheets.',
    since: '2026-10-02',
    enforced: true,
    note: 'Deprecated is not deleted: the files still exist, so the term must stay look-up-able.',
  },
  {
    headword: 'xmen-blue-gold',
    namespace: 'supercompute',
    kind: 'term',
    definition:
      'The machine identifier for the Terminal Dossier language, used as the OpenDesign style key and in published metadata.',
    status: 'alias',
    steward: 'Supercompute design system (DesignDesk)',
    seeAlso: ['Terminal Dossier'],
    aliases: [],
    provenance:
      '.od design-system metadata `style: xmen-blue-gold`; DESIGN.md \u00a71. Published \u2014 do not change.',
    since: '2026-10-02',
    enforced: true,
    note: 'An alias, not a second name: it resolves to Terminal Dossier and never competes with it.',
  },
  {
    headword: 'Immersion',
    namespace: 'supercompute',
    kind: 'term',
    definition:
      'The desk product \u2014 the sovereign WebOS and its skin \u2014 as distinct from the design language it is drawn in.',
    status: 'scoped',
    steward: 'Supercompute',
    seeAlso: ['Terminal Dossier'],
    aliases: [],
    provenance:
      'src/styles/skins/immersion.css and the SupercomputeA/immersion repository. Scope narrowed on 2026-10-02.',
    since: '2026-10-02',
    enforced: true,
    note: 'Was being used for both the product and the language. Scoped to the product only.',
  },
] as const;

/* ── lookups ─────────────────────────────────────────────────────────────── */

export function termsIn(namespace: string): readonly Term[] {
  return SEED_TERMS.filter((t) => t.namespace === namespace);
}

/** Resolve a headword or any alias to its term. Case-insensitive. */
export function resolveTerm(lookup: string): Term | undefined {
  const q = lookup.trim().toLowerCase();
  return SEED_TERMS.find(
    (t) =>
      t.headword.toLowerCase() === q ||
      t.aliases.some((a) => a.toLowerCase() === q),
  );
}

/** Terms that must not be used any more, and what to say instead. */
export function retiredTerms(): readonly Term[] {
  return SEED_TERMS.filter((t) => t.status === 'deprecated');
}

/**
 * Status is carried by an LED, not a badge tone. The design system has exactly
 * four badge tones and none of them means "contested" or "deprecated" — and
 * inventing a fifth tone is how a system forks. The LED sprite set already has
 * the four states a term needs.
 */
export const TERM_STATUS_LED: Record<TermStatus, string> = {
  canonical: '/pixel/led-ok.png',
  proposed: '/pixel/led-warn.png',
  contested: '/pixel/led-fault.png',
  deprecated: '/pixel/led-idle.png',
  alias: '/pixel/led-ok.png',
  scoped: '/pixel/led-warn.png',
};

/**
 * Where the lexicon store itself would live. Nothing is persisted yet: the
 * terms above ship as data, and the KG has no per-holder namespace.
 */
export const LEXICON_STORE = {
  status: 'not-wired' as GrantStatus,
  blockedBy:
    'no lexicon store; the NewsDesk KG renders nodes as label/type/description/properties with no status, steward or supersession',
  planned: 'namespaced terms under the franchise, served by the KG viewer',
} as const;
