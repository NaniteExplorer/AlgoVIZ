import { StructureNodeRole, type StructureModel } from '@/core/model/StructureModel';
import { Canvas2DVisualizer } from '../backend/Canvas2DVisualizer';
import type { Canvas2DFrameContext } from '../backend/Canvas2DBackend';
import { arrow, circle, curve, fillRoundRect, strokeRoundRect } from '../draw/shapes';
import { halo, withAlpha } from '../draw/glow2d';
import { ellipsize, label, labelFitted } from '../draw/text';
import { canvasTheme, type Canvas2DTheme } from '../draw/theme2d';
import { LAYOUTS, type Point, type Viewport } from './layouts';
import { structurePalette, tagColor } from './palette';

const NODE_W = 46;
const NODE_H = 30;
/** How fast a node slides toward its new position (higher = snappier). */
const MOVE_LAMBDA = 11;

/**
 * Renders a {@link StructureModel} using whichever layout the family chose.
 *
 * Positions are **tweened, never snapped**. That single decision is what makes
 * this family teach anything: an AVL rotation animated as three nodes gliding
 * into new places reads as a local repair, whereas the same rotation drawn as
 * an instant cut reads as the tree being rebuilt from scratch. Same data,
 * opposite mental model.
 */
export class StructureVisualizer extends Canvas2DVisualizer {
  private theme: Canvas2DTheme = canvasTheme('dark');
  private mode: 'light' | 'dark' = 'dark';
  private palette = structurePalette('dark');

  private viewport: Viewport = { width: 0, height: 0 };
  /** Currently rendered position per node, eased toward the layout target. */
  private readonly rendered = new Map<number, Point>();

  constructor(private readonly model: StructureModel) {
    super();
  }

  setTheme(theme: Canvas2DTheme, mode: 'light' | 'dark'): void {
    this.theme = theme;
    this.mode = mode;
    this.palette = structurePalette(mode);
  }

  rebuild(): void {
    this.rendered.clear();
    this.invalidateLayout();
  }

  protected onAttach(): void {
    this.rebuild();
  }

  protected onDispose(): void {
    this.rendered.clear();
  }

  protected layout(width: number, height: number): void {
    this.viewport = { width, height };
  }

  protected draw(ctx: Canvas2DFrameContext): void {
    if (this.model.nodes.size === 0) {
      this.drawCaption(ctx);
      return;
    }

    const layoutFn = LAYOUTS[this.model.layout] ?? LAYOUTS.chain;
    const targets = layoutFn(this.model, this.viewport);
    this.ease(targets, ctx.dt);

    if (this.model.layout === 'buckets') this.drawBucketRows(ctx);
    if (this.model.layout === 'array') this.drawSlotRow(ctx, targets);

    this.drawLinks(ctx);
    this.drawNodes(ctx);
    this.drawCaption(ctx);
  }

  // ── Internals ───────────────────────────────────────────────────────

  /**
   * Move rendered positions toward the layout targets.
   *
   * A node appearing for the first time is placed directly at its target
   * rather than flying in from (0, 0) — an insertion should look like a node
   * appearing, not like one arriving from off-screen.
   */
  private ease(targets: Map<number, Point>, dt: number): void {
    const t = 1 - Math.exp(-MOVE_LAMBDA * dt);
    for (const [id, target] of targets) {
      const current = this.rendered.get(id);
      if (!current) {
        this.rendered.set(id, { ...target });
        continue;
      }
      current.x += (target.x - current.x) * t;
      current.y += (target.y - current.y) * t;
    }
    // Forget nodes that no longer exist, so a re-used id never inherits a
    // stale position.
    for (const id of [...this.rendered.keys()]) {
      if (!targets.has(id)) this.rendered.delete(id);
    }
  }

  private drawLinks(ctx: Canvas2DFrameContext): void {
    for (const link of this.model.links) {
      const from = this.rendered.get(link.from);
      const to = this.rendered.get(link.to);
      if (!from || !to) continue;

      const isChain = link.port === 'next';
      if (isChain) {
        // Pointer semantics deserve an arrowhead; tree edges do not need one.
        arrow(
          ctx.ctx,
          from.x + NODE_W / 2,
          from.y,
          to.x - NODE_W / 2 - 2,
          to.y,
          withAlpha(this.theme.accent, 0.75),
          1.5,
          6,
        );
      } else {
        curve(
          ctx.ctx,
          from.x,
          from.y + NODE_H / 2,
          to.x,
          to.y - NODE_H / 2,
          withAlpha(this.theme.lineStrong, 0.9),
          1.4,
          0.03,
        );
        // Trie edges are labelled with the character they consume.
        if (link.port.length === 1 && /[a-z]/i.test(link.port)) {
          label(ctx.ctx, link.port, (from.x + to.x) / 2 + 7, (from.y + to.y) / 2, {
            color: this.theme.textMuted,
            size: 9,
          });
        }
      }
    }
  }

