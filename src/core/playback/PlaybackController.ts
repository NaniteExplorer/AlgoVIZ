/**
 * Generic, framework-agnostic playback engine for a precomputed step timeline.
 *
 * It is deliberately decoupled from both the algorithm that produced the steps
 * and the renderer that draws them. It drives any `StepConsumer` (today the
 * `ArrayModel`; tomorrow a graph/tree model) and exposes an observable snapshot
 * designed to plug straight into React's `useSyncExternalStore`.
 *
 * Scrubbing backwards is implemented by *rewind + replay-from-start*, which only
 * works because algorithms emit deterministic timelines and the model's `apply`
 * is a pure state transition. This trades a little CPU for total correctness and
 * zero inverse-step bookkeeping.
 */

export interface StepConsumer<TStep> {
  /** Apply a single step, advancing state forward. */
  apply(step: TStep): void;
  /** Return to the initial state (cursor = -1 equivalent). */
  rewind(): void;
}

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'complete';

export interface PlaybackSnapshot {
  status: PlaybackStatus;
  /** Index of the most recently applied step; -1 when nothing applied. */
  cursor: number;
  total: number;
  /** Playback rate in steps per second. */
  speed: number;
  /** 0..1 completion ratio for the scrubber. */
  progress: number;
  /** Narration attached to the current step, if any. */
  note?: string;
  /**
   * Pseudocode line the current step is executing, if the algorithm has been
   * annotated. `undefined` means "no listing" and the pane stays hidden.
   */
  line?: number;
  /** Live counters pulled from the model (comparisons, swaps, writes, …). */
  metrics: Record<string, number>;
}

export interface PlaybackOptions<TStep> {
  /** Pull live metrics from the model for the snapshot. */
  getMetrics: () => Record<string, number>;
  /** Extract a narration string from a step (kept generic over TStep). */
  getNote?: (step: TStep) => string | undefined;
  /** Extract the pseudocode line a step executes, for the synced code pane. */
  getLine?: (step: TStep) => number | undefined;
  /**
   * Observe every step as it is applied, in cursor order.
   *
   * Used to capture the metric time-series that powers the complexity charts.
   * Fires on forward playback, single-stepping and replay alike, so the series
   * is filled the first time each cursor is reached regardless of how the user
   * got there.
   */
  onStepApplied?: (cursor: number, step: TStep) => void;
  /** Initial speed in steps/sec. */
  speed?: number;
  minSpeed?: number;
  maxSpeed?: number;
}

const DEFAULTS = { speed: 30, minSpeed: 1, maxSpeed: 400 };
/** Clamp per-frame delta so a backgrounded tab can't avalanche thousands of steps. */
const MAX_FRAME_MS = 100;

export class PlaybackController<TStep> {
  private steps: TStep[] = [];
  private cursor = -1;
  private status: PlaybackStatus = 'idle';
  private speed: number;
  private readonly minSpeed: number;
  private readonly maxSpeed: number;
  private accumulatorMs = 0;

  private readonly listeners = new Set<() => void>();
  private cachedSnapshot: PlaybackSnapshot | null = null;

  constructor(
    private readonly model: StepConsumer<TStep>,
    private readonly options: PlaybackOptions<TStep>,
  ) {
    this.speed = options.speed ?? DEFAULTS.speed;
    this.minSpeed = options.minSpeed ?? DEFAULTS.minSpeed;
    this.maxSpeed = options.maxSpeed ?? DEFAULTS.maxSpeed;
  }

  // ── Timeline lifecycle ──────────────────────────────────────────────

  /** Install a fresh timeline and rewind to the start. */
  load(steps: TStep[]): void {
    this.steps = steps;
    this.cursor = -1;
    this.accumulatorMs = 0;
    this.status = 'idle';
    this.model.rewind();
    this.invalidate();
  }

  /** Rewind to the beginning, keeping the current timeline. */
  reset(): void {
    this.cursor = -1;
    this.accumulatorMs = 0;
    this.status = 'idle';
    this.model.rewind();
    this.invalidate();
  }

  // ── Transport controls ──────────────────────────────────────────────

