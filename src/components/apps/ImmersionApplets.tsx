import { DemoDesk, type DemoDeskSpec } from './DemoDesk';

type AppletProps = { windowId: string; fileId?: string };

const makeDemoDesk = (spec: DemoDeskSpec) => {
  const Component = (_props: AppletProps) => <DemoDesk spec={spec} />;
  return Component;
};

/* Embassy is the one real, wired applet — re-exported unchanged. */
export { EmbassyApp } from './EmbassyApp';

/* Remaining desks — demo surfaces. Desk names + sub-app lists taken verbatim
 * from docs/menu.md; one-line roles from the archived design source. */
export const NewsDeskApp = makeDemoDesk({
  code: 'NEWS DESK',
  title: 'News desk',
  role: 'Write it, split it, prove it',
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
  role: 'Prepare, never sign',
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
  role: 'Cohorts that learn the rails',
  items: [
    { name: 'Awards' },
    { name: 'HelpDesk' },
  ],
});

export const WorldMarketApp = makeDemoDesk({
  code: 'WORLD MARKET',
  title: 'World Market',
  role: 'Storefront · vendor · community map',
  items: [
    { name: 'Store Front' },
    { name: 'Vendor' },
    { name: 'Community Map', detail: 'Feature Set' },
  ],
});

export const LexApp = makeDemoDesk({
  code: 'LEX',
  title: 'LEX NFT',
  role: 'The value of a word',
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
  role: 'The people on the list',
  items: [
    { name: 'Social Media' },
  ],
});

export const ChannelApp = makeDemoDesk({
  code: 'CHANNEL',
  title: 'Channel',
  role: 'Everything we broadcast',
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
  role: 'Agents on dispatch',
  items: [
    { name: 'Virtuals' },
    { name: 'Capital Formation' },
    { name: 'App Release Schedule' },
  ],
});

export const HelpdeskApp = makeDemoDesk({
  code: 'HELPDESK',
  title: 'Helpdesk',
  role: 'The desk that answers',
  items: [],
});

export const SettingsDeskApp = makeDemoDesk({
  code: 'SETTINGS',
  title: 'Settings',
  role: 'The keys to the outpost',
  items: [
    { name: 'Admin' },
    { name: 'Agent Manager' },
    { name: 'Skin Builder', detail: 'UI · TaskBar · Load screen · Wallpaper · Icon · Swatch · Agent · Immersion' },
  ],
});
