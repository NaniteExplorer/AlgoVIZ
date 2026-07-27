import { DP_EMPTY, type DPInput, type DPStep, DPStepKind } from '../algorithms/dp/DPStep';

/** Visual status of a table cell. */
export enum DPCellRole {
  /** Not yet computed. */
  Empty = 'empty',
  /** Computed and settled. */
  Filled = 'filled',
  /** Being read as an input to the current evaluation. */
  Reading = 'reading',
  /** Just written. */
  Writing = 'writing',
  /** The cell currently being decided. */
  Focus = 'focus',
  /** On the reconstructed optimal path. */
  Trace = 'trace',
}

export interface DPMetrics {
  cellsFilled: number;
  reads: number;
  writes: number;
}

/**
 * Authoritative state of a dynamic-programming table.
 *
 * Same contract as every other model: pure, framework-free, `apply` forward and
 * `rewind` to the start. The renderer pulls from it each frame.
 *
 * Transient roles (`Reading`, `Writing`, `Focus`) live for a single applied
 * step; `Filled` and `Trace` persist. That split is what makes the animation
 * readable at speed — the eye follows the moving highlight while the completed
 * region stays quietly filled behind it.
 */
export class DPModel {
  private input: DPInput = {
    rows: 0,
    cols: 0,
    rowLabels: [],
    colLabels: [],
    payload: {},
    title: '',
  };

  private table: number[][] = [];
  private filled: boolean[][] = [];
  private traced: boolean[][] = [];
  private transient = new Map<string, DPCellRole>();
  private labels = new Map<string, string>();

  /** Provenance arrows for the most recent write. */
  private _arrows: { from: readonly [number, number]; to: readonly [number, number] }[] = [];
  private _cursor: { r: number; c: number } | null = null;
  private _metrics: DPMetrics = { cellsFilled: 0, reads: 0, writes: 0 };

  reset(input: DPInput): void {
    this.input = input;
    this.table = Array.from({ length: input.rows }, () =>
      new Array<number>(input.cols).fill(DP_EMPTY),
    );
    this.filled = Array.from({ length: input.rows }, () =>
      new Array<boolean>(input.cols).fill(false),
    );
    this.traced = Array.from({ length: input.rows }, () =>
      new Array<boolean>(input.cols).fill(false),
    );
    this.transient.clear();
    this.labels.clear();
    this._arrows = [];
    this._cursor = null;
    this._metrics = { cellsFilled: 0, reads: 0, writes: 0 };
  }

  rewind(): void {
    this.reset(this.input);
  }

  get rows(): number {
    return this.input.rows;
  }
  get cols(): number {
    return this.input.cols;
  }
  get rowLabels(): readonly string[] {
    return this.input.rowLabels;
  }
  get colLabels(): readonly string[] {
    return this.input.colLabels;
  }
  get title(): string {
    return this.input.title;
  }
  get metrics(): DPMetrics {
    return { ...this._metrics };
  }
  get arrows(): readonly { from: readonly [number, number]; to: readonly [number, number] }[] {
    return this._arrows;
  }
  get cursor(): { r: number; c: number } | null {
    return this._cursor;
  }

  /** `null` when the cell has not been computed yet. */
  valueAt(r: number, c: number): number | null {
    const value = this.table[r]?.[c];
    return value === undefined || value === DP_EMPTY ? null : value;
  }

  labelAt(r: number, c: number): string | undefined {
    return this.labels.get(key(r, c));
  }

  roleAt(r: number, c: number): DPCellRole {
    const transient = this.transient.get(key(r, c));
    if (transient) return transient;
    if (this.traced[r]?.[c]) return DPCellRole.Trace;
    return this.filled[r]?.[c] ? DPCellRole.Filled : DPCellRole.Empty;
  }

  apply(step: DPStep): void {
    // A Read is part of the *same* evaluation as the Focus that preceded it, so
    // reads accumulate rather than clearing each other. Anything else starts a
    // new visual beat.
    if (step.kind !== DPStepKind.Read) this.transient.clear();
    if (step.kind === DPStepKind.Focus || step.kind === DPStepKind.Init) this._arrows = [];

    switch (step.kind) {
      case DPStepKind.Init:
        this._cursor = null;
        break;

      case DPStepKind.Read:
        if (step.r !== undefined && step.c !== undefined) {
          this._metrics.reads += 1;
          this.transient.set(key(step.r, step.c), DPCellRole.Reading);
        }
        break;

      case DPStepKind.Focus:
        if (step.r !== undefined && step.c !== undefined) {
          this._cursor = { r: step.r, c: step.c };
          this.transient.set(key(step.r, step.c), DPCellRole.Focus);
        }
        break;

      case DPStepKind.Write:
        if (step.r !== undefined && step.c !== undefined) {
          const first = !this.filled[step.r][step.c];
          this.table[step.r][step.c] = step.value ?? 0;
          this.filled[step.r][step.c] = true;
          this._metrics.writes += 1;
          if (first) this._metrics.cellsFilled += 1;
          this.transient.set(key(step.r, step.c), DPCellRole.Writing);
          this._arrows = (step.from ?? []).map((from) => ({
            from,
            to: [step.r as number, step.c as number] as const,
          }));
        }
        break;

      case DPStepKind.Decide:
        if (step.r !== undefined && step.c !== undefined && step.label) {
          this.labels.set(key(step.r, step.c), step.label);
          this.transient.set(key(step.r, step.c), DPCellRole.Focus);
        }
        break;

      case DPStepKind.Trace:
        if (step.r !== undefined && step.c !== undefined && this.traced[step.r]) {
          this.traced[step.r][step.c] = true;
        }
        break;

      case DPStepKind.Done:
        this._cursor = null;
        this._arrows = [];
        break;
    }
  }
}

function key(r: number, c: number): string {
  return `${r}:${c}`;
}
