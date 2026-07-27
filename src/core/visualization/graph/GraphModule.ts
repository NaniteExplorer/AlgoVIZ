import type { AnyAlgorithm } from '@/core/algorithms';
import { describeGraphStep } from '@/core/algorithms/graph/describe';
import {
  type GraphEdge,
  type GraphInput,
  type GraphNode,
  type GraphShape,
  type GraphStep,
  edgeKey,
} from '@/core/algorithms/graph/GraphStep';
import type { AlgorithmMeta } from '@/core/algorithms/types';
import { GraphModel } from '@/core/model/GraphModel';
import type { ControlSpec, LegendItem, MetricSpec } from '../CategoryModule';
import { WebGLCategoryModule } from '../WebGLCategoryModule';
import type { EngineOptions } from '../engine/VisualizationEngine';
import { GRAPH_LEGEND, GRAPH_NODE_STYLES } from './palette';
import { GraphVisualizer } from './GraphVisualizer';

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate a connected weighted graph on a jittered grid. A nearest-neighbour
 * spanning tree guarantees connectivity (so a path always exists), then each
 * node gains a few extra short edges for richness. Weights are rounded
 * straight-line distances, which keeps the A* heuristic admissible.
 */
function makeGraph(n: number, k = 3): GraphInput {
  const cols = Math.ceil(Math.sqrt(n));
  const spacing = 13;
  const jitter = 4.5;

  const nodes: GraphNode[] = [];
  for (let i = 0; i < n; i += 1) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    nodes.push({
      id: i,
      x: (c - (cols - 1) / 2) * spacing + rand(-jitter, jitter),
      y: rand(-2, 2),
      z: (r - (cols - 1) / 2) * spacing + rand(-jitter, jitter),
    });
  }

  const dist = (a: number, b: number) =>
    Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y, nodes[a].z - nodes[b].z);

  const seen = new Set<string>();
  const edges: GraphEdge[] = [];
  const add = (a: number, b: number) => {
    if (a === b) return;
    const key = edgeKey(a, b);
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ u: a, v: b, w: Math.max(1, Math.round(dist(a, b))) });
  };

  // Spanning tree: connect each node to its nearest predecessor.
  for (let i = 1; i < n; i += 1) {
    let best = 0;
    let bd = Infinity;
    for (let j = 0; j < i; j += 1) {
      const d = dist(i, j);
      if (d < bd) {
        bd = d;
        best = j;
      }
    }
    add(i, best);
  }

  // Enrich with each node's k nearest neighbours.
  for (let i = 0; i < n; i += 1) {
    const others: { j: number; d: number }[] = [];
    for (let j = 0; j < n; j += 1) if (j !== i) others.push({ j, d: dist(i, j) });
    others.sort((a, b) => a.d - b.d);
    for (let m = 0; m < Math.min(k, others.length); m += 1) add(i, others[m].j);
  }

  // Start at node 0; goal is the node farthest from it (a meaningful path).
  const start = 0;
  let goal = 0;
  let gd = -1;
  for (let i = 1; i < n; i += 1) {
    const d = dist(start, i);
    if (d > gd) {
      gd = d;
      goal = i;
    }
  }

  return { nodes, edges, start, goal, weighted: true };
}

/**
 * Generate a directed acyclic graph on a layered grid.
 *
 * Topological sort needs a DAG or it has nothing to order, and Tarjan needs
 * direction to be meaningful. Acyclicity is guaranteed structurally: every edge
 * runs from a lower node id to a higher one, so a cycle is impossible by
 * construction rather than by rejection sampling.
 */
function makeDag(n: number, allowCycles = false): GraphInput {
  const layers = Math.max(2, Math.round(Math.sqrt(n)));
  const perLayer = Math.ceil(n / layers);
  const spacing = 15;

  const nodes: GraphNode[] = [];
  for (let i = 0; i < n; i += 1) {
    const layer = Math.floor(i / perLayer);
    const slot = i % perLayer;
    nodes.push({
      id: i,
      x: (slot - (perLayer - 1) / 2) * spacing + rand(-3, 3),
      y: rand(-2, 2),
      z: (layer - (layers - 1) / 2) * spacing,
    });
  }

  const seen = new Set<string>();
  const edges: GraphEdge[] = [];
  const add = (u: number, v: number) => {
    const key = `${u}->${v}`;
    if (u === v || seen.has(key)) return;
    seen.add(key);
    edges.push({ u, v, w: Math.max(1, Math.round(rand(1, 9))) });
  };

  for (let i = 0; i < n; i += 1) {
    // Every non-final node gets at least one forward edge, so the ordering is
    // interesting rather than a pile of isolated vertices.
    const outDegree = 1 + Math.floor(rand(0, 2));
    for (let k = 0; k < outDegree; k += 1) {
      const target = i + 1 + Math.floor(rand(0, Math.min(perLayer + 1, n - i - 2)));
      if (target < n) add(i, target);
    }
  }

  // Strongly connected components need cycles to exist at all.
  if (allowCycles) {
    const backEdges = Math.max(1, Math.round(n / 5));
    for (let k = 0; k < backEdges; k += 1) {
      const to = Math.floor(rand(0, n - 2));
      const from = to + 1 + Math.floor(rand(0, Math.min(4, n - to - 2)));
      if (from < n) add(from, to);
    }
  }

  return { nodes, edges, start: 0, goal: n - 1, directed: true, weighted: true };
}

