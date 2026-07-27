/**
 * Cross-cutting domain types for the algorithm layer.
 *
 * The design goal here is *categorical extensibility*: today we ship sorting,
 * but the same `Algorithm` contract, registry, and metadata shape are meant to
 * host graph, tree and searching algorithms tomorrow without touching the
 * playback or rendering layers. Each category defines its own step union (see
 * `sorting/SortStep.ts`); everything above the category boundary is generic.
 */

/** Top-level taxonomy. Adding a value here is the first step of a new family. */
export enum AlgorithmCategory {
  Sorting = 'sorting',
  Graph = 'graph',
  Tree = 'tree',
  Searching = 'searching',
  DynamicProgramming = 'dp',
  Backtracking = 'backtracking',
  Structures = 'structures',
  MachineLearning = 'ml',
}

/**
 * Mixed into every category's step type.
 *
 * The pseudocode pane highlights the line a step is executing. Rather than
 * changing 28 algorithms at once, the field is optional and stamped by the
 * tracer's line cursor: an algorithm that never calls `tracer.at()` emits
 * `undefined` and the pane simply stays hidden for it. Adoption is therefore
 * per-algorithm and never a breaking change.
 */
export interface TracedStep {
  /** 0-indexed line in the algorithm's registered pseudocode. */
  readonly line?: number;
}

/** Asymptotic profile, surfaced verbatim in the UI complexity card. */
export interface ComplexityProfile {
  time: {
    best: string;
    average: string;
    worst: string;
  };
  space: string;
  /** Only meaningful for comparison sorts; left optional for other families. */
  stable?: boolean;
}

/**
 * Static, serialisable description of an algorithm. Deliberately free of any
 * runtime/Three.js concern so it can be sent to a server component, cached,
 * or rendered in a list without instantiating the algorithm itself.
 */
export interface AlgorithmMeta {
  /** Stable, URL-safe identifier (e.g. "quick-sort"). */
  id: string;
  name: string;
  category: AlgorithmCategory;
  /** One-paragraph plain-language summary for the info panel. */
  description: string;
  complexity: ComplexityProfile;
  /** Hex accent used to theme this algorithm in the UI + scene highlights. */
  accent: string;
  /**
   * Optional sub-grouping within a category ("MST", "String DP", "Hashing").
   *
   * Purely a display concern: a category with thirteen algorithms is unusable as
   * a flat list of pills, but splitting the *taxonomy* would fragment the
   * `CategoryModule` seam. Grouping solves the UI problem without touching it.
   */
  group?: string;
}

/**
 * The universal algorithm contract. `TInput` is the problem instance (an array
 * for sorting, an adjacency list for graphs, …) and `TStep` is the category's
 * step union consumed by the matching visualizer.
 */
export interface Algorithm<TInput, TStep> {
  readonly meta: AlgorithmMeta;
  /**
   * Pure function: given an input, produce the full, deterministic timeline of
   * steps. Must NOT mutate `input`. Determinism is what lets the playback layer
   * scrub by replaying from the start.
   */
  run(input: TInput): TStep[];
}
