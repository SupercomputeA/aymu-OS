# Contributing to Immersion OS — Design

Immersion OS is **open design by default**: public assets, community feedback, open licensing. This file is the contribution contract for the *design layer* (UI, tokens, icons, components). Code contribution rules live alongside it; this governs everything visual.

## The locked palette (do not add hues)

The steel-vault identity is deliberately narrow. Two ground colors, one accent metal, one text tone. No new hues without a public RFC that survives review.

| Token | Hex | Role |
|---|---|---|
| `navy` | `#0a1330` | ground / background |
| `slate` | `#0d1f3d` | surface / mid |
| `brass` | `#c9a33a` | accent / metal |
| `cream` | `#e8dcc0` | text / wordmark on dark |

**Accent swatches** (the eight user-selectable accents, HSL): brass `40 45% 52%` · indigo `230 85% 55%` · cyan `190 85% 55%` · orange `25 95% 55%` · amber `45 95% 55%` · emerald `150 70% 50%` · pink `330 80% 65%` · purple `280 70% 60%`. These are the only accents; a new one is an RFC, not a quick add.

## Honest-by-construction (non-negotiable)

- **Nothing fabricated.** An unset value renders as "not wired" / `—` / `0 · NOT WIRED` — never a plausible-looking placeholder address, mint, or count.
- **Zero arbitrary uploads.** Avatar/art is procedural (pixel compiler, seeded from the address). No `.jpg` hot-linked for identity.
- **"deployed ≠ minted", "zero ≠ unknown".** State is stated truthfully; a demo surface says "demo" and "not wired".

## Grid, typography, states

- **Spacing** follows the existing Tailwind scale; no ad-hoc px. The dock/bar grid is uniform-left (no scattered x-offsets).
- **Type**: hero title 24px / thesis + body 16px / field labels 12px. Micro-labels never below 12px.
- **Accessibility (WCAG AA)**: brass-on-navy and cream-on-navy pass contrast; keep the CRT scanline + vignette overlay subtle so text stays legible. Accessible names (`title`/`aria-label`) on every interactive element are a target — currently a known gap on dock items.
- **Component states**: default · hover · focus · active · disabled · "not wired" — the honest empty state is a first-class state, not an afterthought.

## How to contribute

1. **Discuss first** — open a public issue or RFC for any visual change beyond a typo/fix. Wireframes and low-fi specs are welcome before high-fidelity work.
2. **Fork/branch** — design changes go through a PR against `main`, same as code.
3. **Reference the tokens** — pull from `design/tokens.json`, never hardcode a hex that isn't already in the locked set.
4. **Tag the release** — a design change that ships in software `vX.Y.Z` carries the tag `vX.Y.Z-design`. Keep `design/tokens.json`'s `"version"` field in sync — bump it in the same commit as the software version bump.

## License

Code is Apache-2.0 (`LICENSE.txt`). Design assets (tokens, icons, UI) are **CC BY-SA 4.0** (`LICENSE-DESIGN.txt`) — share-alike, attribute Supercompute.
