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

## Design source

The forkable design source lives in [`design/DESIGN.md`](design/DESIGN.md) —
locked tokens (`design/tokens.json`), the component library
(`src/components/ui` · `os` · `apps`), and the honest-by-construction rules,
under CC BY-SA 4.0. Fork code + tokens, not a `.fig`.

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
| **Web3 core** — wagmi wallet-connect + ENS + ERC-6551 TBA derivation | ✅ this fork |
| EAS / Lens / Presence chain-core modules | ✅ ported (library, `src/lib/`) |
| Embassy desk (passport) | ✅ this fork |
| NewsDesk / TradeDesk / School / LEX / AgentOps desks | ⬜ not wired — ported modules only |

`deployed ≠ minted`, `zero ≠ unknown` — nothing above claims on-chain wiring it
does not have. The Embassy passport surfaces real chain reads (account, chainId,
ENS, TBA derivation) and labels anything not yet minted or not yet enforced as
such; it never fabricates an address, a mint, or a role grant.

## Web3 core — Embassy passport

The **Embassy** desk (`src/components/apps/EmbassyApp.tsx`) is the Web3 front
door: it connects an injected wallet (wagmi `injected` connector,
`reconnectOnMount` off so no popup fires on first paint), then reads the live
chain — account, chainId, primary ENS name (mainnet) — and shows a **local**
ERC-6551 token-bound-account derivation for the Immersion NFT, plus the
proposed role matrix. Until an Immersion NFT is actually minted the derivation
is a preview and the passport says `minted: false`.

The chain-core library lives in `src/lib/` and is the ported foundation for the
remaining desks:

| Module | What it is | Surfaces |
| --- | --- | --- |
| `wagmi.ts` | wagmi config — Base Sepolia / Base / Ethereum, injected connector | App provider |
| `supercompute.ts` | chain constants — EAS, SchemaRegistry, Aragon DAO, RPC transports | library |
| `immersion.ts` | Immersion NFT + ERC-6551 TBA derivation, passport model | Embassy |
| `roles.ts` | the 15-role matrix (14 designations + charter holder), bitfield | Embassy |
| `eas.ts` / `eas-index.ts` | EAS schemas, ABIs, canon Presence UIDs, read layer | library |
| `lens.ts` / `lensWrite.ts` | Lens read (GraphQL) + write (viem) publishing rail | library |
| `presence.ts` / `presence-chain.ts` | gasless proof-of-attendance (ported from canon) | library |
| `charter.ts` / `community.ts` / `lexicon.ts` | franchise grant, community identity, vocabulary | library |
| `matrix.ts` | sub-app & feature matrix (roadmap as data) | library |

## Verified constants

The protocol addresses in `src/lib/immersion.ts` and `src/lib/supercompute.ts`
are **verified, not assumed**. `scripts/erc6551-conformance.ts` reads the live
chain and asserts:

- the ERC-6551 registry + account implementation have code on Base and Base
  Sepolia;
- the local create2 TBA derivation is bit-identical to the deployed registry's
  `account()` on both chains;
- the Immersion token contract, 0xSplits SplitMain, and the Aragon DAO have
  code where the app expects them;
- EAS has code on Ethereum / Base / Base Sepolia, and `computeSchemaUID`
  reproduces the two canon Presence schema UIDs.

```sh
node --experimental-strip-types scripts/erc6551-conformance.ts
```

Exits non-zero on any failure (Node ≥ 22.6).

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
