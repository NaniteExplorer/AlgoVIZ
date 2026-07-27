/**
 * Cursor-indexed metric history for one run.
 *
 * The key property that makes this cheap: because `run()` is deterministic and
 * the model is a pure state machine, the metric values at cursor *i* can never
 * change. So each cursor is recorded exactly once and re-reads are free —
 * scrubbing backwards and forwards through a timeline hundreds of times still
 * costs one pass of work.
 *
 * Storage is a dense `Float64Array` per key, which is also what lets the chart
 * read a whole column without allocating.
 */
export class MetricSeries {
  private columns = new Map<string, Float64Array>();
  private recorded: Uint8Array = new Uint8Array(0);
  private _filledUpTo = -1;
  private _capacity = 0;

  constructor(keys: readonly string[] = [], capacity = 0) {
    this.reset(capacity, keys);
  }

  /** Discard everything and size for a new timeline. */
  reset(capacity: number, keys?: readonly string[]): void {
    const names = keys ?? [...this.columns.keys()];
    this._capacity = Math.max(0, capacity);
    this.columns = new Map(names.map((key) => [key, new Float64Array(this._capacity)]));
    this.recorded = new Uint8Array(this._capacity);
    this._filledUpTo = -1;
  }

  get capacity(): number {
    return this._capacity;
  }

  /** Highest cursor recorded so far; -1 when nothing has been. */
  get filledUpTo(): number {
    return this._filledUpTo;
  }

  get keys(): string[] {
    return [...this.columns.keys()];
  }

  /**
   * Record the metric snapshot for `cursor`.
   *
   * A no-op if that cursor is already filled, which is what makes this safe to
   * call from the playback controller's single apply path regardless of whether
   * the user is playing forward or replaying after a backward seek.
   */
  record(cursor: number, metrics: Record<string, number>): void {
    if (cursor < 0 || cursor >= this._capacity || this.recorded[cursor]) return;

    for (const [key, value] of Object.entries(metrics)) {
      let column = this.columns.get(key);
      if (!column) {
        // A family can surface a metric the series wasn't constructed with;
        // adding the column lazily is cheaper than failing.
        column = new Float64Array(this._capacity);
        this.columns.set(key, column);
      }
      column[cursor] = value;
    }

    this.recorded[cursor] = 1;
    if (cursor > this._filledUpTo) this._filledUpTo = cursor;
  }

  /** Whether a cursor has been visited. */
  has(cursor: number): boolean {
    return cursor >= 0 && cursor < this._capacity && this.recorded[cursor] === 1;
  }

  /** Raw column. Values past `filledUpTo` are zero, not meaningful. */
  column(key: string): Float64Array | undefined {
    return this.columns.get(key);
  }

  /**
   * Down-sampled points for plotting, in `[cursor, value]` pairs.
   *
   * Charts are a few hundred pixels wide, so drawing a million points would
   * cost a great deal to produce a line indistinguishable from one drawn with
   * four hundred. Sampling by stride keeps the shape and the endpoints.
   */
  samples(key: string, maxPoints = 400): [number, number][] {
    const column = this.columns.get(key);
    if (!column || this._filledUpTo < 0) return [];

    const count = this._filledUpTo + 1;
    const stride = Math.max(1, Math.ceil(count / maxPoints));
    const out: [number, number][] = [];
    for (let i = 0; i < count; i += stride) out.push([i, column[i]]);
    // Always include the final point so the line reaches the end of the run.
    if (out.length === 0 || out[out.length - 1][0] !== count - 1) {
      out.push([count - 1, column[count - 1]]);
    }
    return out;
  }

  /** Largest value recorded for a key — the chart's y-axis bound. */
  max(key: string): number {
    const column = this.columns.get(key);
    if (!column || this._filledUpTo < 0) return 0;
    let peak = 0;
    for (let i = 0; i <= this._filledUpTo; i += 1) if (column[i] > peak) peak = column[i];
    return peak;
  }
}
