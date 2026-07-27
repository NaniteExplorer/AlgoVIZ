/**
 * The searching category's step vocabulary.
 *
 * A search run is encoded as an ordered list of `SearchStep`s — the only
 * contract between a search algorithm and the `SearchingVisualizer`. Steps
 * describe the *active window* under consideration, the *probe* currently being
 * compared to the target, ranges being *eliminated*, and the terminal outcome.
 */
import type { TracedStep } from '../types';

export enum SearchStepKind {
  /** Narrow the active candidate window to [lo, hi]. */
  Bounds = 'bounds',
  /** Compare the value at `index` against the target. */
  Probe = 'probe',
  /** Permanently rule out the inclusive range [from, to]. */
  Eliminate = 'eliminate',
  /** The target was found at `index`. */
  Found = 'found',
  /** The search finished without finding the target. */
  Exhausted = 'exhausted',
}

export interface SearchStep extends TracedStep {
  readonly kind: SearchStepKind;
  readonly index?: number;
  readonly lo?: number;
  readonly hi?: number;
  readonly from?: number;
  readonly to?: number;
  readonly note?: string;
}

/** Problem instance for the searching family: a sorted array + a target value. */
export interface SearchInput {
  readonly values: number[];
  readonly target: number;
}
