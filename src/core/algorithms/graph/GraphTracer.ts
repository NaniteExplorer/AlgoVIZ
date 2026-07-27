import { StepTracer } from '../StepTracer';
import { type GraphInput, type GraphStep, GraphStepKind } from './GraphStep';

interface Adj {
  to: number;
  w: number;
}

/**
 * Ergonomic recorder + read model for graph algorithms. Builds an adjacency
 * list from the input once, exposes neighbour/position/weight queries, and
 * records the step timeline through intention-revealing methods. Neighbours are
 * returned in a stable (ascending) order so runs are deterministic.
 */
export class GraphTracer extends StepTracer<GraphStep> {
  private readonly adjacency: Adj[][];

  constructor(private readonly input: GraphInput) {
    super();
    this.adjacency = input.nodes.map(() => []);
    for (const { u, v, w } of input.edges) {
      this.adjacency[u].push({ to: v, w });
      this.adjacency[v].push({ to: u, w });
    }
    for (const list of this.adjacency) list.sort((a, b) => a.to - b.to);
  }

  get size(): number {
    return this.input.nodes.length;
  }
  get start(): number {
    return this.input.start;
  }
  get goal(): number {
    return this.input.goal;
  }

  neighbors(u: number): readonly Adj[] {
    return this.adjacency[u];
  }

  /** Straight-line distance between two nodes (the A* heuristic). */
  heuristic(a: number, b: number): number {
    const na = this.input.nodes[a];
    const nb = this.input.nodes[b];
    return Math.hypot(na.x - nb.x, na.y - nb.y, na.z - nb.z);
  }

  // ── Step recorders ──────────────────────────────────────────────────
  frontier(node: number, note?: string): void {
    this.record({ kind: GraphStepKind.Frontier, node, note });
  }
  visit(node: number, note?: string): void {
    this.record({ kind: GraphStepKind.Visit, node, note });
  }
  explore(from: number, to: number, note?: string): void {
    this.record({ kind: GraphStepKind.Explore, from, to, note });
  }
  relax(from: number, to: number, dist: number, note?: string): void {
    this.record({ kind: GraphStepKind.Relax, from, to, dist, note });
  }
  settle(node: number, note?: string): void {
    this.record({ kind: GraphStepKind.Settle, node, note });
  }
  path(node: number, from?: number, note?: string): void {
    this.record({ kind: GraphStepKind.Path, node, from, note });
  }
  done(note?: string): void {
    this.record({ kind: GraphStepKind.Done, note });
  }

  // ── Advanced-graph recorders ────────────────────────────────────────

  /** Keep an edge in the result set (MST edge, flow path edge). */
  selectEdge(from: number, to: number, note?: string): void {
    this.record({ kind: GraphStepKind.SelectEdge, from, to, note });
  }
  /** Discard an edge for good. */
  rejectEdge(from: number, to: number, note?: string): void {
    this.record({ kind: GraphStepKind.RejectEdge, from, to, note });
  }
  /** Introduce an edge not present in the input (a DSU parent pointer). */
  addEdge(from: number, to: number, note?: string): void {
    this.record({ kind: GraphStepKind.AddEdge, from, to, note });
  }
  /** Colour a node by component. */
  group(node: number, group: number, note?: string): void {
    this.record({ kind: GraphStepKind.Group, node, group, note });
  }
  /** Append a node to the ordered output. */
  emit(node: number, note?: string): void {
    this.record({ kind: GraphStepKind.Emit, node, note });
  }
  /** Push flow along an edge. */
  flow(from: number, to: number, amount: number, capacity?: number, note?: string): void {
    this.record({ kind: GraphStepKind.Flow, from, to, amount, capacity, note });
  }
  /** Report an impossibility: a negative cycle, or a cycle in a "DAG". */
  fail(note?: string): void {
    this.record({ kind: GraphStepKind.Fail, note });
  }

  /**
   * Directed adjacency, for algorithms where direction matters.
   *
   * {@link neighbors} deliberately returns the undirected view the original
   * four search algorithms were written against; topological sort and SCC need
   * the real out-edges, so they read this instead.
   */
  outEdges(u: number): readonly Adj[] {
    return this.input.edges
      .filter((e) => e.u === u)
      .map((e) => ({ to: e.v, w: e.w }))
      .sort((a, b) => a.to - b.to);
  }

  /** Every edge in the instance, in input order. */
  get allEdges(): readonly { u: number; v: number; w: number }[] {
    return this.input.edges;
  }

  get isDirected(): boolean {
    return this.input.directed === true;
  }
}
