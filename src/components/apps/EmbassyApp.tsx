/* ============================================================================
 * EmbassyApp — the Embassy desk (diplomatic-immunity passport)
 * ----------------------------------------------------------------------------
 * The Web3 core's front door on aymu-OS. Surfaces the honest passport:
 *
 *   · wallet-connect (wagmi injected connector, reconnectOnMount off)
 *   · connected → chainId · account · ENS name (mainnet) · ERC-6551 TBA
 *     derivation preview · the 15-role matrix · minted: false
 *
 * Nothing here fabricates an address, a mint, or a role grant. Until an
 * Immersion NFT is actually minted, the TBA derivation is a PREVIEW and the
 * passport says so.
 * ========================================================================= */

import { useMemo } from 'react';
import { Landmark, Link2, ShieldAlert, Stamp } from 'lucide-react';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import {
  IMMERSION_TOKEN_CONTRACT,
  ERC6551_REGISTRY,
  ERC6551_ACCOUNT_IMPLEMENTATION,
  derivePassport,
} from '@/lib/immersion';
import { ROLES, rolesByGroup } from '@/lib/roles';

function shortAddr(a?: string): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—';
}

export function EmbassyApp(_props: { windowId: string; fileId?: string }) {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address, chainId: mainnet.id });

  // TBA derivation preview — tokenId 1 is a stand-in; nothing is minted yet.
  const passport = useMemo(
    () =>
      derivePassport({
        tokenContract: IMMERSION_TOKEN_CONTRACT,
        tokenId: 1n,
        ensName: ensName ?? null,
        roles: [],
      }),
    [ensName],
  );

  const coreRoles = rolesByGroup('core');
  const opsRoles = rolesByGroup('operations');

  return (
    <div className="h-full flex flex-col overflow-auto p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="px-2 py-1 rounded text-xs font-mono tracking-[0.2em] border border-primary/40 text-primary">
          EMBASSY
        </span>
        <h2 className="text-xl font-semibold tracking-wide">Embassy</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Sovereign identity &amp; presence — your on-chain passport and outpost.
      </p>

      {!isConnected ? (
        <div className="glass-panel p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            The passport reads a connected wallet. Nothing here signs or mints on
            its own — connect to surface chain, account, ENS, and the TBA
            derivation.
          </p>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            onClick={() => connectors[0] && connect({ connector: connectors[0] })}
          >
            <Link2 className="w-4 h-4" />
            Connect wallet
          </button>
          <p className="text-xs text-muted-foreground/70">
            Not wired until a wallet is presented — no fabricated address, mint or
            role grant.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── account ─────────────────────────────────────────────────── */}
          <div className="glass-panel p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Account</span>
              <span className="font-mono">{shortAddr(address)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Chain ID</span>
              <span className="font-mono">{chainId ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ENS</span>
              <span className="font-mono">{ensName ?? '— (no ENS)'}</span>
            </div>
            <button
              className="text-xs text-muted-foreground hover:text-foreground underline"
              onClick={() => disconnect()}
            >
              Disconnect
            </button>
          </div>

          {/* ── TBA derivation preview ──────────────────────────────────── */}
          <div className="glass-panel p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Stamp className="w-4 h-4 text-primary" />
              <span className="font-medium">TBA derivation preview</span>
              <span className="ml-auto text-xs text-muted-foreground/70 font-mono">
                tokenId 1 · not minted
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Token contract</span>
              <span className="font-mono">{shortAddr(IMMERSION_TOKEN_CONTRACT)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Derived account</span>
              <span className="font-mono">{shortAddr(passport.account ?? undefined)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Registry</span>
              <span className="font-mono">{shortAddr(ERC6551_REGISTRY)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Implementation</span>
              <span className="font-mono">{shortAddr(ERC6551_ACCOUNT_IMPLEMENTATION)}</span>
            </div>
            <div className="flex items-center gap-2 pt-1 text-xs">
              <ShieldAlert className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                Derived locally from the deployed collection. The account is not
                created on-chain until the Immersion NFT is actually minted —
                nothing is claimed as minted here.
              </span>
            </div>
          </div>

          {/* ── roles ───────────────────────────────────────────────────── */}
          <div className="glass-panel p-4 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-primary" />
              <span className="font-medium">Role matrix</span>
              <span className="ml-auto text-xs text-muted-foreground/70 font-mono">
                {ROLES.length} roles · proposed · not enforced
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              The designations below are the architecture brief&rsquo;s, held
              locally — no roles contract enforces them on-chain yet, and this
              desk does not imply otherwise.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[...coreRoles, ...opsRoles].map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                  <span>{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono text-muted-foreground/60">minted: false</span>
            <span>·</span>
            <span>deployed ≠ minted — the chain reads real, nothing is invented.</span>
          </div>
        </div>
      )}
    </div>
  );
}
