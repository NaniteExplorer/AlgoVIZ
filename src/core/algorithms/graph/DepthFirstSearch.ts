import type { AlgorithmMeta } from '../types';
import { GraphAlgorithm, GRAPH_CATEGORY } from './GraphAlgorithm';
import type { GraphTracer } from './GraphTracer';

export class DepthFirstSearch extends GraphAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'dfs',
    name: 'Depth-First Search',
    category: GRAPH_CATEGORY,
    group: 'Traversal',
    description:
      'Plunges as deep as possible along each branch before backtracking, using a stack (here, the call stack). Great for connectivity, cycle detection and topological order — but the path it finds is not necessarily the shortest.',
    complexity: {
      time: { best: 'O(V+E)', average: 'O(V+E)', worst: 'O(V+E)' },
      space: 'O(V)',
    },
    accent: '#a78bfa',
  };

  protected explore(t: GraphTracer): void {
    const { start, goal } = t;
    const visited = new Set<number>();
    const parent = new Map<number, number>();
    let found = false;

    const dfs = (u: number): void => {
      if (found) return;
      t.visit(u, 'descend into node');
      visited.add(u);
      if (u === goal) {
        t.settle(u, 'reached the goal');
        found = true;
        return;
      }
      for (const { to } of t.neighbors(u)) {
        t.explore(u, to);
        if (visited.has(to)) continue;
        parent.set(to, u);
        t.frontier(to, 'push neighbour onto the stack');
        dfs(to);
        if (found) return;
      }
      t.settle(u, 'exhausted this branch — backtrack');
    };

    t.frontier(start, 'push the start node');
    dfs(start);

    if (found) this.reconstructPath(t, parent, start, goal);
    else t.done('the goal is unreachable from the start');
  }
}
