import { StepTracer } from '../StepTracer';
import { DP_EMPTY, type DPInput, type DPStep, DPStepKind } from './DPStep';

/**
 * Recorder + working table for dynamic-programming algorithms.
 *
 * The tracer owns the `number[][]`, so `write` mutates the table and appends
 * the matching step in the same call — the same lockstep guarantee the sorting
 * tracer gives, which is what stops the animation from ever disagreeing with
 * the computation.
 *
 * `read` returns the value *and* records the access, so an algorithm written
 * naturally against this API produces the dependency arrows for free.
 */
export class DPTracer extends StepTracer<DPStep> {
  private readonly table: number[][];

  constructor(readonly input: DPInput) {
    super();
    this.table = Array.from({ length: input.rows }, () =>
      new Array<number>(input.cols).fill(DP_EMPTY),
    );
    this.record({
      kind: DPStepKind.Init,
      note: input.title,
    });
  }

  get rows(): number {
    return this.input.rows;
  }

  get cols(): number {
    return this.input.cols;
  }

  /** Problem-specific data, narrowed by the calling algorithm. */
  payload<T>(): T {
    return this.input.payload as T;
  }

  /** Read a cell as an input to the current recurrence, recording the access. */
  read(r: number, c: number): number {
    this.record({ kind: DPStepKind.Read, r, c });
    return this.table[r][c];
  }

  /** Read without recording — for bounds checks and loop bookkeeping. */
  peek(r: number, c: number): number {
    return this.table[r][c];
  }

  /** Move the cursor to the cell about to be decided. */
  focus(r: number, c: number, note?: string): void {
    this.record({ kind: DPStepKind.Focus, r, c, note });
  }

  /** Write a cell, recording which cells it derives from. */
  write(
    r: number,
    c: number,
    value: number,
    from: readonly (readonly [number, number])[] = [],
    note?: string,
  ): void {
    this.table[r][c] = value;
    this.record({ kind: DPStepKind.Write, r, c, value, from, note });
  }

  /** Tag the focused cell with the choice the recurrence made. */
  decide(r: number, c: number, label: string, note?: string): void {
    this.record({ kind: DPStepKind.Decide, r, c, label, note });
  }

  /** Mark a cell as lying on the reconstructed optimal solution. */
  trace(r: number, c: number, note?: string): void {
    this.record({ kind: DPStepKind.Trace, r, c, note });
  }

  done(note?: string): void {
    this.record({ kind: DPStepKind.Done, note });
  }
}
