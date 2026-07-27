import type { AlgorithmMeta } from '../types';
import { GraphAlgorithm, GRAPH_CATEGORY } from './GraphAlgorithm';
import type { GraphTracer } from './GraphTracer';

/**
 * Maximum flow, Edmonds–Karp (Ford–Fulkerson with a BFS augmenting path).
 *
 * BFS rather than DFS for choosing the augmenting path is the whole difference
 * between a polynomial algorithm and one that can loop pathologically on
 * awkward capacities — and it also animates far better, because each
 * augmentation takes a visibly short route.
 *
 * The residual graph is the concept to watch: pushing flow forward creates
 * backward capacity, which is what lets a later augmentation *undo* an earlier
 * greedy mistake.
 */
export class MaxFlow extends GraphAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'max-flow',
    name: 'Max Flow',
    category: GRAPH_CATEGORY,
    group: 'Flow',
    description:
      'Finds the greatest flow that can be pushed from a source to a sink without exceeding any edge\'s capacity. Each round takes the shortest remaining augmenting path and saturates it. Pushing flow forward opens up backward residual capacity, which is how a later round can undo an earlier greedy choice.',
    complexity: {
      time: { best: 'O(VE)', average: 'O(VE²)', worst: 'O(VE²)' },
      space: 'O(V²)',
    },
    accent: '#67e8f9',
  };

  protected explore(t: GraphTracer): void {
    const n = t.size;
    const source = t.start;
    const sink = t.goal;

    // Residual capacity matrix. An undirected edge is modelled as capacity in
    // both directions; the residual bookkeeping then works identically.
    const capacity: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
    for (const { u, v, w } of t.allEdges) {
      capacity[u][v] += w;
      if (!t.isDirected) capacity[v][u] += w;
    }

    let total = 0;
    let round = 0;

    for (;;) {
      // BFS for the shortest augmenting path in the residual graph.
      t.at(2);
      const parent = new Array<number>(n).fill(-1);
      parent[source] = source;
      const queue = [source];
      t.frontier(source, round === 0 ? 'start from the source' : `round ${round + 1}: look again`);

      while (queue.length && parent[sink] === -1) {
        const u = queue.shift() as number;
        t.at(3).visit(u);
        for (let v = 0; v < n; v += 1) {
          if (parent[v] !== -1 || capacity[u][v] <= 0) continue;
          parent[v] = u;
          queue.push(v);
          t.at(4).explore(u, v, `residual capacity ${capacity[u][v]} on ${u} → ${v}`);
          t.frontier(v);
        }
        t.settle(u);
      }

      if (parent[sink] === -1) {
        t.at(9).done(
          total === 0
            ? 'no path from source to sink — maximum flow is 0'
            : `no augmenting path remains — maximum flow is ${total}`,
        );
        return;
      }

      // Bottleneck: the smallest residual capacity along the path.
      t.at(6);
      let bottleneck = Infinity;
      for (let v = sink; v !== source; v = parent[v]) {
        bottleneck = Math.min(bottleneck, capacity[parent[v]][v]);
      }

      // Push the flow, opening backward residual capacity as we go.
      t.at(7);
      for (let v = sink; v !== source; v = parent[v]) {
        const u = parent[v];
        capacity[u][v] -= bottleneck;
        capacity[v][u] += bottleneck;
        t.flow(u, v, bottleneck, undefined, `push ${bottleneck} along ${u} → ${v}`);
      }

      total += bottleneck;
      round += 1;
      t.at(8).settle(sink, `augmenting path #${round} carried ${bottleneck}; total flow ${total}`);
    }
  }
}
