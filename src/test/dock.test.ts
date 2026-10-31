import { describe, it, expect } from 'vitest';
import { useAppStore } from '@/stores/appStore';

// Captured at module load (fresh jsdom, empty localStorage) = the real defaults.
const initialPinned = useAppStore.getState().pinnedAppIds;
const initialInstalled = useAppStore.getState().installedAppIds;

const DESKS = [
  'embassy',
  'newsdesk',
  'tradedesk',
  'school',
  'world-market',
  'lex',
  'community',
  'channel',
  'agents',
  'helpdesk',
  'skin-builder', // the Settings surface
];

const CHASSIS = [
  'finder',
  'terminal',
  'browser',
  'music',
  'excalidraw',
  'appstore',
  'settings',
  'notepad',
  'photopea',
];

describe('dock roster', () => {
  it('pins exactly the 10 desks + Settings (11 tiles)', () => {
    expect(initialPinned).toHaveLength(11);
    for (const id of DESKS) {
      expect(initialPinned).toContain(id);
    }
  });

  it('keeps chassis apps OUT of the dock', () => {
    for (const id of CHASSIS) {
      expect(initialPinned).not.toContain(id);
    }
  });

  it('keeps chassis apps reachable via the App Drawer (installed)', () => {
    for (const id of ['finder', 'terminal', 'browser', 'appstore', 'settings']) {
      expect(initialInstalled).toContain(id);
    }
  });
});
