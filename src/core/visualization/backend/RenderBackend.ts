/**
 * The renderer seam.
 *
 * AlgoVIZ started as a pure WebGL platform, but several algorithm families —
 * dynamic-programming tables, recursion trees, hash buckets, linked lists —
 * read far better as crisp 2D diagrams than as bloom-lit 3D scenes. Rather than
 * bending every family into Three.js (or forking the whole visualization stack),
 * we describe what the render layer actually owes the rest of the app: a mounted
 * surface, a frame clock, and deterministic teardown.
 *
 * Both {@link VisualizationEngine} (WebGL) and {@link Canvas2DBackend} implement
 * this, so `useVisualizer` never learns which one it is holding.
 */

/** Per-frame context handed to every tick subscriber. Backends extend this. */
export interface FrameContext {
  /** Seconds since the previous frame (clamped, so a backgrounded tab can't jump). */
  readonly dt: number;
  /** Seconds since the backend started. */
  readonly elapsed: number;
}

/**
 * A mounted rendering surface with its own animation loop.
 *
 * Lifecycle is always `new` → `mount(container)` → … → `dispose()`, and
 * `dispose()` must be idempotent: React 19 StrictMode double-invokes effects in
 * development, so a backend that throws or double-frees on the second call will
 * only break in dev, which is the worst place to find out.
 */
export interface RenderBackend<TFrame extends FrameContext = FrameContext> {
  /** Attach the surface to the DOM, wire resize handling, and start the loop. */
  mount(container: HTMLElement): void;
  /** Subscribe a per-frame callback. Returns an unsubscribe fn. */
  onFrame(fn: (ctx: TFrame) => void): () => void;
  /** Release every DOM/GPU resource. Safe to call more than once. */
  dispose(): void;
}

/**
 * Anything that binds itself to a backend for its lifetime — i.e. a visualizer.
 * Kept separate from {@link RenderBackend} because the binding is many-to-one:
 * a backend hosts the surface, a renderable draws into it.
 */
export interface Renderable<TBackend extends RenderBackend = RenderBackend> {
  attach(backend: TBackend): void;
  detach(): void;
}
