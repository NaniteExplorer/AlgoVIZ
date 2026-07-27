import { BoardCellRole, type BacktrackModel, type TreeNode } from '@/core/model/BacktrackModel';
import { Canvas2DVisualizer } from '../backend/Canvas2DVisualizer';
import type { Canvas2DFrameContext } from '../backend/Canvas2DBackend';
import { drawCell, layoutGrid, type GridLayout } from '../draw/cell';
import { circle, curve } from '../draw/shapes';
import { ellipsize, label } from '../draw/text';
import { halo, withAlpha } from '../draw/glow2d';
import { canvasTheme, type Canvas2DTheme } from '../draw/theme2d';
import { boardPalette, nodePalette, type CellStyleSpec } from './palette';

/**
 * Split-pane renderer: the board on the left, the recursion tree on the right.
 *
 * Showing both at once is the entire point of the family. A board alone makes
 * backtracking look like guessing; a tree alone is abstract. Together, a
 * rejected branch on the right visibly corresponds to a value being erased on
 * the left, and the idea lands.
 *
 * The tree draws only the most recent slice of the search (the model already
 * bounds retention) and is scaled to fit, because an exhaustive run produces a
 * tree thousands of nodes wide that no amount of layout cleverness makes
 * readable.
 */
export class BacktrackVisualizer extends Canvas2DVisualizer {
  private static readonly NODE_RADIUS = 5;
  private static readonly LEVEL_GAP = 26;

  private theme: Canvas2DTheme = canvasTheme('dark');
  private board = boardPalette('dark');
  private nodes = nodePalette('dark');

  private grid: GridLayout | null = null;
  private boardWidth = 0;
  private treeX = 0;
  private treeWidth = 0;
  private viewHeight = 0;

  constructor(private readonly model: BacktrackModel) {
    super();
  }

  setTheme(theme: Canvas2DTheme, mode: 'light' | 'dark'): void {
    this.theme = theme;
    this.board = boardPalette(mode);
    this.nodes = nodePalette(mode);
  }

  rebuild(): void {
    this.invalidateLayout();
  }

  protected onAttach(): void {
    this.rebuild();
  }

  protected onDispose(): void {
    this.grid = null;
  }

  protected layout(width: number, height: number): void {
    this.viewHeight = height;
    // Give the board the left ~46%, but never let it get so narrow that cells
    // become unreadable on a phone; below that width the tree is dropped
    // entirely in `draw`.
    this.boardWidth = width < 460 ? width : Math.max(200, Math.round(width * 0.46));
    this.treeX = this.boardWidth + 12;
    this.treeWidth = Math.max(0, width - this.treeX - 8);

    this.grid = layoutGrid(this.model.height, this.model.width, this.boardWidth, height - 26, {
      padding: 12,
      gap: 3,
      maxCell: 52,
    });
  }

  protected draw(ctx: Canvas2DFrameContext): void {
    if (!this.grid || this.model.width === 0) return;
    this.drawBoard(ctx, this.grid);
    if (this.treeWidth > 120) this.drawTree(ctx);
    this.drawTitle(ctx);
  }

  // ── Board ───────────────────────────────────────────────────────────

  private drawBoard(ctx: Canvas2DFrameContext, grid: GridLayout): void {
    const towers = this.model.boardStyle === 'towers';
    if (towers) this.drawPegs(ctx, grid);

    for (let r = 0; r < this.model.height; r += 1) {
      for (let c = 0; c < this.model.width; c += 1) {
        const index = r * this.model.width + c;
        const role = this.model.roleAt(index);
        const value = this.model.valueAt(index);
        const style = this.board[role];
        const box = grid.cellAt(r, c);

        if (towers) {
          this.drawDisc(ctx, box, value, style);
          continue;
        }

        drawCell(ctx.ctx, box, this.cellText(role, value), toCellStyle(style), this.theme);
      }
    }
  }

  /** Chess boards read far better with the classic alternating squares. */
  private cellText(role: BoardCellRole, value: number): string | null {
    if (role === BoardCellRole.Wall) return null;
    if (value <= 0) return null;
    if (this.model.boardStyle === 'queens') return '♛';
    if (this.model.boardStyle === 'maze') return '•';
    return String(value);
  }

  private drawPegs(ctx: Canvas2DFrameContext, grid: GridLayout): void {
    for (let peg = 0; peg < 3; peg += 1) {
      const top = grid.cellAt(0, peg);
      const bottom = grid.cellAt(this.model.height - 1, peg);
      ctx.ctx.save();
      ctx.ctx.fillStyle = this.theme.line;
      ctx.ctx.fillRect(top.x + top.w / 2 - 1.5, top.y, 3, bottom.y + bottom.h - top.y);
      ctx.ctx.restore();
    }
  }

