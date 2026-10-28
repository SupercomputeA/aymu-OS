import { Construction } from 'lucide-react';

interface AppletSpec {
  code: string;
  title: string;
  tagline: string;
  items: string[];
}

function AppletPlaceholder({ spec }: { spec: AppletSpec }) {
  return (
    <div className="h-full flex flex-col overflow-auto p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="px-2 py-1 rounded text-xs font-mono tracking-[0.2em] border border-primary/40 text-primary">
          {spec.code}
        </span>
        <h2 className="text-xl font-semibold tracking-wide">{spec.title}</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-6">{spec.tagline}</p>

      <div className="glass-panel p-4 space-y-2.5 text-sm">
        {spec.items.map((item) => (
          <div key={item} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
            <span>{item}</span>
            <span className="ml-auto text-xs text-muted-foreground/60 font-mono">planned</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-6 flex items-start gap-2 text-xs text-muted-foreground">
        <Construction className="w-4 h-4 mt-px shrink-0" />
        <span>
          Not wired — this is the honest placeholder surface. On-chain connection
          (ENS / EAS / Base L2) arrives in a later gate. Nothing here claims a live
          chain read or signature.
        </span>
      </div>
    </div>
  );
}

type AppletProps = { windowId: string; fileId?: string };

const makeApplet = (spec: AppletSpec) => {
  const Component = (_props: AppletProps) => <AppletPlaceholder spec={spec} />;
  return Component;
};

export const EmbassyApp = makeApplet({
  code: 'EMBASSY',
  title: 'Embassy',
  tagline: 'Sovereign identity & presence — your on-chain passport and outpost.',
  items: [
    'ENS login + passport (nameProvenance: issued / brought)',
    'ERC-6551 franchise TBA derivation (deterministic)',
    'EAS presence check-ins',
  ],
});

export const NewsDeskApp = makeApplet({
  code: 'NEWS DESK',
  title: 'News Desk',
  tagline: 'Publishing surface — the sovereignty feed.',
  items: [
    'Lens / IPFS / ETH.LIMO publishing',
    'Word-NFT mint on dispatch',
    'Attestation feed (EAS refUID trail)',
  ],
});

export const TradeDeskApp = makeApplet({
  code: 'TRADE DESK',
  title: 'Trade Desk',
  tagline: 'Wallet · reserve · token · cashflow.',
  items: [
    'Non-custodial wallet (tree-shaken viem, no wagmi)',
    'Reserve / token / cashflow views',
    'SPLIT / LP / stable instruments',
  ],
});

export const SchoolApp = makeApplet({
  code: 'SCHOOL',
  title: 'The School',
  tagline: 'Awards & helpdesk — the learning surface.',
  items: [
    'Awards ledger',
    'Helpdesk',
    'Pixel-compiler school feed',
  ],
});

export const LexApp = makeApplet({
  code: 'LEX',
  title: 'LEX',
  tagline: 'Read-first dictionary + word NFT.',
  items: [
    'Dictionary + micro-publishing terminal',
    'Word NFT (verb communities, supersession trail)',
    'Tokenized vocabulary as subscription',
  ],
});

export const AgentOpsApp = makeApplet({
  code: 'AGENT OPS',
  title: 'Agent Ops',
  tagline: 'Virtuals protocol — the agent economy.',
  items: [
    'EconomyOS (non-custodial agent wallets)',
    'ACP v2 job terminal (escrow / completion)',
    'Capital formation (bonding curves, LP locks)',
  ],
});

export const SkinBuilderApp = makeApplet({
  code: 'SKIN BUILDER',
  title: 'Skin Builder',
  tagline: 'The forge — locked palette, procedural.',
  items: [
    'Palette / type / borders / HUD',
    'Locked palette (honest by construction)',
    'Procedural pixel compiler (zero arbitrary uploads)',
  ],
});
