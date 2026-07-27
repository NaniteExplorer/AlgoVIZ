import { algorithmRegistry, type AlgorithmCategory, type AlgorithmMeta } from '@/core/algorithms';
import { MetricSeries } from '@/core/analysis/MetricSeries';
import { PlaybackController } from '@/core/playback/PlaybackController';
import type { SceneTheme } from '@/theme';
import type { CategoryModule } from './CategoryModule';
import type { RenderBackend } from './backend/RenderBackend';
import { VisualizerFactory } from './VisualizerFactory';

export interface LaneOptions {
  /**
   * Whether the lane drives its own playback from its backend's frame clock.
   *
   * False in a race, where a single {@link RaceController} owns the clock and
   * fans one delta out to every lane — the only way the comparison is fair.
   */
  selfClocked?: boolean;
}

/**
 * One independent visualization: module, model, controller, series, backend.
 *
 * Extracted from the body of `useVisualizer` so a single mechanism can host
 * one lane (the studio) or several (the race view) with identical lifecycle
 * semantics. Everything that made the studio work — deterministic replay,
 * metric capture, theme following — comes along for free.
 */
export class VisualizerLane {
  readonly module: CategoryModule;
  readonly controller: PlaybackController<unknown>;
  readonly series: MetricSeries;

  private backend: RenderBackend | null = null;
  private unsubscribe: (() => void) | null = null;
  private algorithmId: string;
  private disposed = false;

  constructor(
    readonly id: string,
    readonly category: AlgorithmCategory,
    algorithmId: string,
    private readonly options: LaneOptions = {},
  ) {
    this.module = VisualizerFactory.create(category);
    this.algorithmId = algorithmId;
    this.series = new MetricSeries(this.module.metricSpecs.map((m) => m.key));
    this.controller = new PlaybackController<unknown>(this.module.model, {
      getMetrics: () => this.module.metrics(),
      getNote: (step) => this.module.describe(step),
      getLine: (step) => this.module.lineOf(step),
      onStepApplied: (cursor) => this.series.record(cursor, this.module.metrics()),
      speed: 30,
    });
  }

  get meta(): AlgorithmMeta | undefined {
    return algorithmRegistry.get(this.algorithmId)?.meta;
  }

  get currentAlgorithmId(): string {
    return this.algorithmId;
  }

  /** Mount into a container and start rendering. */
  mount(container: HTMLElement): void {
    if (this.disposed) return;
    this.backend = this.module.createBackend();
    this.backend.mount(container);
    this.module.attachTo(this.backend);

    if (this.options.selfClocked !== false) {
      this.unsubscribe = this.backend.onFrame((ctx) => this.controller.advance(ctx.dt * 1000));
    }
  }

  /** Subscribe to this lane's frame clock — the race uses lane 0 as its clock. */
  onFrame(fn: (dtMs: number) => void): () => void {
    if (!this.backend) return () => {};
    return this.backend.onFrame((ctx) => fn(ctx.dt * 1000));
  }

  /** Generate a fresh instance and rebuild the timeline. */
  regenerate(params: Record<string, number>, seed?: number): void {
    this.module.applyPreset({ params, seed });
    this.module.rebuild();
    this.reload();
  }

  /**
   * Adopt an instance produced elsewhere.
   *
   * This is what makes a race meaningful: every lane runs a different algorithm
   * against byte-for-byte the same problem.
   */
  useInstance(input: unknown): void {
    this.module.setInstance(input);
    this.module.rebuild();
    this.reload();
  }

  selectAlgorithm(id: string): void {
    this.algorithmId = id;
    this.reload();
  }

  setSpeed(stepsPerSecond: number): void {
    this.controller.setSpeed(stepsPerSecond);
  }

  setTheme(theme: SceneTheme): void {
    this.module.setTheme(theme);
  }

  /** Advance this lane's timeline. Called by the owning clock in a race. */
  advance(deltaMs: number): boolean {
    return this.controller.advance(deltaMs);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.module.detach();
    this.backend?.dispose();
    this.backend = null;
  }

  private reload(): void {
    const algorithm = algorithmRegistry.require(this.algorithmId);
    const steps = this.module.buildTimeline(algorithm);
    this.series.reset(steps.length, this.module.metricSpecs.map((m) => m.key));
    this.controller.load(steps);
  }
}
