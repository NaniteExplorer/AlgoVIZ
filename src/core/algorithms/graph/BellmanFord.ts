import type { AlgorithmMeta } from '../types';
import { GraphAlgorithm, GRAPH_CATEGORY } from './GraphAlgorithm';
import type { GraphTracer } from './GraphTracer';

/**
 * Bellman–Ford shortest paths.
 *
 * The counterpart to Dijkstra, and the reason both belong in the catalog:
 * Dijkstra is faster but silently wrong on negative edges, because it settles a
 * vertex permanently the first time it is reached. Bellman–Ford relaxes *every*
 * edge V−1 times instead, which is slower but immune — and the extra pass at
 * the end is what detects a negative cycle.
 */
export class BellmanFord extends GraphAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'bellman-ford',
    name: 'Bellman–Ford',
    category: GRAPH_CATEGORY,
    group: 'Shortest Path',
    description:
      'Finds shortest paths from one source, relaxing every edge V−1 times rather than settling vertices greedily. That makes it slower than Dijkstra but correct with negative edge weights, and one extra pass at the end detects negative cycles — which Dijkstra cannot do at all.',
    complexity: {
      time: { best: 'O(V+E)', average: 'O(VE)', worst: 'O(VE)' },
      space: 'O(V)',
    },
    accent: '#f472b6',
  };

  protected explore(t: GraphTracer): void {
    const dist = new Array<number>(t.size).fill(Infinity);
    const parent = new Map<number, number>();
    const start = t.start;

    dist[start] = 0;
    t.at(1).frontier(start, 'source distance is 0');

    // V-1 passes suffice: any shortest path uses at most V-1 edges.
    for (let pass = 1; pass < t.size; pass += 1) {
      let changed = false;

      for (const { u, v, w } of t.allEdges) {
        // Undirected instances relax in both directions.
        const directions: [number, number][] = t.isDirected
          ? [[u, v]]
          : [
              [u, v],
              [v, u],
            ];

        for (const [from, to] of directions) {
          if (dist[from] === Infinity) continue;
          t.at(4).explore(from, to);
          const candidate = dist[from] + w;
          if (candidate < dist[to]) {
            const first = dist[to] === Infinity;
            dist[to] = candidate;
            parent.set(to, from);
            changed = true;
            if (first) t.frontier(to, `vertex ${to} reached for the first time`);
            t.at(5).relax(from, to, candidate, `pass ${pass}: ${to} improves to ${candidate}`);
          }
        }
      }

      // Early exit once a full pass changes nothing — this is what gives the
      // O(V+E) best case on a graph that settles quickly.
      if (!changed) {
        t.at(6).settle(start, `no change in pass ${pass} — distances have converged`);
        break;
      }
    }

    // One more pass: anything that still improves is reachable from a cycle
    // whose total weight is negative, so no shortest path exists.
    t.at(8);
    for (const { u, v, w } of t.allEdges) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        t.at(9).fail(`negative cycle detected on edge ${u} → ${v}`);
        t.done();
        return;
      }
    }

    t.at(10);
    this.reconstructPath(t, parent, start, t.goal);
  }
}
