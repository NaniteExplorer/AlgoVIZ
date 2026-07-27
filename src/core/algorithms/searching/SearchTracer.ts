import { StepTracer } from '../StepTracer';
import { type SearchStep, SearchStepKind } from './SearchStep';

/**
 * Ergonomic recorder for search algorithms. Mirrors the sorting `SortTracer`:
 * the algorithm reads values and the target through the tracer and emits steps
 * via intention-revealing methods, so index bookkeeping stays in one place.
 */
export class SearchTracer extends StepTracer<SearchStep> {
  constructor(
    private readonly values: number[],
    readonly target: number,
  ) {
    super();
  }

  value(i: number): number {
    return this.values[i];
  }

  get length(): number {
    return this.values.length;
  }

  bounds(lo: number, hi: number, note?: string): void {
    this.record({ kind: SearchStepKind.Bounds, lo, hi, note });
  }

  probe(index: number, note?: string): void {
    this.record({ kind: SearchStepKind.Probe, index, note });
  }

  eliminate(from: number, to: number, note?: string): void {
    if (from > to) return;
    this.record({ kind: SearchStepKind.Eliminate, from, to, note });
  }

  found(index: number, note?: string): void {
    this.record({ kind: SearchStepKind.Found, index, note });
  }

  exhausted(note?: string): void {
    this.record({ kind: SearchStepKind.Exhausted, note });
  }
}
