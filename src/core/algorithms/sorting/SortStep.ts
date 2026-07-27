/**
 * The sorting category's step vocabulary.
 *
 * A sorting run is encoded as an ordered list of `SortStep`s. Steps are the
 * *only* contract between an algorithm and its visualizer — neither side knows
 * about the other. This is what lets a single `SortingVisualizer` render every
 * comparison sort, and what lets us add a new sort without touching rendering.
 */
import type { TracedStep } from '../types';

export enum SortStepKind {
  /** Two indices are being compared. Transient visual highlight. */
  Compare = 'compare',
  /** Two indices exchange their values. */
  Swap = 'swap',
  /** A single index is overwritten with `value` (e.g. merge sort writes). */
  Overwrite = 'overwrite',
  /** Mark an index as "active/selected" (pivot, current min, lifted key). */
  Select = 'select',
  /** Clear a previous selection. */
  Deselect = 'deselect',
  /** An index has reached its final sorted position. */
  MarkSorted = 'mark-sorted',
}

export interface SortStep extends TracedStep {
  readonly kind: SortStepKind;
  /** Primary index the step acts on. */
  readonly a: number;
  /** Secondary index for two-index steps (compare/swap). */
  readonly b?: number;
  /** New value for `Overwrite`. */
  readonly value?: number;
  /**
   * Optional semantic role tag for `Select`, lets the visualizer pick a colour
   * (e.g. "pivot" vs "min" vs "key"). Free-form by design.
   */
  readonly role?: string;
  /** Optional human-readable narration shown in the step inspector. */
  readonly note?: string;
}
