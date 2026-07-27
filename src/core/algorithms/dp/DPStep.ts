import type { TracedStep } from '../types';

/**
 * The dynamic-programming category's step vocabulary.
 *
 * Every DP algorithm in this family, whatever its recurrence, does the same
 * four things to a table: look at some cells, decide something, write a cell,
 * and — once the table is full — walk backwards through it to recover the
 * actual answer. Encoding exactly that makes one renderer serve knapsack, LCS,
 * edit distance and Floyd–Warshall alike.
 *
 * `Read` and `Write` are separate steps rather than one combined "evaluate"
 * because the whole insight of DP is *which previously-computed cells this one
 * depends on*. Showing the reads is the lesson.
 */
export enum DPStepKind {
  /** Allocate/clear the table. Always the first step of a run. */
  Init = 'init',
  /** Read cell (r, c) as an input to the current recurrence evaluation. */
  Read = 'read',
  /** Write `value` into (r, c); `from` lists the cells it was derived from. */
  Write = 'write',
  /** Move the cursor to the cell currently being decided. */
  Focus = 'focus',
  /** Mark (r, c) as part of the reconstructed optimal solution. */
  Trace = 'trace',
  /** Attach a decision label to the focused cell ("take", "skip", "match"). */
  Decide = 'decide',
  /** The run is finished. */
  Done = 'done',
}

export interface DPStep extends TracedStep {
  readonly kind: DPStepKind;
  readonly r?: number;
  readonly c?: number;
  readonly value?: number;
  /** Provenance: the cells this write was computed from. Drawn as arrows. */
  readonly from?: readonly (readonly [number, number])[];
  /** Short decision tag rendered on the cell. */
  readonly label?: string;
  readonly note?: string;
}

/**
 * A DP problem instance.
 *
 * Deliberately generic: the table shape and its axis labels are what the
 * renderer needs, and `payload` carries whatever problem-specific data the
 * algorithm itself requires (item weights, the two strings, coin
 * denominations, an adjacency matrix).
 */
export interface DPInput {
  readonly rows: number;
  readonly cols: number;
  readonly rowLabels: readonly string[];
  readonly colLabels: readonly string[];
  readonly payload: Readonly<Record<string, unknown>>;
  /** Human-readable description of the instance, shown above the table. */
  readonly title: string;
}

/** Sentinel for "no value yet" — rendered as an empty cell rather than a zero. */
export const DP_EMPTY = Number.NEGATIVE_INFINITY;
