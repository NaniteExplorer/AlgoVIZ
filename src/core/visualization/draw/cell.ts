import { fillRoundRect, strokeRoundRect } from './shapes';
import { labelFitted } from './text';
import { withAlpha, withGlow } from './glow2d';
import type { Canvas2DTheme } from './theme2d';

/**
 * A matrix cell — the workhorse of the DP family and of any grid-shaped board
 * (Sudoku, mazes, hash tables, segment-tree levels).
 *
 * Kept here rather than inside `DPVisualizer` because four different families
 * draw the same object; the only thing that varies is which role colour they
 * hand in.
 */
export interface CellStyle {
  /** Fill colour; when omitted the cell is drawn as an empty slot. */
  fill?: string;
  /** Border colour; falls back to the theme hairline. */
  border?: string;
  /** Text colour; falls back to the theme's primary text. */
  text?: string;
  /** 0–1 glow intensity, multiplied by the theme's glow factor. */
  glow?: number;
  /** 0–1 fade for cells that are present but de-emphasised. */
  alpha?: number;
}

export interface CellBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Draw one grid cell, optionally with a value inside it. */
export function drawCell(
  ctx: CanvasRenderingContext2D,
  box: CellBox,
  value: string | null,
  style: CellStyle,
  theme: Canvas2DTheme,
): void {
  const radius = Math.min(6, Math.min(box.w, box.h) * 0.22);
  const glow = (style.glow ?? 0) * theme.glow;

  ctx.save();
  if (style.alpha !== undefined) ctx.globalAlpha = style.alpha;

  const fill = style.fill ?? withAlpha(theme.surface, 0.55);
  if (glow > 0) {
    withGlow(ctx, fill, glow, () => fillRoundRect(ctx, box.x, box.y, box.w, box.h, radius, fill));
  } else {
    fillRoundRect(ctx, box.x, box.y, box.w, box.h, radius, fill);
  }

  strokeRoundRect(ctx, box.x, box.y, box.w, box.h, radius, style.border ?? theme.line, 1);

  if (value !== null && value.length > 0) {
    labelFitted(ctx, value, box.x + box.w / 2, box.y + box.h / 2, box.w - 8, {
      color: style.text ?? theme.text,
      size: Math.min(15, box.h * 0.45),
      weight: 600,
    });
  }

  ctx.restore();
}

/** Axis header (row/column label) drawn just outside the grid. */
export function drawHeader(
  ctx: CanvasRenderingContext2D,
  box: CellBox,
  text: string,
  theme: Canvas2DTheme,
  active = false,
): void {
  labelFitted(ctx, text, box.x + box.w / 2, box.y + box.h / 2, box.w - 4, {
    color: active ? theme.accent : theme.textMuted,
    size: Math.min(12, box.h * 0.5),
    weight: active ? 700 : 500,
  });
}

/**
 * Geometry for an (rows × cols) grid inset in a viewport, with one header row
 * and one header column. Returns the cell size and origin so callers can map
 * (r, c) → pixels without duplicating the arithmetic.
 */
export interface GridLayout {
  cellW: number;
  cellH: number;
  originX: number;
  originY: number;
  gap: number;
  headerW: number;
  headerH: number;
  /** Pixel box of data cell (r, c). */
  cellAt(r: number, c: number): CellBox;
}

export function layoutGrid(
  rows: number,
  cols: number,
  width: number,
  height: number,
  options: { padding?: number; gap?: number; maxCell?: number } = {},
): GridLayout {
  const padding = options.padding ?? 16;
  const gap = options.gap ?? 3;
  const maxCell = options.maxCell ?? 64;

  const availW = Math.max(0, width - padding * 2);
  const availH = Math.max(0, height - padding * 2);

  // +1 on each axis reserves a track for the header row/column.
  const cell = Math.max(
    12,
    Math.min(maxCell, (availW - gap * cols) / (cols + 1), (availH - gap * rows) / (rows + 1)),
  );
  const headerW = cell;
  const headerH = cell;

  const gridW = headerW + gap + cols * (cell + gap) - gap;
  const gridH = headerH + gap + rows * (cell + gap) - gap;

  const originX = padding + Math.max(0, (availW - gridW) / 2) + headerW + gap;
  const originY = padding + Math.max(0, (availH - gridH) / 2) + headerH + gap;

  return {
    cellW: cell,
    cellH: cell,
    originX,
    originY,
    gap,
    headerW,
    headerH,
    cellAt: (r, c) => ({
      x: originX + c * (cell + gap),
      y: originY + r * (cell + gap),
      w: cell,
      h: cell,
    }),
  };
}