/** A connected weighted graph in which some edges have negative weight. */
function makeNegative(n: number): GraphInput {
  const base = makeGraph(n, 2);
  // Only a minority go negative, and never enough to create a negative cycle
  // on an undirected edge — which would make every distance −∞ and the
  // visualization pointless.
  const edges = base.edges.map((e, i) => (i % 4 === 0 ? { ...e, w: -Math.min(e.w, 3) } : e));
  return { ...base, edges, directed: true };
}

/** A layered source → sink network with generous capacities. */
function makeFlowNetwork(n: number): GraphInput {
  const dag = makeDag(n);
  // Capacities rather than distances: bigger numbers make the bottleneck
  // arithmetic easier to follow than 1s and 2s.
  const edges = dag.edges.map((e) => ({ ...e, w: Math.max(2, Math.round(rand(2, 14))) }));
  return { ...dag, edges };
}

/**
 * What instance shape an algorithm needs.
 *
 * This is the one place a category module legitimately branches on algorithm
 * identity: a topological sort of a cyclic undirected graph is not a harder
 * problem, it is a meaningless one. Keyed on the display group rather than on
 * ids so adding a sibling algorithm needs no change here.
 */
function requiredShape(meta: AlgorithmMeta): GraphShape {
  switch (meta.group) {
    case 'Ordering':
      return 'dag';
    case 'Flow':
      return 'flow';
    case 'Connectivity':
      // Tarjan on an acyclic graph is a trivial run — every component is a
      // single vertex — so it specifically needs back-edges.
      return meta.id === 'tarjan-scc' ? 'cyclic' : 'connected';
    default:
      return meta.id === 'bellman-ford' ? 'negative' : 'connected';
  }
}

/** Graph family driver. */
export class GraphModule extends WebGLCategoryModule<GraphStep, GraphInput> {
  readonly engineOptions: EngineOptions = {
    enableControls: true,
    autoRotate: false,
    bloomStrength: 0.95,
    cameraPosition: [0, 48, 66],
    cameraTarget: [0, 0, 0],
  };

  readonly controls: ControlSpec[] = [
    { key: 'nodes', label: 'Nodes', min: 8, max: 40, step: 1, default: 22 },
  ];

  readonly metricSpecs: MetricSpec[] = [
    { key: 'visited', label: 'visited' },
    { key: 'explored', label: 'edges' },
    { key: 'relaxed', label: 'relaxed' },
    { key: 'selected', label: 'kept' },
    { key: 'weight', label: 'weight' },
  ];

  readonly model = new GraphModel();
  readonly visualizer = new GraphVisualizer(this.model);

  private input: GraphInput = { nodes: [], edges: [], start: 0, goal: 0 };
  /** Shape the current instance was generated for. */
  private shape: GraphShape = 'connected';
  private lastNodeCount = 22;

  metrics(): Record<string, number> {
    return { ...this.model.metrics };
  }

  legend(): LegendItem[] {
    return GRAPH_LEGEND.map(({ role, label }) => ({
      color: GRAPH_NODE_STYLES[role].color,
      label,
    }));
  }

  regenerate(params: Record<string, number>): void {
    this.lastNodeCount = Math.round(params.nodes ?? 22);
    this.generate(this.shape);
  }

  buildTimeline(algorithm: AnyAlgorithm): GraphStep[] {
    // Regenerate only when the selected algorithm needs a different *kind* of
    // graph. Switching between BFS and Dijkstra keeps the same instance, which
    // is what makes comparing them meaningful.
    const needed = requiredShape((algorithm as { meta: AlgorithmMeta }).meta);
    if (needed !== this.shape || this.input.nodes.length === 0) {
      this.generate(needed);
      this.visualizer.rebuild();
    }
    return (algorithm as { run(input: GraphInput): GraphStep[] }).run(this.input);
  }

  private generate(shape: GraphShape): void {
    const n = this.lastNodeCount;
    this.shape = shape;
    switch (shape) {
      case 'dag':
        this.input = makeDag(n);
        break;
      case 'cyclic':
        this.input = makeDag(n, true);
        break;
      case 'negative':
        this.input = makeNegative(n);
        break;
      case 'flow':
        this.input = makeFlowNetwork(n);
        break;
      default:
        this.input = makeGraph(n);
        break;
    }
    this.model.reset(this.input);
  }

  getInstance(): GraphInput {
    return {
      nodes: this.input.nodes.map((n) => ({ ...n })),
      edges: this.input.edges.map((e) => ({ ...e })),
      start: this.input.start,
      goal: this.input.goal,
      directed: this.input.directed,
      weighted: this.input.weighted,
    };
  }

  setInstance(input: GraphInput): void {
    this.input = {
      nodes: input.nodes.map((n) => ({ ...n })),
      edges: input.edges.map((e) => ({ ...e })),
      start: input.start,
      goal: input.goal,
      directed: input.directed,
      weighted: input.weighted,
    };
    this.model.reset(this.input);
  }

  describe(step: GraphStep): string {
    return describeGraphStep(step);
  }

  rebuild(): void {
    this.visualizer.rebuild();
  }
}
