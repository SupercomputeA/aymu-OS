/* ============================================================================
 * NeroWallpaper — the "nero" desktop shader (NeuroNoise)
 * ----------------------------------------------------------------------------
 * The Embassy steel-vault: dark, heavy, authoritative. Drawn from the LOCKED
 * palette only, no invented hue:
 *
 *   colorBack  #0a1330  deep-navy ground (--navy / ground)
 *   colorMid   #0d1f3d  slate surface      (--surface)
 *   colorFront #c9a33a  brass accent        (--gold)
 *
 * Procedural (NeuroNoise), no uploaded asset. The colours are locked; the
 * tuning knobs (speed · brightness · contrast) are user-adjustable and read
 * live from the system store (persisted to localStorage).
 * ========================================================================= */

import { NeuroNoise } from '@paper-design/shaders-react';
import { useSystemStore } from '@/stores/systemStore';

export const NERO_COLORS = {
  colorBack: '#0a1330',
  colorMid: '#0d1f3d',
  colorFront: '#c9a33a',
} as const;

export function NeroWallpaper() {
  const { neroSpeed, neroBrightness, neroContrast } = useSystemStore(
    (s) => s.settings,
  );

  return (
    <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
      <NeuroNoise
        className="w-full h-full"
        colorBack={NERO_COLORS.colorBack}
        colorMid={NERO_COLORS.colorMid}
        colorFront={NERO_COLORS.colorFront}
        brightness={neroBrightness ?? 0.05}
        contrast={neroContrast ?? 0.2}
        speed={neroSpeed ?? 0.5}
        fit="cover"
      />
    </div>
  );
}
