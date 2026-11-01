# Immersion OS — Design Source

The **steel-vault** design source for Immersion OS — the sovereign Web3 desktop
("AOL for Web3"). Fork it.

This is the forkable design package: the locked tokens, the component library,
and the honest-by-construction rules — everything visual, in one place, under
one license.

## What's here

| Path | What it is |
| --- | --- |
| `design/tokens.json` | The single token reference — palette, semantic roles, accents, radius, type, spacing, elevation. Pull from it; never invent a value. |
| `src/components/ui/` | The shadcn/ui primitive set (48 components). |
| `src/components/os/` | The OS chrome — `Desktop`, `Window`, `WindowManager`, `Dock`, `TopBar`, `BootScreen`, `LoginScreen`, `AppDrawer`, `NeroWallpaper`. |
| `src/components/apps/` | The app surfaces — `EmbassyApp` (the Web3 passport), `SettingsApp`, `TerminalApp`, `FinderApp`, `BrowserApp`, `MusicPlayerApp`, `NotepadApp`, `CalculatorApp`, `AppStoreApp`, `AboutApp`, and more. |
| `LICENSE-DESIGN.txt` | Design license (CC BY-SA 4.0). |
| `CONTRIBUTING.md` | The contribution contract (RFC-first, token-referencing). |

## The locked palette (six hexes, no more)

The steel-vault identity is deliberately narrow. No new hue without a public RFC.

| Token | Hex | Role |
| --- | --- | --- |
| `navy` | `#0a1330` | ground / background |
| `slate` | `#0d1f3d` | surface / mid |
| `steel` | `#1a2f4d` | elevated / secondary surface |
| `brass` | `#c9a33a` | accent / metal (primary) |
| `dark-brass` | `#8a6d1f` | accent · active / pressed |
| `cream` | `#e8dcc0` | text / wordmark on dark |

Eight user-selectable accents (HSL, `design/tokens.json` → `accents`): brass ·
indigo · cyan · orange · amber · emerald · pink · purple. These are the only
accents; a new one is an RFC, not a quick add.

> **Cream is `#e8dcc0` — canonical.** The legacy Immersion skin source
> (`supercompute-immersion/supercompute-skin.css`) once used `#F4ECD8`; that
> value is **deprecated** and lives only in the retired source, not in this
> codebase. Do not fork `#F4ECD8`. (Revisit only if Mone rules otherwise.)

## Tokens

`design/tokens.json` is the single source of truth — versioned, and its
`"version"` field must track the software version bump (see `CONTRIBUTING.md`).

- **Color** — `palette` (6 locked hexes) + `semantic` (HSL roles:
  background/foreground/card/primary/secondary/muted/accent/destructive/border/
  input/ring) + `accents` (8 swatches).
- **Radius** — one value, `0.5rem` (8px). No ad-hoc corners.
- **Type scale** — hero 24 / title 20 / body 16 / secondary 14 / label 12.
  Micro-labels never below 12px.
- **Spacing** — Tailwind 4px grid (`0.25rem` base). No ad-hoc px offsets.
- **Elevation** — glass (0.88 alpha + 12px blur) and dock (0.9 alpha).

## Honest by construction (non-negotiable)

- **Nothing fabricated.** An unset value renders as `not wired` / `—` /
  `0 · NOT WIRED` — never a plausible-looking placeholder address, mint, or
  count.
- **Zero arbitrary uploads.** Identity/art is procedural, seeded from the
  address.
- **`deployed ≠ minted`, `zero ≠ unknown`.** State is stated truthfully; a demo
  surface says so.

## License

Design assets (tokens, components, icons, docs) — **CC BY-SA 4.0**
(`LICENSE-DESIGN.txt`): share-alike, attribute Supercompute.
Code — **Apache-2.0** (`LICENSE.txt`).

## Fork & contribute

See `CONTRIBUTING.md` — discuss first (RFC), fork/branch, reference the tokens,
tag the release. The community forks code + tokens, not a `.fig`.