  private drawNodes(ctx: Canvas2DFrameContext): void {
    const round = this.model.layout === 'tree';

    for (const node of this.model.nodes.values()) {
      const at = this.rendered.get(node.id);
      if (!at) continue;

      const role = this.model.roleAt(node.id);
      const style = this.palette[role];
      // A tag's own accent wins: "collision" and "found" mean opposite things
      // and must not share one colour.
      const border = tagColor(node.tag, this.mode) ?? style.border;
      const glow = style.glow * this.theme.glow;

      if (glow > 0) halo(ctx.ctx, at.x, at.y, NODE_W * 0.8, border, glow);

      if (round) {
        const radius = NODE_H / 2 + 2;
        circle(ctx.ctx, at.x, at.y, radius, style.fill);
        ctx.ctx.beginPath();
        ctx.ctx.arc(at.x, at.y, radius, 0, Math.PI * 2);
        ctx.ctx.strokeStyle = border;
        ctx.ctx.lineWidth = role === StructureNodeRole.Idle ? 1 : 2;
        ctx.ctx.stroke();
      } else {
        const x = at.x - NODE_W / 2;
        const y = at.y - NODE_H / 2;
        fillRoundRect(ctx.ctx, x, y, NODE_W, NODE_H, 6, style.fill);
        strokeRoundRect(
          ctx.ctx,
          x,
          y,
          NODE_W,
          NODE_H,
          6,
          border,
          role === StructureNodeRole.Idle ? 1 : 2,
        );
      }

      const text = node.label ?? String(node.value);
      labelFitted(ctx.ctx, text, at.x, at.y, NODE_W - 8, {
        color: style.text,
        size: 13,
        weight: 600,
      });
    }
  }

  /** Bucket index gutter for the chaining layout. */
  private drawBucketRows(ctx: Canvas2DFrameContext): void {
    const buckets = this.model.capacity;
    if (buckets <= 0) return;
    const rowHeight = Math.min(46, (this.viewport.height - 50) / buckets);

    for (let i = 0; i < buckets; i += 1) {
      const y = 34 + i * rowHeight;
      ctx.ctx.save();
      ctx.ctx.strokeStyle = withAlpha(this.theme.line, 0.8);
      ctx.ctx.lineWidth = 1;
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(38, y);
      ctx.ctx.lineTo(this.viewport.width - 8, y);
      ctx.ctx.stroke();
      ctx.ctx.restore();

      label(ctx.ctx, String(i), 24, y, { color: this.theme.textMuted, size: 10, weight: 600 });
    }
  }

  /** Empty-slot outlines for the open-addressing layout. */
  private drawSlotRow(ctx: Canvas2DFrameContext, targets: Map<number, Point>): void {
    const slots = this.model.capacity;
    if (slots <= 0) return;

    const occupied = new Set<number>();
    for (const node of this.model.nodes.values()) {
      if (node.slot !== undefined) occupied.add(node.slot);
    }

    const perRow = Math.max(1, Math.floor((this.viewport.width - 30) / 56));
    const cell = Math.min(56, (this.viewport.width - 30) / Math.min(slots, perRow));

    for (let slot = 0; slot < slots; slot += 1) {
      const row = Math.floor(slot / perRow);
      const col = slot % perRow;
      const cx = 26 + col * cell + cell / 2;
      const cy = 60 + row * 70;

      if (!occupied.has(slot)) {
        strokeRoundRect(
          ctx.ctx,
          cx - NODE_W / 2,
          cy - NODE_H / 2,
          NODE_W,
          NODE_H,
          6,
          withAlpha(this.theme.line, 0.9),
          1,
        );
      }
      label(ctx.ctx, String(slot), cx, cy + NODE_H / 2 + 10, {
        color: this.theme.textMuted,
        size: 9,
      });
    }
    void targets;
  }

  private drawCaption(ctx: Canvas2DFrameContext): void {
    const caption = this.model.caption || this.model.title;
    if (!caption) return;
    ctx.ctx.font = '11px sans-serif';
    label(ctx.ctx, ellipsize(ctx.ctx, caption, ctx.width - 24), ctx.width / 2, 10, {
      color: this.theme.textMuted,
      size: 11,
      weight: 500,
      baseline: 'top',
    });
  }
}
