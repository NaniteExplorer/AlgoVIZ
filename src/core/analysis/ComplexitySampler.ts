import type { AnyAlgorithm, AlgorithmCategory } from '@/core/algorithms';
import { VisualizerFactory } from '@/core/visualization/VisualizerFactory';
import type { Sample } from './ComplexityModel';

export interface SweepResult extends Sample {
  /** Terminal metric values at this size. */
  metrics: Record<string, number>;
}

/**
 * Headless empirical sweep: run an algorithm at increasing problem sizes and
 * record how much work it actually did.
 *
 * Two design notes worth keeping:
 *
 * 1. It builds a **throwaway module with no backend attached**. That is only
 *    possible because Phase 1 separated instance generation from rendering —
 *    the module can generate inputs and build timelines without ever touching
 *    a canvas or a GPU context.
 * 2. It runs **time-sliced on the main thread**, not in a Worker. The
 *    algorithms are pure and the sweep sizes are bounded, so a Worker would buy
 *    nothing but bundle weight and a serialization boundary around the
 *    generator — which is the one thing that genuinely cannot be serialised.
 */
export class ComplexitySampler {
  /** Milliseconds of work per slice before yielding back to the browser. */
  private static readonly SLICE_MS = 12;

  private cancelled = false;

  constructor(
    private readonly category: AlgorithmCategory,
    private readonly algorithm: AnyAlgorithm,
    /** Control key the module uses for problem size. */
    private readonly sizeKey: string,
  ) {}

  /**
   * Sweep `sizes`, invoking `onProgress` after each slice and `onDone` at the
   * end. Returns a cancel function.
   */
  run(
    sizes: readonly number[],
    onProgress: (results: SweepResult[]) => void,
    onDone?: (results: SweepResult[]) => void,
  ): () => void {
    const results: SweepResult[] = [];
    let index = 0;

    // One module for the whole sweep. Reusing it is safe because each
    // `regenerate` fully resets the model, and it avoids re-allocating a
    // visualizer per size.
    const probe = VisualizerFactory.create(this.category);

    const slice = () => {
      if (this.cancelled) return;

      const started = performance.now();
      while (index < sizes.length && performance.now() - started < ComplexitySampler.SLICE_MS) {
        const n = sizes[index];
        index += 1;
        try {
          probe.regenerate({ [this.sizeKey]: n });
          const steps = probe.buildTimeline(this.algorithm);
          results.push({ n, value: steps.length, metrics: probe.metrics() });
        } catch {
          // A size an algorithm can't handle (a 1-element graph, say) is worth
          // skipping, not worth aborting the whole sweep for.
        }
      }

      onProgress([...results]);
      if (index < sizes.length) {
        requestAnimationFrame(slice);
      } else {
        onDone?.([...results]);
      }
    };

    requestAnimationFrame(slice);
    return () => {
      this.cancelled = true;
    };
  }
}

/**
 * Sizes to sample between `min` and `max`.
 *
 * Spread geometrically rather than evenly: distinguishing O(n) from O(n log n)
 * needs a wide *ratio* of sizes, and evenly spaced points cluster all the
 * information at the top of the range.
 */
export function sweepSizes(min: number, max: number, count = 9): number[] {
  if (max <= min) return [min];
  const sizes = new Set<number>();
  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1);
    sizes.add(Math.round(min * (max / min) ** t));
  }
  return [...sizes].sort((a, b) => a - b);
}
