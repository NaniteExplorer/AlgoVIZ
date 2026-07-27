import type { TracedStep } from './types';

/**
 * Shared base for every category's tracer.
 *
 * Tracers are what keep an algorithm's data mutations and its emitted timeline
 * in lockstep. This base adds the one cross-cutting concern they all share: a
 * *line cursor*. An algorithm calls `tracer.at(4)` before a block, and every
 * step recorded afterwards carries `line: 4`, which is what drives the synced
 * pseudocode pane.
 *
 * The cursor is sticky rather than per-call so annotating an algorithm reads as
 * a handful of `at()` markers at the top of each block, not a parameter smeared
 * through every recorder call.
 */
export abstract class StepTracer<TStep extends TracedStep> {
  protected readonly _steps: TStep[] = [];
  private currentLine: number | undefined;

  get steps(): readonly TStep[] {
    return this._steps;
  }

  /**
   * Stamp subsequent steps with this pseudocode line. Chainable, so a recorder
   * call can be prefixed inline: `tracer.at(3).compare(i, j)`.
   */
  at(line: number): this {
    this.currentLine = line;
    return this;
  }

  /** Clear the line cursor — subsequent steps are unattributed. */
  clearLine(): this {
    this.currentLine = undefined;
    return this;
  }

  /**
   * Append a step, applying the current line cursor.
   *
   * Skips the object spread when no line is set so the 28 un-annotated
   * algorithms allocate exactly what they did before.
   */
  protected record(step: TStep): void {
    this._steps.push(this.currentLine === undefined ? step : { ...step, line: this.currentLine });
  }
}
