import type { FrameContext, RenderBackend } from './RenderBackend';

/** Frame context for 2D families: a cleared, DPR-normalised drawing context. */
export interface Canvas2DFrameContext extends FrameContext {
  readonly ctx: CanvasRenderingContext2D;
  /** Viewport width in **CSS pixels** — draw in CSS px, the DPR scale is applied for you. */
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
}

export interface Canvas2DOptions {
  /** Fill applied before each frame; `null` clears to transparent. */
  background?: string | null;
  /** Cap the device pixel ratio. 2 keeps 3x phones from rendering 9x the pixels. */
  maxDpr?: number;
}

type TickFn = (ctx: Canvas2DFrameContext) => void;

/**
 * Immediate-mode 2D rendering backend.
 *
 * Deliberately has **no retained scene graph**. DP tables, recursion trees and
 * data-structure diagrams are cheap to redraw wholesale, and redrawing from the
 * model every frame means the picture can never drift out of sync with playback
 * state — which is the same "read the model each frame" contract the WebGL
 * visualizers already follow, just without the bookkeeping.
 *
 * Mirrors {@link VisualizationEngine}'s lifecycle exactly so the two are
 * interchangeable behind {@link RenderBackend}.
 */
export class Canvas2DBackend implements RenderBackend<Canvas2DFrameContext> {
  readonly canvas: HTMLCanvasElement;

  private readonly ctx: CanvasRenderingContext2D;
  private readonly tickFns = new Set<TickFn>();
  private readonly options: Required<Canvas2DOptions>;

  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private rafId = 0;
  private lastTime = 0;
  private elapsed = 0;
  private running = false;
  private disposed = false;
  private paused = false;

  private width = 0;
  private height = 0;
  private dpr = 1;

  constructor(options: Canvas2DOptions = {}) {
    this.options = {
      background: options.background ?? null,
      maxDpr: options.maxDpr ?? 2,
    };

    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {
      display: 'block',
      width: '100%',
      height: '100%',
    });

    const ctx = this.canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Canvas2DBackend: 2D context unavailable.');
    this.ctx = ctx;
  }

  mount(container: HTMLElement): void {
    if (this.disposed) return;
    this.container = container;
    container.appendChild(this.canvas);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.start();
  }

  onFrame(fn: TickFn): () => void {
    this.tickFns.add(fn);
    return () => {
      this.tickFns.delete(fn);
    };
  }

  /** Freeze the loop without tearing down (off-screen stage, hidden tab). */
  setPaused(paused: boolean): void {
    this.paused = paused;
    // Reset the clock so resuming doesn't deliver one enormous dt.
    if (!paused) this.lastTime = performance.now();
  }

  /** Swap the backdrop when the app theme changes. */
  setBackground(background: string | null): void {
    this.options.background = background;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.stop();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.tickFns.clear();

    if (this.canvas.parentElement === this.container) {
      this.container?.removeChild(this.canvas);
    }
    // Safari holds onto the backing store until the dimensions are zeroed.
    this.canvas.width = 0;
    this.canvas.height = 0;
    this.container = null;
  }

  // ── Internals ───────────────────────────────────────────────────────

  private start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();

    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      if (!this.paused) {
        this.elapsed += dt;
        this.renderFrame(dt);
      }

      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private renderFrame(dt: number): void {
    const { ctx, width, height } = this;
    if (width === 0 || height === 0) return;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    if (this.options.background) {
      ctx.fillStyle = this.options.background;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();

    const frame: Canvas2DFrameContext = {
      dt,
      elapsed: this.elapsed,
      ctx,
      width,
      height,
      dpr: this.dpr,
    };
    // Each subscriber gets a pristine context; nobody has to clean up after
    // a sibling's transform or clip.
    this.tickFns.forEach((fn) => {
      ctx.save();
      fn(frame);
      ctx.restore();
    });
  }

  private resize(): void {
    if (!this.container) return;
    const { clientWidth: w, clientHeight: h } = this.container;
    if (w === 0 || h === 0) return;

    this.dpr = Math.min(globalThis.devicePixelRatio ?? 1, this.options.maxDpr);
    this.width = w;
    this.height = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    // Draw in CSS pixels; the transform absorbs the DPR scale.
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
}