  play(): void {
    if (!this.steps.length) return;
    if (this.cursor >= this.steps.length - 1) this.replayTo(-1); // restart at end
    this.status = 'playing';
    this.invalidate();
  }

  pause(): void {
    if (this.status === 'playing') {
      this.status = 'paused';
      this.invalidate();
    }
  }

  toggle(): void {
    if (this.status === 'playing') this.pause();
    else this.play();
  }

  stepForward(): void {
    if (this.cursor + 1 >= this.steps.length) {
      this.status = 'complete';
      this.invalidate();
      return;
    }
    this.cursor += 1;
    this.applyAt(this.cursor);
    this.status = this.cursor >= this.steps.length - 1 ? 'complete' : 'paused';
    this.invalidate();
  }

  stepBackward(): void {
    if (this.cursor < 0) return;
    this.replayTo(this.cursor - 1);
    this.status = 'paused';
    this.invalidate();
  }

  /** Jump to an absolute cursor position (e.g. from the scrubber). */
  seek(index: number): void {
    const target = Math.max(-1, Math.min(index, this.steps.length - 1));
    this.replayTo(target);
    this.status = target >= this.steps.length - 1 && target >= 0 ? 'complete' : 'paused';
    this.invalidate();
  }

  setSpeed(stepsPerSecond: number): void {
    this.speed = Math.max(this.minSpeed, Math.min(stepsPerSecond, this.maxSpeed));
    this.invalidate();
  }

  // ── Clock ───────────────────────────────────────────────────────────

  /**
   * Advance the timeline by a frame delta. Called by the render loop every
   * frame; only does work while playing. Returns true if any step was applied
   * (lets the caller know visual state changed).
   */
  advance(deltaMs: number): boolean {
    if (this.status !== 'playing') return false;

    this.accumulatorMs += Math.min(deltaMs, MAX_FRAME_MS);
    const msPerStep = 1000 / this.speed;
    let applied = false;

    while (this.accumulatorMs >= msPerStep) {
      if (this.cursor + 1 >= this.steps.length) {
        this.status = 'complete';
        this.accumulatorMs = 0;
        applied = true;
        break;
      }
      this.cursor += 1;
      this.applyAt(this.cursor);
      this.accumulatorMs -= msPerStep;
      applied = true;
    }

    if (applied) this.invalidate();
    return applied;
  }

  /** True once the final step has been applied. Used by the race view. */
  get isComplete(): boolean {
    return this.status === 'complete';
  }

  // ── Observable store (useSyncExternalStore-compatible) ──────────────

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): PlaybackSnapshot => {
    if (!this.cachedSnapshot) this.cachedSnapshot = this.buildSnapshot();
    return this.cachedSnapshot;
  };

  // ── Internals ───────────────────────────────────────────────────────

  private replayTo(index: number): void {
    this.model.rewind();
    for (let i = 0; i <= index; i += 1) this.applyAt(i);
    this.cursor = index;
    this.accumulatorMs = 0;
  }

  /**
   * The single place a step is ever applied.
   *
   * Funnelling `stepForward`, the play loop and `replayTo` through here is what
   * guarantees `onStepApplied` sees every cursor exactly as the model does —
   * important because scrubbing backwards replays from the start, and a
   * half-wired observer would end up with a series full of holes.
   */
  private applyAt(index: number): void {
    const step = this.steps[index];
    this.model.apply(step);
    this.options.onStepApplied?.(index, step);
  }

  private buildSnapshot(): PlaybackSnapshot {
    const total = this.steps.length;
    const current = this.cursor >= 0 ? this.steps[this.cursor] : undefined;
    return {
      status: this.status,
      cursor: this.cursor,
      total,
      speed: this.speed,
      progress: total ? (this.cursor + 1) / total : 0,
      note: current ? this.options.getNote?.(current) : undefined,
      line: current ? this.options.getLine?.(current) : undefined,
      metrics: this.options.getMetrics(),
    };
  }

  /** Mark the snapshot stale and notify subscribers (next read rebuilds it). */
  private invalidate(): void {
    this.cachedSnapshot = null;
    this.listeners.forEach((l) => l());
  }
}
