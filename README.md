# Immersion OS

The **sovereign Web3 desktop** — "AOL for Web3". A **Supercompute** fork of
[aymu-OS](https://github.com/indgeek/aymu-os) (Apache-2.0), re-skinned to the
Immersion identity and used as the app-rich chassis for the Immersion applet
roster (Embassy · NewsDesk · TradeDesk · School · LEX · Agent Ops).

**Steel vault, not glass.** The aymu chassis ships a working desktop — file
manager, terminal, browser, music, editor, app store — which Immersion's
lightweight Phase-1 shell (`SupercomputeA/immersion-webos`) deliberately did
not yet build. This fork layers Immersion's identity on top: locked
navy/brass steel-vault palette, CRT scanlines, and the sovereignty narrative.

## What changed from upstream aymu-OS

- **Rebrand** — boot, login, top bar, terminal, settings, about → Immersion OS.
- **Theme** — glassmorphism cyan/purple → steel-vault navy/brass (locked
  palette), pure-CSS CRT scanline + vignette overlay.
- **Identity** — default operator `Operator` (not `User`), brass accent as the
  locked default.

## Status (honest)

| Layer | State |
| --- | --- |
| Desktop shell + window manager | ✅ working (from aymu) |
| Apps: Finder, Terminal, Browser, Music, Editor, App Store | ✅ working (from aymu) |
| Immersion rebrand + steel-vault theme | ✅ this fork |
| Immersion applet roster (Embassy/NewsDesk/TradeDesk/School/LEX/AgentOps) | ⬜ not wired — placeholder target |
| ENS / EAS / Base L2 wiring | ⬜ not wired |

`deployed ≠ minted`, `zero ≠ unknown` — nothing above claims on-chain wiring it
does not have.

## Tech stack (inherited from aymu)

- Vite + React 18 + TypeScript
- Zustand (system / app / file / music / window stores)
- Tailwind CSS + Radix/shadcn UI + framer-motion
- `npm run dev` · `npm run build`

## Run

```sh
npm install
npm run dev      # http://localhost:8080
npm run build    # production bundle
```

## Upstream

Forked from [indgeek/aymu-os](https://github.com/indgeek/aymu-os) (Apache-2.0).
Immersion canon lives in `SupercomputeA/supercompute-os` (`docs/narrative.md`).
