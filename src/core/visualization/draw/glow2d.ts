/**
 * The 2D stand-in for the WebGL bloom pass.
 *
 * The 3D scenes get their neon identity from `UnrealBloomPass`. Canvas has no
 * post-processing chain, so we approximate it with layered `shadowBlur` draws:
 * cheap, and close enough that a DP table and a sorting scene look like they
 * belong to the same product.
 *
 * Intensity is expected to be scaled by the theme's glow multiplier — in light
 * mode glows are switched off entirely, because neon on white reads as a bug.
 */

/** Run `paint` with a coloured glow applied underneath it. */
export function withGlow(
  ctx: CanvasRenderingContext2D,
  color: string,
  intensity: number,
  paint: () => void,
): void {
  if (intensity <= 0) {
    paint();
    return;
  }

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 18 * intensity;
  paint();
  // A second, tighter pass builds a hot core instead of a flat haze.
  ctx.shadowBlur = 7 * intensity;
  paint();
  ctx.restore();

  // Final un-shadowed pass keeps edges crisp on top of the bloom.
  paint();
}

/** Radial falloff behind a point — node halos, active-cell emphasis. */
export function halo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  intensity: number,
): void {
  if (intensity <= 0 || radius <= 0) return;

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, withAlpha(color, 0.42 * intensity));
  gradient.addColorStop(0.55, withAlpha(color, 0.14 * intensity));
  gradient.addColorStop(1, withAlpha(color, 0));

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Apply an alpha to a `#rgb`/`#rrggbb` colour.
 *
 * Canvas gradients need an explicit rgba stop — `globalAlpha` would fade the
 * whole gradient uniformly and lose the falloff.
 */
export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  const value = Number.parseInt(normalized.slice(1), 16);
  if (Number.isNaN(value)) return hex;
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Blend two hex colours; `t` of 0 returns `from`, 1 returns `to`. */
export function mixHex(from: string, to: string, t: number): string {
  const a = Number.parseInt(from.slice(1), 16);
  const b = Number.parseInt(to.slice(1), 16);
  if (Number.isNaN(a) || Number.isNaN(b)) return to;
  const k = Math.max(0, Math.min(1, t));
  const r = Math.round(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * k);
  const g = Math.round(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * k);
  const bl = Math.round((a & 255) + ((b & 255) - (a & 255)) * k);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
}
