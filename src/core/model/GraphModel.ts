import {
  type GraphEdge,
  type GraphInput,
  type GraphNode,
  type GraphStep,
  GraphStepKind,
  edgeKey,
} from '../algorithms/graph/GraphStep';
import type { StepConsumer } from '../playback/PlaybackController';

/** Visual status of a graph node. */
export enum GraphNodeRole {
  Default = 'default',
  Start = 'start',
  Goal = 'goal',
  Frontier = 'frontier',
  Current = 'current',
  Settled = 'settled',
  Path = 'path',
}

/** Visual status of a graph edge. */
export enum GraphEdgeRole {
  Default = 'default',
  Explored = 'explored',
  Path = 'path',
  /** Kept in the result set — an MST edge, or an edge carrying flow. */
  Selected = 'selected',
  /** Permanently discarded (would close a cycle). */
  Rejected = 'rejected',
}

export interface GraphMetrics {
  visited: number;
  explored: number;
  relaxed: number;
  /** Edges kept in the result set. */
  selected: number;
  /** Total weight of the selected edges — the MST cost. */
  weight: number;
  /** Total flow pushed from source to sink. */
  flow: number;
}

/**
 * Authoritative logical state for a graph run — pure and replayable like the
 * other models. Holds the static topology (nodes + positions + edges) plus the
 * dynamic overlay (frontier, current, settled, path) that the visualizer pulls
 * each frame. Layout lives in the node positions, computed once at generation.
 */
export class GraphModel implements StepConsumer<GraphStep> {
  private _nodes: GraphNode[] = [];
  private _edges: GraphEdge[] = [];
  private _start = 0;
  private _goal = 0;

  private current = -1;
  private readonly frontier = new Set<number>();
  private readonly settled = new Set<number>();
  private readonly path = new Set<number>();
  private readonly pathEdges = new Set<string>();
  private readonly exploredEdges = new Set<string>();

  // ── Advanced-graph state ────────────────────────────────────────────
  private readonly selectedEdges = new Set<string>();
  private readonly rejectedEdges = new Set<string>();
  /** Edges the algorithm introduced (DSU parent pointers), not in the input. */
  private _dynamicEdges: GraphEdge[] = [];
  private readonly groupOf = new Map<number, number>();
  private readonly flowOn = new Map<string, number>();
  private _emitted: number[] = [];
  private _failed = false;
  private _directed = false;

  private _metrics: GraphMetrics = {
    visited: 0,
    explored: 0,
    relaxed: 0,
    selected: 0,
    weight: 0,
    flow: 0,
  };

  reset(input: GraphInput): void {
    this._nodes = input.nodes;
    this._edges = input.edges;
    this._start = input.start;
    this._goal = input.goal;
    this._directed = input.directed === true;
    this.current = -1;
    this.frontier.clear();
    this.settled.clear();
    this.path.clear();
    this.pathEdges.clear();
    this.exploredEdges.clear();
    this.selectedEdges.clear();
    this.rejectedEdges.clear();
    this.groupOf.clear();
    this.flowOn.clear();
    this._dynamicEdges = [];
    this._emitted = [];
    this._failed = false;
    this._metrics = { visited: 0, explored: 0, relaxed: 0, selected: 0, weight: 0, flow: 0 };
  }

  rewind(): void {
    this.reset({
      nodes: this._nodes,
      edges: this._edges,
      start: this._start,
      goal: this._goal,
      directed: this._directed,
    });
  }

  get nodes(): readonly GraphNode[] {
    return this._nodes;
  }
  get edges(): readonly GraphEdge[] {
    return this._edges;
  }
  get metrics(): GraphMetrics {
    return { ...this._metrics };
  }

  nodeRole(id: number): GraphNodeRole {
    if (this.path.has(id)) return GraphNodeRole.Path;
    if (id === this._start) return GraphNodeRole.Start;
    if (id === this._goal) return GraphNodeRole.Goal;
    if (id === this.current) return GraphNodeRole.Current;
    if (this.settled.has(id)) return GraphNodeRole.Settled;
    if (this.frontier.has(id)) return GraphNodeRole.Frontier;
    return GraphNodeRole.Default;
  }

