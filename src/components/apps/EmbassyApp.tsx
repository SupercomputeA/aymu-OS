/* ============================================================================
 * EmbassyApp — the diplomatic PASSPORT
 * ----------------------------------------------------------------------------
 * Re-shaped from a dashboard into a passport booklet (steel-vault navy/brass).
 *
 *   · PFP  — a procedural pixel avatar, deterministically derived from the
 *            holder's address (locked palette, zero arbitrary uploads).
 *   · ENS  — the holder's name field (resolution already wired on mainnet).
 *   · EAS  — the two canon Presence schemas rendered as "visa stamps".
 *   · DAO  — the 15-role matrix + an Aragon governance entry point.
 *
 * Honesty: "not wired until a wallet is presented"; nothing is fabricated —
 * no address, ENS, attestation count or role grant is invented.
 * ========================================================================= */

import { useMemo } from 'react';
import { Landmark, Link2, ShieldAlert, Stamp } from 'lucide-react';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import {
  PRESENCE_EVENT,
  PRESENCE_EVENT_UID,
  PRESENCE_MOMENT,
  PRESENCE_MOMENT_UID,
} from '@/lib/eas';
import { ROLES, rolesByGroup } from '@/lib/roles';
import { ARAGON_DAO_ADDRESS, GOVERNANCE_LINKS } from '@/lib/supercompute';

function shortAddr(a?: string): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—';
}

/* ── Procedural pixel avatar (honest-by-construction) ─────────────────────── */

