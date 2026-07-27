/**
 * Exhaustiveness guard for discriminated unions.
 *
 * Every step union in the platform grows over time (advanced-graph adds seven
 * kinds to `GraphStepKind` alone). Calling this in the `default` arm of a switch
 * turns "somebody added a step kind and forgot a renderer/narration case" from a
 * silent no-op at runtime into a compile error — which, for a codebase whose
 * correctness is judged by eye, is the only place it can reliably be caught.
 */
export function assertNever(value: never, context = 'value'): never {
  throw new Error(`Unhandled ${context}: ${JSON.stringify(value)}`);
}

/**
 * Non-throwing variant for render paths.
 *
 * A visualizer that hits an unknown step should skip the frame, not blow up the
 * whole canvas — but we still want the compile-time exhaustiveness check.
 */
export function ignoreNever(_value: never): void {
  /* intentionally empty — the type system did the work */
}
