import { type Algorithm, AlgorithmCategory, type AlgorithmMeta } from '../types';
import type { DPInput, DPStep } from './DPStep';
import { DPTracer } from './DPTracer';

/**
 * Abstract base for every dynamic-programming algorithm.
 *
 * Template Method, matching the other families: the base owns the boilerplate
 * (build the tracer, emit `Init`, run, emit `Done`, snapshot the timeline) and
 * the subclass writes only the recurrence against the tracer API.
 *
 * A DP subclass is also responsible for generating its own instance from the
 * UI's size parameters, because the shape of the table is problem-specific —
 * a knapsack table is items × capacity, an LCS table is |A| × |B|. `makeInput`
 * is the seam for that.
 */
export abstract class DPAlgorithm implements Algorithm<DPInput, DPStep> {
  abstract readonly meta: AlgorithmMeta;

  /** Fill the table, then trace the optimal solution back out of it. */
  protected abstract solve(tracer: DPTracer): void;

  /**
   * Build a problem instance of roughly `size`.
   *
   * `random` is injected rather than called directly so the same algorithm can
   * produce a reproducible instance when a lesson or the race view supplies a
   * seeded generator.
   */
  abstract makeInput(size: number, random: () => number): DPInput;

  run(input: DPInput): DPStep[] {
    const tracer = new DPTracer(input);
    this.solve(tracer);
    tracer.done('table complete');
    return [...tracer.steps];
  }
}

export const DP_CATEGORY = AlgorithmCategory.DynamicProgramming;

/** Inclusive random integer helper shared by the family's generators. */
export function randInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}
