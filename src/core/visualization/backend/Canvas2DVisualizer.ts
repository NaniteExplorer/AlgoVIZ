import type { Canvas2DBackend, Canvas2DFrameContext } from './Canvas2DBackend';
import type { Renderable } from './RenderBackend';

/**
 * 2D counterpart of {@link Visualizer}.
 *
 * Subclasses implement `draw`, called once per frame with a cleared, DPR-
 * normalised context. `layout` runs on attach and on every viewport change, so
 * families can precompute cell geometry once instead of per frame.
 *
 * Note for implementors: `tsconfig` has `noUnusedParameters`, so prefix any
 * argument you genuinely don't need with an underscore (`layout(width, _height)`).
 */
export abstract class Canvas2DVisualizer implements Renderable<Canvas2DBackend> {
  protected backend: Canvas2DBackend | null = null;

  private unsubscribe: (() => void) | null = null;
  private lastWidth = -1;
  private lastHeight = -1;

  attach(backend: Canvas2DBackend): void {
    if (this.backend) this.detach();
    this.backend = backend;
    this.onAttach();
    this.unsubscribe = backend.onFrame((ctx) => this.frame(ctx));
  }

  detach(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.onDispose();
    this.backend = null;
    this.lastWidth = -1;
    this.lastHeight = -1;
  }

  /** Force a re-layout on the next frame (e.g. after the dataset changed shape). */
  invalidateLayout(): void {
    this.lastWidth = -1;
    this.lastHeight = -1;
  }

  // ── Subclass contract ───────────────────────────────────────────────

  /** Build any state that doesn't depend on the viewport. */
  protected abstract onAttach(): void;
  /** Recompute cached geometry for a new viewport size (CSS pixels). */
  protected abstract layout(width: number, height: number): void;
  /** Paint one frame. The context is already cleared and DPR-scaled. */
  protected abstract draw(ctx: Canvas2DFrameContext): void;
  /** Release anything not owned by the canvas itself. */
  protected abstract onDispose(): void;

  // ── Internals ───────────────────────────────────────────────────────

  private frame(ctx: Canvas2DFrameContext): void {
    if (ctx.width !== this.lastWidth || ctx.height !== this.lastHeight) {
      this.lastWidth = ctx.width;
      this.lastHeight = ctx.height;
      this.layout(ctx.width, ctx.height);
    }
    this.draw(ctx);
  }
}
