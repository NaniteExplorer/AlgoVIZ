/**
 * The graph category's step vocabulary — the only contract between a graph
 * algorithm and the `GraphVisualizer`. Steps describe nodes entering the
 * frontier, being visited, edges being explored/relaxed, nodes being settled,
 * and the final shortest path.
 */
import type { TracedStep } from '../types';

export enum GraphStepKind {
  /** A node is added to the frontier (queue / stack / priority queue). */
  Frontier = 'frontier',
  /** A node is taken from the frontier and becomes the current node. */
  Visit = 'visit',
  /** An edge (from → to) is being examined. */
  Explore = 'explore',
  /** Relaxation improved the best-known distance to `to` (= `dist`). */
  Relax = 'relax',
  /** A node is finalised — its result will not change again. */
  Settle = 'settle',
  /** A node lies on the final path; `from` is its predecessor on that path. */
  Path = 'path',

  // ── Added for the advanced-graph algorithms ─────────────────────────
  // Appended, never reordered: the original four algorithms emit only the
  // kinds above and must keep working untouched.

  /** Include an edge in the result set — an MST edge, a flow-carrying edge. */
  SelectEdge = 'select-edge',
  /** Permanently discard an edge (it would form a cycle). */
  RejectEdge = 'reject-edge',
  /** Add an edge that is not in the input — e.g. a disjoint-set parent pointer. */
  AddEdge = 'add-edge',
  /** Assign `node` to component/colour bucket `group`. */
  Group = 'group',
  /** Append `node` to an ordered output list (topological order, SCC output). */
  Emit = 'emit',
  /** Push `amount` of flow along the edge from → to. */
  Flow = 'flow',
  /** A failure was detected — a negative cycle, or an impossible ordering. */
  Fail = 'fail',

  /** The run is finished. */
  Done = 'done',
}

export interface GraphStep extends TracedStep {
  readonly kind: GraphStepKind;
  readonly node?: number;
  readonly from?: number;
  readonly to?: number;
  readonly dist?: number;
  /** Component/colour bucket for `Group`. */
  readonly group?: number;
  /** Flow pushed, for `Flow`. */
  readonly amount?: number;
  /** Edge capacity, for flow networks. */
  readonly capacity?: number;
  readonly note?: string;
}

export interface GraphNode {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface GraphEdge {
  readonly u: number;
  readonly v: number;
  readonly w: number;
}

/**
 * Problem instance for the graph family.
 *
 * `directed` and `weighted` are optional so every existing generator compiles
 * unchanged; they tell the renderer whether to draw arrowheads and weights, and
 * tell algorithms such as topological sort what shape to expect.
 */
export interface GraphInput {
  readonly nodes: GraphNode[];
  readonly edges: GraphEdge[];
  readonly start: number;
  readonly goal: number;
  readonly directed?: boolean;
  readonly weighted?: boolean;
}

/**
 * What shape of graph an algorithm needs.
 *
 * Topological sort requires a DAG and Bellman–Ford is only interesting with
 * negative weights, so the module regenerates a compatible instance when the
 * selected algorithm demands one.
 */
export type GraphShape = 'connected' | 'dag' | 'cyclic' | 'negative' | 'flow';

/** Canonical key for an undirected edge. */
export function edgeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}