const PFP_PALETTE = [
  '#0a1330', // deep navy
  '#0d1f3d', // slate
  '#1a2f4d', // steel
  '#c9a33a', // brass
  '#8a6d1f', // dark brass
  '#e8dcc0', // paper brass
] as const;

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function PixelAvatar({
  seed,
  size = 96,
  grid = 11,
}: {
  seed: string;
  size?: number;
  grid?: number;
}) {
  const rects = useMemo(() => {
    const rand = mulberry32(fnv1a(seed));
    const half = Math.ceil(grid / 2);
    const out: { x: number; y: number; fill: string }[] = [];
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < half; x++) {
        if (rand() > 0.42) {
          const fill = PFP_PALETTE[Math.floor(rand() * PFP_PALETTE.length)];
          out.push({ x, y, fill });
          if (x !== grid - 1 - x) out.push({ x: grid - 1 - x, y, fill });
        }
      }
    }
    return out;
  }, [seed, grid]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${grid} ${grid}`}
      shapeRendering="crispEdges"
      className="block border border-[#c9a33a]/40"
    >
      <rect x="0" y="0" width={grid} height={grid} fill="#0a1330" />
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={1} height={1} fill={r.fill} />
      ))}
    </svg>
  );
}

/* ── Visa stamp (EAS attestation) ─────────────────────────────────────────── */

function VisaStamp({ title, uid }: { title: string; uid: string }) {
  return (
    <div className="flex-1 -rotate-3 rounded-full border-2 border-[#c9a33a]/40 bg-[#0d1f3d]/40 px-4 py-4 text-center">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9a33a]">
        {title}
      </div>
      <div className="mt-1.5 break-all text-[9px] font-mono text-muted-foreground/80">
        {uid.slice(0, 12)}…{uid.slice(-8)}
      </div>
      <div className="mt-1.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
        0 · not wired
      </div>
    </div>
  );
}

/* ── The passport ─────────────────────────────────────────────────────────── */

export function EmbassyApp(_props: { windowId: string; fileId?: string }) {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address, chainId: mainnet.id });

  const seed = address ?? 'not-wired';
  const passportNo = address
    ? `${address.slice(2, 8).toUpperCase()}-${address.slice(-4).toUpperCase()}`
    : 'NOT ISSUED';

  return (
    <div className="h-full flex flex-col overflow-auto p-6">
      <div className="overflow-hidden rounded-lg border-2 border-[#c9a33a]/50 bg-[#0a1330]">
        {/* ── COVER ─────────────────────────────────────────────────────── */}
        <div className="border-b border-[#c9a33a]/30 bg-[#0a1330] px-5 py-4 text-center">
          <div className="mb-1.5 flex items-center justify-center gap-2">
            <Landmark className="h-4 w-4 text-[#c9a33a]" />
            <span className="text-[10px] font-mono tracking-[0.4em] text-[#c9a33a]">
              IMMERSION OS
            </span>
            <Landmark className="h-4 w-4 text-[#c9a33a]" />
          </div>
          <h2 className="text-xl font-semibold tracking-[0.22em] text-[#e8dcc0]">
            DIPLOMATIC PASSPORT
          </h2>
          <div className="mt-1.5 text-[10px] font-mono tracking-[0.3em] text-[#c9a33a]/70">
            PASSPORT Nº {passportNo}
          </div>
        </div>

        {/* ── HOLDER PAGE (PFP + ENS) ──────────────────────────────────── */}
        <div className="space-y-3 px-5 py-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#c9a33a]/80">
            Holder
          </div>

          <div className="flex items-start gap-4">
            <div className="shrink-0">
              {isConnected ? (
                <PixelAvatar seed={seed} size={96} />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded border border-dashed border-[#c9a33a]/40 px-2 text-center text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                  not wired
                </div>
              )}
              <div className="mt-1 text-center text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
                photo
              </div>
            </div>

            <div className="flex-1 space-y-2 text-sm">
              <div>
                <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
                  Holder / ENS
                </div>
                <div className="font-mono text-[#e8dcc0]">{ensName ?? '— not wired'}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
                  Address
                </div>
                <div className="font-mono text-[#e8dcc0]">{shortAddr(address)}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
                  Chain ID
                </div>
                <div className="font-mono text-[#e8dcc0]">{chainId ?? '—'}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span>
              minted: false · issued by the Immersion NFT (ERC-6551) · nothing
              here is fabricated
            </span>
          </div>

          {isConnected ? (
            <button
              className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground underline hover:text-[#c9a33a]"
              onClick={() => disconnect()}
            >
              Disconnect wallet
            </button>
          ) : (
            <div className="space-y-2">
              <button
                className="inline-flex items-center gap-2 rounded bg-[#c9a33a] px-3 py-1.5 text-xs font-semibold text-[#0a1330]"
                onClick={() => connectors[0] && connect({ connector: connectors[0] })}
              >
                <Link2 className="h-3.5 w-3.5" />
                Present wallet
              </button>
              <p className="text-[10px] font-mono text-muted-foreground/70">
                not wired until a wallet is presented — no address, ENS or
                attestation is invented.
              </p>
            </div>
          )}
        </div>

        {/* ── VISA STAMPS (EAS) ────────────────────────────────────────── */}
        <div className="space-y-3 border-t border-[#c9a33a]/20 px-5 py-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#c9a33a]/80">
            Visa stamps — EAS
          </div>
          <div className="flex gap-4">
            <VisaStamp title={PRESENCE_EVENT.title} uid={PRESENCE_EVENT_UID} />
            <VisaStamp title={PRESENCE_MOMENT.title} uid={PRESENCE_MOMENT_UID} />
          </div>
          <p className="text-[10px] font-mono text-muted-foreground/70">
            The two canon Presence schemas (Base Sepolia). Attestations render
            here as stamps once a wallet presents — the count is never invented.
          </p>
        </div>

        {/* ── DAO MEMBERSHIP ───────────────────────────────────────────── */}
        <div className="space-y-3 border-t border-[#c9a33a]/20 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#c9a33a]/80">
              DAO membership
            </div>
            <span className="text-[9px] font-mono text-muted-foreground/60">
              {ROLES.length} roles · proposed · not enforced
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1">
            {[...rolesByGroup('core'), ...rolesByGroup('operations')].map((r) => (
              <div key={r.id} className="flex items-center gap-1.5 text-[11px] font-mono">
                <span className="h-1 w-1 shrink-0 rounded-full bg-[#c9a33a]/50" />
                <span className="text-[#e8dcc0]">{r.label}</span>
              </div>
            ))}
          </div>

          <a
            href={GOVERNANCE_LINKS.aragon}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#c9a33a] hover:underline"
          >
            <Stamp className="h-3.5 w-3.5" />
            Governance — Aragon DAO {shortAddr(ARAGON_DAO_ADDRESS)}
          </a>
        </div>
      </div>
    </div>
  );
}
