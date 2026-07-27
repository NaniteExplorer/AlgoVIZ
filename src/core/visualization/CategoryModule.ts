import type { AnyAlgorithm } from '@/core/algorithms';
import type { SceneTheme } from '@/theme';
import type { StepConsumer } from '@/core/playback/PlaybackController';
import type { BackendSpec } from './backend/BackendSpec';
import type { RenderBackend } from './backend/RenderBackend';

/**
 * Declarative description of one interactive parameter (rendered as a slider in
 * the control panel). Each family exposes its own set — "Array size" for
 * sorting/searching, "Nodes"/"Density" for graphs, "Values" for trees — and the
 * UI renders them generically, so the chrome never hard-codes any family.
 */
export interface ControlSpec {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  suffix?: string;
}

/** A coloured entry in the on-canvas legend. */
export interface LegendItem {
  color: string;
  label: string;
}

/** A live counter surfaced in the canvas HUD (e.g. comparisons, visited). */
export interface MetricSpec {
  key: string;
  label: string;
}

/** A reproducible starting point — used by lessons and by the race view. */
export interface Preset {
  params: Record<string, number>;
  /** Seed for the family's generator; identical seeds must yield identical inputs. */
  seed?: number;
}

/**
 * A self-contained rendering + input driver for a single algorithm family.
 *
 * This is the platform's universal extension seam. It bundles everything that
 * is *category-specific* — the model (a {@link StepConsumer}), the renderer,
 * random input generation, per-step narration, and the UI metadata (controls,
 * legend, metrics) — behind one interface. The React hook (`useVisualizer`), the
 * playback controller and every chrome component are built purely against this
 * contract, so adding a family never touches a line of generic code: implement a
 * `CategoryModule`, then add one `case` to {@link VisualizerFactory}.
 *
 * The module also *owns its backend*. That keeps backend-specific types from
 * leaking upward — the hook only ever holds a {@link RenderBackend} — and is
 * what lets 2D families (DP tables, recursion trees, data structures) coexist
 * with the WebGL ones without any conditional logic in the chrome.
 *
 * Lifecycle the hook drives per dataset:
 *   `regenerate(params)` → `rebuild()` → `buildTimeline(algorithm)` → load.
 *
 * Most families should extend {@link WebGLCategoryModule} or
 * {@link Canvas2DCategoryModule} rather than this class directly.
 */
export abstract class CategoryModule<TStep = unknown, TInput = unknown> {
  /** Which renderer this family needs, and how to configure it. */
  abstract readonly backend: BackendSpec;
  /** Interactive sliders this family exposes beyond the universal speed slider. */
  abstract readonly controls: ControlSpec[];
  /** Counters shown in the HUD, in display order. */
  abstract readonly metricSpecs: MetricSpec[];
  /** The pure state machine the playback controller drives. */
  abstract readonly model: StepConsumer<TStep>;

  // ── Rendering ───────────────────────────────────────────────────────

  /** Instantiate the backend this family renders into. */
  abstract createBackend(): RenderBackend;
  /** Bind this family's visualizer to a backend returned by `createBackend`. */
  abstract attachTo(backend: RenderBackend): void;
  /** Unbind the visualizer. The caller disposes the backend separately. */
  abstract detach(): void;
  /** Re-layout the scene to match the current instance (after `regenerate`). */
  abstract rebuild(): void;

  // ── Data ────────────────────────────────────────────────────────────

  /** Live metric values for the current model state. */
  abstract metrics(): Record<string, number>;
  /** Colour key explaining the scene's highlight palette. */
  abstract legend(): LegendItem[];
  /**
   * Generate a fresh problem instance from `params` and load it into the model.
   * Must leave the model at its initial (pre-run) state.
   */
  abstract regenerate(params: Record<string, number>): void;
  /** Run `algorithm` against the *current* instance and return its timeline. */
  abstract buildTimeline(algorithm: AnyAlgorithm): TStep[];
  /** One-line narration for the step inspector. */
  abstract describe(step: TStep): string;

  /**
   * The current problem instance.
   *
   * Must return plain, structured-cloneable data: the race view clones one
   * lane's instance into the others so every algorithm is judged on identical
   * input, and lessons persist instances to reproduce a scenario exactly.
   */
  abstract getInstance(): TInput;
  /** Install an externally supplied instance in place of a generated one. */
  abstract setInstance(input: TInput): void;

  // ── Optional hooks ──────────────────────────────────────────────────

  /**
   * Restore a reproducible starting point. Default regenerates from `params`;
   * families with a seedable generator should override to honour `seed`.
   */
  applyPreset(preset: Preset): void {
    this.regenerate(preset.params);
  }

  /**
   * Pseudocode line this step maps to, if the algorithm opted in.
   *
   * The default reads a structural `line` field, so no family needs to override
   * it — which is what makes pseudocode an additive, per-algorithm migration
   * rather than a breaking change across all of them.
   */
  lineOf(step: TStep): number | undefined {
    return (step as { line?: number } | null)?.line;
  }

  /** Follow an app theme change. Default is a no-op. */
  setTheme(_theme: SceneTheme): void {
    /* families opt in by overriding */
  }
}