  /** A Hanoi disc's width encodes its size, which is the whole constraint. */
  private drawDisc(
    ctx: Canvas2DFrameContext,
    box: { x: number; y: number; w: number; h: number },
    value: number,
    style: CellStyleSpec,
  ): void {
    if (value <= 0) return;
    const fraction = value / Math.max(1, this.model.height);
    const w = box.w * (0.3 + 0.7 * fraction);
    const x = box.x + (box.w - w) / 2;
    drawCell(
      ctx.ctx,
      { x, y: box.y + 2, w, h: box.h - 4 },
      String(value),
      toCellStyle(style),
      this.theme,
    );
  }

  // ── Recursion tree ──────────────────────────────────────────────────

  /**
   * Lay the tree out by depth, packing each level horizontally.
   *
   * A proper Reingold–Tilford layout would be prettier, but the tree changes
   * every single frame and is bounded to a few hundred visible nodes; a stable
   * depth-bucketed packing is both cheaper and — more importantly — doesn't
   * make nodes jump sideways as siblings appear and vanish.
   */
  private drawTree(ctx: Canvas2DFrameContext): void {
    const nodes = [...this.model.nodes.values()];
    if (nodes.length === 0) return;

    const activePath = new Set(this.model.activePath);
    const maxDepth = Math.max(...nodes.map((n) => n.depth));
    const byDepth = new Map<number, TreeNode[]>();
    for (const node of nodes) {
      const bucket = byDepth.get(node.depth);
      if (bucket) bucket.push(node);
      else byDepth.set(node.depth, [node]);
    }

    const levelGap = Math.min(
      BacktrackVisualizer.LEVEL_GAP,
      (this.viewHeight - 40) / Math.max(1, maxDepth),
    );

    const positions = new Map<number, { x: number; y: number }>();
    for (const [depth, level] of byDepth) {
      const slot = this.treeWidth / (level.length + 1);
      level.forEach((node, i) => {
        positions.set(node.id, {
          x: this.treeX + slot * (i + 1),
          y: 26 + (depth - 1) * levelGap,
        });
      });
    }

    // Edges first so nodes sit on top of them.
    ctx.ctx.save();
    for (const node of nodes) {
      const to = positions.get(node.id);
      const from = node.parent !== undefined ? positions.get(node.parent) : undefined;
      if (!to || !from) continue;
      const onPath = activePath.has(node.id) && activePath.has(node.parent as number);
      curve(
        ctx.ctx,
        from.x,
        from.y,
        to.x,
        to.y,
        onPath ? this.theme.accent : withAlpha(this.theme.line, 0.9),
        onPath ? 1.8 : 1,
        0.04,
      );
    }
    ctx.ctx.restore();

    for (const node of nodes) {
      const at = positions.get(node.id);
      if (!at) continue;
      const color = this.nodes[node.status];
      const active = activePath.has(node.id);
      const radius = active ? BacktrackVisualizer.NODE_RADIUS + 1.5 : BacktrackVisualizer.NODE_RADIUS;

      if (active) halo(ctx.ctx, at.x, at.y, radius * 3.5, color, this.theme.glow);
      circle(ctx.ctx, at.x, at.y, radius, color);

      // Only the current stack gets labels; labelling everything turns the
      // pane into noise the moment the tree is more than a few nodes wide.
      if (active && node.choice) {
        ctx.ctx.font = '9px sans-serif';
        label(ctx.ctx, ellipsize(ctx.ctx, node.choice, 60), at.x + radius + 4, at.y, {
          color: this.theme.textMuted,
          size: 9,
          align: 'left',
        });
      }
    }

    label(ctx.ctx, 'recursion tree', this.treeX + this.treeWidth / 2, 10, {
      color: this.theme.textMuted,
      size: 10,
      baseline: 'top',
    });

    if (this.model.droppedNodes > 0) {
      label(
        ctx.ctx,
        `+${this.model.droppedNodes.toLocaleString()} earlier nodes not shown`,
        this.treeX + this.treeWidth / 2,
        this.viewHeight - 8,
        { color: this.theme.textMuted, size: 9, baseline: 'bottom', alpha: 0.8 },
      );
    }
  }

  private drawTitle(ctx: Canvas2DFrameContext): void {
    if (!this.model.title) return;
    label(ctx.ctx, this.model.title, this.boardWidth / 2, 10, {
      color: this.theme.textMuted,
      size: 11,
      weight: 500,
      baseline: 'top',
    });
  }
}

function toCellStyle(style: CellStyleSpec) {
  return { fill: style.fill, border: style.border, text: style.text, glow: style.glow };
}
