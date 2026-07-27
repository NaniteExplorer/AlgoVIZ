import { StepTracer } from '../StepTracer';
import { type SortStep, SortStepKind } from './SortStep';

/**
 * Ergonomic recorder used by sorting algorithms.
 *
 * The tracer is the single source of truth that keeps the algorithm's data
 * mutations and the emitted step timeline perfectly in sync: methods like
 * `swap`/`overwrite` perform the mutation on the working array *and* append the
 * matching step. Algorithm authors therefore never hand-roll index bookkeeping,
 * which is exactly the class of bug the original codebase suffered from (two
 * divergent ad-hoc animation encodings).
 */
export class SortTracer extends StepTracer<SortStep> {
  constructor(private readonly array: number[]) {
    super();
  }

  /** Read the live working value (algorithms read through the tracer). */
  value(i: number): number {
    return this.array[i];
  }

  get length(): number {
    return this.array.length;
  }

  compare(a: number, b: number, note?: string): void {
    this.record({ kind: SortStepKind.Compare, a, b, note });
  }

  /** Swap two cells and record it. */
  swap(a: number, b: number, note?: string): void {
    const tmp = this.array[a];
    this.array[a] = this.array[b];
    this.array[b] = tmp;
    this.record({ kind: SortStepKind.Swap, a, b, note });
  }

  /** Overwrite a single cell (used by distributive/merge-style writes). */
  overwrite(i: number, value: number, note?: string): void {
    this.array[i] = value;
    this.record({ kind: SortStepKind.Overwrite, a: i, value, note });
  }

  select(i: number, role?: string, note?: string): void {
    this.record({ kind: SortStepKind.Select, a: i, role, note });
  }

  deselect(i: number, note?: string): void {
    this.record({ kind: SortStepKind.Deselect, a: i, note });
  }

  markSorted(i: number, note?: string): void {
    this.record({ kind: SortStepKind.MarkSorted, a: i, note });
  }
}
