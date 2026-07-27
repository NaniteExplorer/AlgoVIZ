import type { AlgorithmMeta } from '../types';
import { GraphAlgorithm, GRAPH_CATEGORY } from './GraphAlgorithm';
import type { GraphTracer } from './GraphTracer';

export class BreadthFirstSearch extends GraphAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'bfs',
    name: 'Breadth-First Search',
    category: GRAPH_CATEGORY,
    group: 'Traversal',
    description:
      'Explores the graph in expanding rings, visiting all nodes at distance k before any at distance k+1, using a FIFO queue. Finds the shortest path in terms of edge count on unweighted graphs.',
    complexity: {
      time: { best: 'O(V+E)', average: 'O(V+E)', worst: 'O(V+E)' },
      space: 'O(V)',
    },
    accent: '#22d3ee',
  };

  protected explore(t: GraphTracer): void {
    const { start, goal } = t;
    const visited = new Set<number>();
    const inFrontier = new Set<number>([start]);
    const parent = new Map<number, number>();
    const queue: number[] = [start];
    t.at(1).frontier(start, 'enqueue the start node');

    while (queue.length) {
      const u = queue.shift()!;
      inFrontier.delete(u);
      t.at(4).visit(u, 'dequeue the next node');
      visited.add(u);

      if (u === goal) {
        t.at(5).settle(u, 'reached the goal');
        this.reconstructPath(t, parent, start, goal);
        return;
      }

      for (const { to } of t.neighbors(u)) {
        t.at(6).explore(u, to);
        if (visited.has(to) || inFrontier.has(to)) continue;
        parent.set(to, u);
        inFrontier.add(to);
        queue.push(to);
        t.at(9).frontier(to, 'enqueue an undiscovered neighbour');
      }
      t.at(3).settle(u);
    }
    t.at(10).done('the goal is unreachable from the start');
  }
}
