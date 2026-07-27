import type { DPModel } from '@/core/model/DPModel';
import { DPCellRole } from '@/core/model/DPModel';
import { Canvas2DVisualizer } from '../backend/Canvas2DVisualizer';
import type { Canvas2DFrameContext } from '../backend/Canvas2DBackend';
import { drawCell, drawHeader, layoutGrid, type GridLayout } from '../draw/cell';
import { arrow } from '../draw/shapes';
import { label } from '../draw/text';
import { canvasTheme, type Canvas2DTheme } from '../draw/theme2d';
import { dpPalette, type DPCellStyle } from './palette';

/**
 * Renders a {@link DPModel} as an animated table.
 *
 * A *pull* renderer, exactly like the 3D visualizers: each frame it reads the
 * model's current values and roles and eases every cell toward them. Because it
 * never touches the timeline, autoplay, single-stepping and scrubbing all
 * produce identical output.
 *
 * Per-cell fill is tweened rather than snapped. At 30 steps/second a hard cut
 * between colours strobes; easing over ~120ms reads as the table *filling in*,
 * which is the mental model we want a learner to leave with.
 */
/** How fast a cell eases into its new role (higher = snappier). */
const FILL_LAMBDA = 18;

export class DPVisualizer extends Canvas2DVisualizer {
  private theme: Canvas2DTheme = canvasTheme('dark');
  private palette = dpPalette('dark');
  private grid: GridLayout | null = null;

  /** Per-cell animation progress toward its current role, keyed "r:c". */
  private readonly ease = new Map<string, number>();
  private lastRole = new Map<string, DPCellRole>();

  constructor(private readonly model: DPModel) {
    super();
  }

  setTheme(theme: Canvas2DTheme, mode: 'light' | 'dark'): void {
    this.theme = theme;
    this.palette = dpPalette(mode);
  }

  /** Called when a new instance changes the table's dimensions. */
  rebuild(): void {
    this.ease.clear();
    this.lastRole.clear();
    this.invalidateLayout();
  }

  protected onAttach(): void {
    this.rebuild();
  }

  protected onDispose(): void {
    this.ease.clear();
    this.lastRole.clear();
    this.grid = null;
  }

  protected layout(width: number, height: number): void {
    const dense = this.model.rows * this.model.cols > 48;
    this.grid = layoutGrid(this.model.rows, this.model.cols, width, height, {
      padding: width < 640 ? 8 : 14,
      gap: dense || width < 640 ? 2 : 3,
      // Wide, short tables (LIS is 2 × n) would otherwise render as a thin
      // ribbon of enormous cells; the cap keeps them proportionate.
      maxCell: width < 640 ? 44 : 58,
    });
  }

  protected draw(ctx: Canvas2DFrameContext): void {
    const grid = this.grid;
    if (!grid || this.model.rows === 0) return;

    this.drawHeaders(ctx, grid);
    this.drawCells(ctx, grid);
    this.drawArrows(ctx, grid);
    this.drawTitle(ctx);
  }

  // ── Internals ───────────────────────────────────────────────────────

  private drawHeaders(ctx: Canvas2DFrameContext, grid: GridLayout): void {
    const cursor = this.model.cursor;

    for (let c = 0; c < this.model.cols; c += 1) {
      const box = grid.cellAt(0, c);
      drawHeader(
        ctx.ctx,
        { x: box.x, y: grid.originY - grid.headerH - grid.gap, w: box.w, h: grid.headerH },
        this.model.colLabels[c] ?? String(c),
        this.theme,
        cursor?.c === c,
      );
    }

    for (let r = 0; r < this.model.rows; r += 1) {
      const box = grid.cellAt(r, 0);
      drawHeader(
        ctx.ctx,
        { x: grid.originX - grid.headerW - grid.gap, y: box.y, w: grid.headerW, h: box.h },
        this.model.rowLabels[r] ?? String(r),
        this.theme,
        cursor?.r === r,
      );
    }
  }

  private drawCells(ctx: Canvas2DFrameContext, grid: GridLayout): void {
    for (let r = 0; r < this.model.rows; r += 1) {
      for (let c = 0; c < this.model.cols; c += 1) {
        const key = `${r}:${c}`;
        const role = this.model.roleAt(r, c);
        const style = this.palette[role];

        // Restart the ease whenever the role changes, so each transition gets
        // its own fade rather than inheriting the previous one's progress.
        if (this.lastRole.get(key) !== role) {
          this.lastRole.set(key, role);
          this.ease.set(key, 0);
        }
        const progress = advance(this.ease.get(key) ?? 1, ctx.dt);
        this.ease.set(key, progress);

        const value = this.model.valueAt(r, c);
        const decision = this.model.labelAt(r, c);

        drawCell(
          ctx.ctx,
          grid.cellAt(r, c),
          value === null ? null : formatValue(value),
          cellStyle(style, progress),
          this.theme,
        );

        if (decision) this.drawDecisionTag(ctx, grid, r, c, decision, style);
      }
    }
  }

  private drawDecisionTag(
    ctx: Canvas2DFrameContext,
    grid: GridLayout,
    r: number,
    c: number,
    text: string,
    style: DPCellStyle,
  ): void {
    const box = grid.cellAt(r, c);
    // Only legible above a certain cell size; below it the tag would collide
    // with the value, so it is dropped rather than overlapped.
    if (box.h < 30) return;
    label(ctx.ctx, text, box.x + box.w / 2, box.y + box.h - 6, {
      color: style.border,
      size: 8,
      weight: 600,
      alpha: 0.9,
    });
  }

  private drawArrows(ctx: Canvas2DFrameContext, grid: GridLayout): void {
    const glow = this.theme.glow;
    for (const { from, to } of this.model.arrows) {
      const a = grid.cellAt(from[0], from[1]);
      const b = grid.cellAt(to[0], to[1]);
      ctx.ctx.save();
      ctx.ctx.globalAlpha = 0.75;
      if (glow > 0) {
        ctx.ctx.shadowColor = this.theme.accent;
        ctx.ctx.shadowBlur = 8 * glow;
      }
      arrow(
        ctx.ctx,
        a.x + a.w / 2,
        a.y + a.h / 2,
        b.x + b.w / 2,
        b.y + b.h / 2,
        this.theme.accent,
        1.6,
        6,
      );
      ctx.ctx.restore();
    }
  }

  private drawTitle(ctx: Canvas2DFrameContext): void {
    if (!this.model.title) return;
    label(ctx.ctx, this.model.title, ctx.width / 2, 10, {
      color: this.theme.textMuted,
      size: 11,
      weight: 500,
      baseline: 'top',
    });
  }
}

/** Frame-rate independent approach to 1. */
function advance(current: number, dt: number): number {
  return Math.min(1, current + (1 - current) * (1 - Math.exp(-FILL_LAMBDA * dt)));
}

/**
 * Blend a role's style toward full strength as its ease progresses.
 *
 * Only the glow and opacity are animated; the fill colour itself switches
 * immediately, because cross-fading between two saturated role colours produces
 * a muddy intermediate that reads as a third, non-existent state.
 */
function cellStyle(style: DPCellStyle, progress: number) {
  return {
    fill: style.fill,
    border: style.border,
    text: style.text,
    glow: style.glow * progress,
    alpha: 0.55 + 0.45 * progress,
  };
}

function formatValue(value: number): string {
  if (value >= 999) return '∞';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
