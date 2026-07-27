/**
 * Text helpers for the 2D families.
 *
 * Canvas text has no layout engine, so anything that has to fit inside a cell
 * (DP values, node keys, hash keys) needs explicit measurement. Centralising it
 * here keeps every family's typography identical and avoids each one
 * re-inventing "shrink until it fits".
 */

export type FontWeight = 400 | 500 | 600 | 700;

/** Matches the app's `--font-sans` / `--font-mono` stacks closely enough for canvas. */
export const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
export const MONO = "ui-monospace, SFMono-Regular, Menlo, 'Cascadia Mono', monospace";

export function font(size: number, weight: FontWeight = 500, family = SANS): string {
  return `${weight} ${size}px ${family}`;
}

export interface LabelOptions {
  color: string;
  size?: number;
  weight?: FontWeight;
  family?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  /** Render at reduced opacity without the caller juggling globalAlpha. */
  alpha?: number;
}

/** Draw a single line of text at (x, y). */
export function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: LabelOptions,
): void {
  ctx.save();
  ctx.font = font(opts.size ?? 12, opts.weight ?? 500, opts.family ?? SANS);
  ctx.fillStyle = opts.color;
  ctx.textAlign = opts.align ?? 'center';
  ctx.textBaseline = opts.baseline ?? 'middle';
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * Largest font size (≤ `maxSize`) at which `text` fits within `maxWidth`.
 *
 * Measuring is not free, so this steps down rather than binary-searching: cell
 * contents are short and the loop bails after a handful of iterations.
 */
export function fitSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize = 8,
  weight: FontWeight = 500,
  family = SANS,
): number {
  for (let size = maxSize; size > minSize; size -= 1) {
    ctx.font = font(size, weight, family);
    if (ctx.measureText(text).width <= maxWidth) return size;
  }
  return minSize;
}

/** Draw text centred in a box, shrinking to fit rather than overflowing. */
export function labelFitted(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  maxWidth: number,
  opts: LabelOptions,
): void {
  const weight = opts.weight ?? 600;
  const family = opts.family ?? MONO;
  const size = fitSize(ctx, text, maxWidth, opts.size ?? 14, 8, weight, family);
  label(ctx, text, cx, cy, { ...opts, size, weight, family });
}

/** Truncate with an ellipsis to fit `maxWidth` at the current font. */
export function ellipsize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(`${text.slice(0, mid)}…`).width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return `${text.slice(0, lo)}…`;
}