  /** Edges the algorithm created that were not in the input (DSU pointers). */
  get dynamicEdges(): readonly GraphEdge[] {
    return this._dynamicEdges;
  }
  /** Nodes in the order the algorithm emitted them (topological/SCC output). */
  get emitted(): readonly number[] {
    return this._emitted;
  }
  get failed(): boolean {
    return this._failed;
  }
  get isDirected(): boolean {
    return this._directed;
  }

  /** Component index for colouring, or `undefined` if unassigned. */
  groupFor(id: number): number | undefined {
    return this.groupOf.get(id);
  }

  /** Flow currently carried by an edge, 0 if none. */
  flowFor(u: number, v: number): number {
    return this.flowOn.get(edgeKey(u, v)) ?? 0;
  }

  edgeRole(u: number, v: number): GraphEdgeRole {
    const key = edgeKey(u, v);
    // Order matters: a path edge is also selected, and the path reading wins.
    if (this.pathEdges.has(key)) return GraphEdgeRole.Path;
    if (this.selectedEdges.has(key)) return GraphEdgeRole.Selected;
    if (this.rejectedEdges.has(key)) return GraphEdgeRole.Rejected;
    if (this.exploredEdges.has(key)) return GraphEdgeRole.Explored;
    return GraphEdgeRole.Default;
  }

  /** Weight of an input edge, for metric accounting. */
  private weightOf(u: number, v: number): number {
    const key = edgeKey(u, v);
    return this._edges.find((e) => edgeKey(e.u, e.v) === key)?.w ?? 0;
  }

  apply(step: GraphStep): void {
    switch (step.kind) {
      case GraphStepKind.Frontier:
        if (step.node !== undefined) this.frontier.add(step.node);
        break;
      case GraphStepKind.Visit:
        if (step.node !== undefined) {
          this.current = step.node;
          this.frontier.delete(step.node);
          this._metrics.visited += 1;
        }
        break;
      case GraphStepKind.Explore:
        if (step.from !== undefined && step.to !== undefined) {
          this.exploredEdges.add(edgeKey(step.from, step.to));
          this._metrics.explored += 1;
        }
        break;
      case GraphStepKind.Relax:
        this._metrics.relaxed += 1;
        break;
      case GraphStepKind.Settle:
        if (step.node !== undefined) this.settled.add(step.node);
        break;
      case GraphStepKind.Path:
        if (step.node !== undefined) {
          this.path.add(step.node);
          if (step.from !== undefined) this.pathEdges.add(edgeKey(step.from, step.node));
        }
        break;
      case GraphStepKind.SelectEdge:
        if (step.from !== undefined && step.to !== undefined) {
          const key = edgeKey(step.from, step.to);
          if (!this.selectedEdges.has(key)) {
            this.selectedEdges.add(key);
            this._metrics.selected += 1;
            this._metrics.weight += this.weightOf(step.from, step.to);
          }
          this.rejectedEdges.delete(key);
        }
        break;

      case GraphStepKind.RejectEdge:
        if (step.from !== undefined && step.to !== undefined) {
          this.rejectedEdges.add(edgeKey(step.from, step.to));
        }
        break;

      case GraphStepKind.AddEdge:
        if (step.from !== undefined && step.to !== undefined) {
          // Dynamic edges are a live picture of a disjoint-set forest, so an
          // existing pointer out of `from` is replaced rather than duplicated.
          this._dynamicEdges = this._dynamicEdges.filter((e) => e.u !== step.from);
          this._dynamicEdges.push({ u: step.from, v: step.to, w: 0 });
        }
        break;

      case GraphStepKind.Group:
        if (step.node !== undefined && step.group !== undefined) {
          this.groupOf.set(step.node, step.group);
        }
        break;

      case GraphStepKind.Emit:
        if (step.node !== undefined) this._emitted.push(step.node);
        break;

      case GraphStepKind.Flow:
        if (step.from !== undefined && step.to !== undefined) {
          const key = edgeKey(step.from, step.to);
          const amount = step.amount ?? 0;
          this.flowOn.set(key, (this.flowOn.get(key) ?? 0) + amount);
          this.selectedEdges.add(key);
          // Total flow is by definition what leaves the source, so summing the
          // source's out-edges needs no separate bookkeeping from the algorithm.
          if (step.from === this._start) this._metrics.flow += amount;
        }
        break;

      case GraphStepKind.Fail:
        this._failed = true;
        break;

      case GraphStepKind.Done:
        this.current = -1;
        break;
    }
  }
}
