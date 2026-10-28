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
 * Procedural (NeuroNoise), no uploaded asset. `speed: 0.5` — the animated
 * signature shader (a slow drift). The package's presets (default / sensation
 * / bloodstream / ghost) use none of the locked navy+brass, so the colours are
 * hand-tuned here; `ghost` is the closest in spirit (monochrome, heavy).
 * ========================================================================= */

import { NeuroNoise } from '@paper-design/shaders-react';

const NERO = {
  colorBack: '#0a1330',
  colorMid: '#0d1f3d',
  colorFront: '#c9a33a',
  brightness: 0.05,
  contrast: 0.2,
  speed: 0.5,
} as const;

export function NeroWallpaper() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
      <NeuroNoise
        className="w-full h-full"
        colorBack={NERO.colorBack}
        colorMid={NERO.colorMid}
        colorFront={NERO.colorFront}
        brightness={NERO.brightness}
        contrast={NERO.contrast}
        speed={NERO.speed}
        fit="cover"
      />
    </div>
  );
}
