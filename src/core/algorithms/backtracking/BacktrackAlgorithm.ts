import { type Algorithm, AlgorithmCategory, type AlgorithmMeta } from '../types';
import type { BacktrackInput, BacktrackStep } from './BacktrackStep';
import { BacktrackTracer } from './BacktrackTracer';

/**
 * Abstract base for every backtracking algorithm.
 *
 * Same Template Method shape as the other families. As with DP, the subclass
 * generates its own instance, because board shapes differ wildly across the
 * family — an 8×8 chess board, a 9×9 Sudoku, a 15×15 maze and a single row of
 * subset flags have nothing in common except being rectangular.
 */
export abstract class BacktrackAlgorithm implements Algorithm<BacktrackInput, BacktrackStep> {
  abstract readonly meta: AlgorithmMeta;

  /** The search itself, written against the tracer. */
  protected abstract search(tracer: BacktrackTracer): void;

  /** Build a problem instance of roughly `size`. */
  abstract makeInput(size: number, random: () => number): BacktrackInput;

  run(input: BacktrackInput): BacktrackStep[] {
    const tracer = new BacktrackTracer(input);
    this.search(tracer);
    tracer.done(tracer.isTruncated ? 'search truncated — too many steps to show' : 'search complete');
    return [...tracer.steps];
  }
}

export const BACKTRACKING_CATEGORY = AlgorithmCategory.Backtracking;

export function randInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}
