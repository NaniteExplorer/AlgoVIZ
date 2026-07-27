import { StepTracer } from '../StepTracer';
import {
  type BacktrackInput,
  type BacktrackStep,
  BacktrackStepKind,
} from './BacktrackStep';

/**
 * Recorder + working board for backtracking algorithms.
 *
 * The important service here is **recursion-node bookkeeping**. `enter()`
 * allocates a node id and wires it to whatever is currently on top of an
 * internal stack; `leave()` pops. That means an algorithm can be written as
 * ordinary recursion — `t.enter(...); ...; t.leave();` around the recursive
 * call — and a correct tree falls out, instead of every algorithm hand-threading
 * parent ids through its own parameters.
 *
 * Also enforces the step budget: N-Queens at n=12 or a hostile Sudoku can emit
 * millions of steps, which would exhaust memory and produce a timeline nobody
 * could scrub anyway.
 */
export class BacktrackTracer extends StepTracer<BacktrackStep> {
  /** Beyond this the timeline is unusable, so the run is truncated. */
  static readonly MAX_STEPS = 250_000;

  private readonly board: number[];
  private readonly stack: number[] = [];
  private nextNode = 0;
  private truncated = false;

  constructor(readonly input: BacktrackInput) {
    super();
    this.board = [...input.initial];
  }

  get width(): number {
    return this.input.width;
  }
  get height(): number {
    return this.input.height;
  }
  get depth(): number {
    return this.stack.length;
  }
  /** True once the budget was hit; algorithms should unwind promptly. */
  get isTruncated(): boolean {
    return this.truncated;
  }

  payload<T>(): T {
    return this.input.payload as T;
  }

  /** Read a board cell. */
  cell(index: number): number {
    return this.board[index];
  }

  at2(row: number, col: number): number {
    return this.board[row * this.width + col];
  }

  index(row: number, col: number): number {
    return row * this.width + col;
  }

  // ── Recursion tree ──────────────────────────────────────────────────

  /** Descend one level. Returns the new node's id. */
  enter(choice?: string, note?: string): number {
    const node = this.nextNode;
    this.nextNode += 1;
    const parent = this.stack.length ? this.stack[this.stack.length - 1] : undefined;
    this.stack.push(node);
    this.push({ kind: BacktrackStepKind.Push, node, parent, choice, depth: this.stack.length, note });
    return node;
  }

  /** Mark the current node as a dead end. */
  reject(note?: string): void {
    this.push({
      kind: BacktrackStepKind.Reject,
      node: this.current,
      depth: this.stack.length,
      note,
    });
  }

  /** Mark the current node as a complete solution. */
  accept(note?: string): void {
    this.push({
      kind: BacktrackStepKind.Accept,
      node: this.current,
      depth: this.stack.length,
      note,
    });
  }

  /** Unwind one level. */
  leave(note?: string): void {
    const node = this.stack.pop();
    this.push({ kind: BacktrackStepKind.Pop, node, depth: this.stack.length, note });
  }

  private get current(): number | undefined {
    return this.stack.length ? this.stack[this.stack.length - 1] : undefined;
  }

  // ── Board ───────────────────────────────────────────────────────────

  /** Write a value into a cell and record it. */
  place(index: number, value: number, note?: string): void {
    this.board[index] = value;
    this.push({ kind: BacktrackStepKind.Place, cell: index, value, note });
  }

  /** Undo a placement. */
  unplace(index: number, note?: string): void {
    this.board[index] = 0;
    this.push({ kind: BacktrackStepKind.Unplace, cell: index, note });
  }

  /** Highlight the cells a constraint check looked at. */
  check(cells: readonly number[], note?: string): void {
    this.push({ kind: BacktrackStepKind.Check, cells: [...cells], note });
  }

  done(note?: string): void {
    this.push({ kind: BacktrackStepKind.Done, note });
  }

  /**
   * Append a step unless the budget is spent.
   *
   * Silently dropping steps past the cap keeps the recursion running to
   * completion (so the algorithm's own logic stays correct) while bounding the
   * timeline; the module surfaces `isTruncated` to the user.
   */
  private push(step: BacktrackStep): void {
    if (this._steps.length >= BacktrackTracer.MAX_STEPS) {
      this.truncated = true;
      return;
    }
    this.record(step);
  }
}
