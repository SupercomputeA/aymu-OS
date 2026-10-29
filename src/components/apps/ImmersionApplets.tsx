import {
  Newspaper,
  TrendingUp,
  GraduationCap,
  Store,
  BookOpen,
  Users,
  Radio,
  Bot,
  LifeBuoy,
  Palette,
} from 'lucide-react';
import { DemoDesk, type DemoDeskSpec } from './DemoDesk';

type AppletProps = { windowId: string; fileId?: string };

const makeDemoDesk = (spec: DemoDeskSpec) => {
  const Component = (_props: AppletProps) => <DemoDesk spec={spec} />;
  return Component;
};

/* Embassy is the one real, wired applet — its Hero is the passport cover. */
export { EmbassyApp } from './EmbassyApp';

/* Remaining desks — demo Hero pages. Sub-app lists verbatim from docs/menu.md;
 * thesis copy in the steel-vault narrative voice. */
export const NewsDeskApp = makeDemoDesk({
  code: 'NEWS DESK',
  title: 'News desk',
  thesis:
    "the broadsheet: Supercompute's publishing desk. Protocol evaluations, releases, the record.",
  icon: Newspaper,
  items: [
    { name: 'Social Media' },
    { name: 'Blog' },
    { name: 'Project Release' },
    { name: 'Protocol Evaluations' },
  ],
});

export const TradeDeskApp = makeDemoDesk({
  code: 'TRADE DESK',
  title: 'Trade desk',
  thesis:
    'the treasury: wallet, reserve, cashflow, splits. Money, and what it is doing.',
  icon: TrendingUp,
  items: [
    { name: 'Home Office' },
    { name: 'Wallet' },
    { name: 'Reserve' },
    { name: 'Token' },
    { name: 'CashFlow' },
  ],
});

export const SchoolApp = makeDemoDesk({
  code: 'SCHOOL',
  title: 'School NFT',
  thesis: 'the curriculum: sovereign education. Courses, presence, awards.',
  icon: GraduationCap,
  items: [
    { name: 'Awards' },
    { name: 'HelpDesk' },
  ],
});

export const WorldMarketApp = makeDemoDesk({
  code: 'WORLD MARKET',
  title: 'World Market',
  thesis: 'the market: storefront, vendors, community map. Commerce between outposts.',
  icon: Store,
  items: [
    { name: 'Store Front' },
    { name: 'Vendor' },
    { name: 'Community Map', detail: 'Feature Set' },
  ],
});

export const LexApp = makeDemoDesk({
  code: 'LEX',
  title: 'LEX NFT',
  thesis: 'the word: the Verb/Word NFT. Definitions as collectible, meaning as ownership.',
  icon: BookOpen,
  items: [
    { name: 'Word NFT', detail: 'dictionary — Lexicon · Verb · Namespace · Mint · Supersede' },
    { name: 'Dao' },
    { name: 'Meta Token' },
    { name: 'DEFI Accumulation' },
    { name: 'Tax / Subsidy' },
  ],
});

export const CommunityApp = makeDemoDesk({
  code: 'COMMUNITY',
  title: 'Community',
  thesis: 'the commons: social threads between passport holders.',
  icon: Users,
  items: [
    { name: 'Social Media' },
  ],
});

export const ChannelApp = makeDemoDesk({
  code: 'CHANNEL',
  title: 'Channel',
  thesis: 'the broadcast: live stream, social, the tour.',
  icon: Radio,
  items: [
    { name: 'Live stream' },
    { name: 'Social' },
    { name: 'Tour' },
    { name: 'Farcaster' },
  ],
});

export const AgentApp = makeDemoDesk({
  code: 'AGENT',
  title: 'Agent',
  thesis: 'the ops: Virtuals + ACP. Agents that work the outpost.',
  icon: Bot,
  items: [
    { name: 'Virtuals' },
    { name: 'Capital Formation' },
    { name: 'App Release Schedule' },
  ],
});

export const HelpdeskApp = makeDemoDesk({
  code: 'HELPDESK',
  title: 'Helpdesk',
  thesis: 'the desk: support for the Supercompute NFT and per-client.',
  icon: LifeBuoy,
  items: [],
});

export const SettingsDeskApp = makeDemoDesk({
  code: 'SETTINGS',
  title: 'Settings',
  thesis: 'the keys: Admin, Agent Manager, Skin Builder. The controls of the outpost.',
  icon: Palette,
  items: [
    { name: 'Admin' },
    { name: 'Agent Manager' },
    { name: 'Skin Builder', detail: 'UI · TaskBar · Load screen · Wallpaper · Icon · Swatch · Agent · Immersion' },
  ],
});
