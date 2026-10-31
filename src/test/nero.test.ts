import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useSystemStore } from '@/stores/systemStore';
import { NERO_COLORS } from '@/components/os/NeroWallpaper';

// Captured at module load (fresh jsdom, empty localStorage) = the real defaults.
const initialSettings = useSystemStore.getState().settings;

const DEFAULTS = {
  wallpaper: 'nero',
  accentColor: 'brass',
  soundEnabled: true,
  volume: 0.5,
  developerMode: false,
  neroSpeed: 0.5,
  neroBrightness: 0.05,
  neroContrast: 0.2,
};

describe('nero wallpaper settings', () => {
  beforeEach(() => {
    localStorage.clear();
    useSystemStore.setState({ settings: { ...DEFAULTS } });
  });

  it('defaults speed/brightness/contrast to 0.5/0.05/0.2', () => {
    expect(initialSettings.neroSpeed).toBe(0.5);
    expect(initialSettings.neroBrightness).toBe(0.05);
    expect(initialSettings.neroContrast).toBe(0.2);
  });

  it('updates nero settings via updateSettings', () => {
    useSystemStore.getState().updateSettings({ neroSpeed: 1.2, neroBrightness: 0.1 });
    const s = useSystemStore.getState().settings;
    expect(s.neroSpeed).toBe(1.2);
    expect(s.neroBrightness).toBe(0.1);
  });

  it('persists nero settings to localStorage', () => {
    useSystemStore.getState().updateSettings({ neroSpeed: 1.2 });
    const raw = localStorage.getItem('immersion-os-system');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.settings.neroSpeed).toBe(1.2);
  });

  it('locks the steel-vault colors (not user-adjustable)', () => {
    expect(NERO_COLORS.colorBack).toBe('#0a1330');
    expect(NERO_COLORS.colorMid).toBe('#0d1f3d');
    expect(NERO_COLORS.colorFront).toBe('#c9a33a');
    // the adjustable settings expose only the tuning knobs, never the colours
    const settingsType = readFileSync(join(process.cwd(), 'src/types/os.ts'), 'utf8');
    expect(settingsType).not.toContain('neroColor');
    expect(settingsType).not.toContain('colorBack');
  });
});
