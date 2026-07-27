import type { VisualizerLane } from '@/core/visualization/VisualizerLane';
import type { PlaybackSnapshot, PlaybackStatus } from './PlaybackController';

export interface LaneSnapshot extends PlaybackSnapshot {
  laneId: string;
  algorithmId: string;
  name: string;
  accent: string;
  /** 1-based finishing position, or undefined while still running. */
  place?: number;
}

export interface RaceSnapshot {
  status: PlaybackStatus;
  /** Shared playback rate, in steps per second. */
  speed: number;
  lanes: LaneSnapshot[];
  /** Lane ids in the order they completed. */
  finishOrder: string[];
}

/**
 * One clock, several timelines.
 *
 * The fairness argument is the whole design: every lane advances at the *same
 * steps per second*, so a lane that needs four times as many steps takes four
 * times as long. That is precisely the lesson — comparing wall-clock time
 * between algorithms running at different rates would measure nothing.
 *
 * Seeking is by fraction rather than by index, because lanes have different
 * timeline lengths and "step 400" means something different in each.
 */
export class RaceController {
  private status: PlaybackStatus = 'idle';
  private speed = 30;
  private readonly finishOrder: string[] = [];
  private readonly listeners = new Set<() => void>();
  private cached: RaceSnapshot | null = null;

  constructor(private readonly lanes: readonly VisualizerLane[]) {
    for (const lane of lanes) lane.setSpeed(this.speed);
  }

  // ── Transport ───────────────────────────────────────────────────────

  play(): void {
    // Restarting from a finished race must clear the podium, or the next run
    // shows last time's results.
    if (this.status === 'complete') this.reset();
    this.status = 'playing';
    for (const lane of this.lanes) lane.controller.play();
    this.invalidate();
  }

  pause(): void {
    if (this.status !== 'playing') return;
    this.status = 'paused';
    for (const lane of this.lanes) lane.controller.pause();
    this.invalidate();
  }

  toggle(): void {
    if (this.status === 'playing') this.pause();
    else this.play();
  }

  reset(): void {
    this.status = 'idle';
    this.finishOrder.length = 0;
    for (const lane of this.lanes) lane.controller.reset();
    this.invalidate();
  }

  stepForward(): void {
    for (const lane of this.lanes) lane.controller.stepForward();
    this.status = 'paused';
    this.recordFinishes();
    this.invalidate();
  }

  stepBackward(): void {
    for (const lane of this.lanes) lane.controller.stepBackward();
    this.status = 'paused';
    // Stepping back un-finishes any lane that was at its end.
    this.finishOrder.length = 0;
    this.invalidate();
  }

  /** Seek every lane to the same *fraction* of its own timeline. */
  seek(fraction: number): void {
    const clamped = Math.max(0, Math.min(1, fraction));
    for (const lane of this.lanes) {
      const snapshot = lane.controller.getSnapshot();
      lane.controller.seek(Math.round(clamped * snapshot.total) - 1);
    }
    this.status = clamped >= 1 ? 'complete' : 'paused';
    this.finishOrder.length = 0;
    this.recordFinishes();
    this.invalidate();
  }

  setSpeed(stepsPerSecond: number): void {
    this.speed = stepsPerSecond;
    for (const lane of this.lanes) lane.setSpeed(stepsPerSecond);
    this.invalidate();
  }

  // ── Clock ───────────────────────────────────────────────────────────

  /**
   * Advance every lane by the same delta.
   *
   * Driven by lane 0's backend frame loop, which is the single time source for
   * the whole race.
   */
  advance(deltaMs: number): void {
    if (this.status !== 'playing') return;

    let anyApplied = false;
    for (const lane of this.lanes) if (lane.advance(deltaMs)) anyApplied = true;

    this.recordFinishes();
    if (this.lanes.every((lane) => lane.controller.isComplete)) this.status = 'complete';
    if (anyApplied) this.invalidate();
  }

  // ── Observable store ────────────────────────────────────────────────

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): RaceSnapshot => {
    if (!this.cached) this.cached = this.build();
    return this.cached;
  };

  // ── Internals ───────────────────────────────────────────────────────

  /** Append newly finished lanes, preserving the order they crossed the line. */
  private recordFinishes(): void {
    for (const lane of this.lanes) {
      if (lane.controller.isComplete && !this.finishOrder.includes(lane.id)) {
        this.finishOrder.push(lane.id);
      }
    }
  }

  private build(): RaceSnapshot {
    return {
      status: this.status,
      speed: this.speed,
      finishOrder: [...this.finishOrder],
      lanes: this.lanes.map((lane) => {
        const snapshot = lane.controller.getSnapshot();
        const place = this.finishOrder.indexOf(lane.id);
        return {
          ...snapshot,
          laneId: lane.id,
          algorithmId: lane.currentAlgorithmId,
          name: lane.meta?.name ?? lane.currentAlgorithmId,
          accent: lane.meta?.accent ?? '#22d3ee',
          place: place >= 0 ? place + 1 : undefined,
        };
      }),
    };
  }

  private invalidate(): void {
    this.cached = null;
    this.listeners.forEach((l) => l());
  }
}

/**
 * Hard cap on concurrent lanes.
 *
 * Browsers allow only a limited number of live WebGL contexts (typically 8–16)
 * and silently kill the oldest when the limit is passed — which manifests as a
 * lane going black for no visible reason. Four is comfortably clear of that,
 * and more than four side-by-side animations is unreadable anyway.
 */
export const MAX_LANES = 4;
