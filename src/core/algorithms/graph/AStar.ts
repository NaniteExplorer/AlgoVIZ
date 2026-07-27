import type { AlgorithmMeta } from '../types';
import { GraphAlgorithm, GRAPH_CATEGORY } from './GraphAlgorithm';
import type { GraphTracer } from './GraphTracer';

export class AStar extends GraphAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'a-star',
    name: 'A* Search',
    category: GRAPH_CATEGORY,
    group: 'Shortest Path',
    description:
      "Dijkstra's guided by a heuristic: it settles the node with the smallest f = g + h, where g is the cost so far and h is the straight-line distance to the goal. With an admissible heuristic it finds the optimal path while exploring far fewer nodes.",
    complexity: {
      time: { best: 'O(E)', average: 'O(E log V)', worst: 'O(E log V)' },
      space: 'O(V)',
    },
    accent: '#fbbf24',
  };

  protected explore(t: GraphTracer): void {
    const { start, goal, size } = t;
    const g = new Array<number>(size).fill(Infinity);
    const settled = new Set<number>();
    const open = new Set<number>();
    const parent = new Map<number, number>();
    g[start] = 0;
    open.add(start);
    t.frontier(start, 'start has cost 0');

    for (;;) {
      // Select the open node with the smallest f = g + h(goal).
      let u = -1;
      let best = Infinity;
      for (const v of open) {
        const f = g[v] + t.heuristic(v, goal);
        if (f < best) {
          best = f;
          u = v;
        }
      }
      if (u === -1) break;

      open.delete(u);
      t.visit(u, `expand lowest-f node (f ≈ ${best.toFixed(1)})`);
      settled.add(u);
      if (u === goal) {
        t.settle(u, 'reached the goal');
        break;
      }

      for (const { to, w } of t.neighbors(u)) {
        t.explore(u, to);
        if (settled.has(to)) continue;
        const tentative = g[u] + w;
        if (tentative < g[to]) {
          const firstReach = g[to] === Infinity;
          g[to] = tentative;
          parent.set(to, u);
          open.add(to);
          if (firstReach) t.frontier(to, 'discover a new node');
          t.relax(u, to, tentative, `improve cost → ${tentative}`);
        }
      }
      t.settle(u);
    }

    this.reconstructPath(t, parent, start, goal);
  }
}
