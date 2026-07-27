import type { AlgorithmMeta } from '../types';
import { GraphAlgorithm, GRAPH_CATEGORY } from './GraphAlgorithm';
import type { GraphTracer } from './GraphTracer';

/**
 * Topological sort (Kahn's algorithm).
 *
 * Chosen over the DFS formulation because the queue-based version makes the
 * *reason* an ordering exists visible: a vertex becomes available exactly when
 * its last prerequisite is removed. It is also the version that detects a cycle
 * naturally — if the queue empties early, something depends on itself.
 */
export class TopologicalSort extends GraphAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'topological-sort',
    name: 'Topological Sort',
    category: GRAPH_CATEGORY,
    group: 'Ordering',
    description:
      'Orders the vertices of a directed acyclic graph so every edge points forward — the dependency order behind build systems, task schedulers and module loaders. Kahn\'s algorithm repeatedly emits a vertex with no remaining prerequisites; if the queue empties early, the graph contains a cycle.',
    complexity: {
      time: { best: 'O(V+E)', average: 'O(V+E)', worst: 'O(V+E)' },
      space: 'O(V)',
    },
    accent: '#22d3ee',
  };

  protected explore(t: GraphTracer): void {
    const indegree = new Array<number>(t.size).fill(0);
    for (const { v } of t.allEdges) indegree[v] += 1;

    // Seed with everything that has no prerequisites at all.
    const queue: number[] = [];
    t.at(1);
    for (let v = 0; v < t.size; v += 1) {
      if (indegree[v] === 0) {
        queue.push(v);
        t.frontier(v, `vertex ${v} has no prerequisites`);
      }
    }

    let order = 0;
    while (queue.length) {
      // Smallest id first keeps the output deterministic, which the
      // replay-based scrubber relies on.
      queue.sort((a, b) => a - b);
      const u = queue.shift() as number;

      t.at(4).visit(u, `take vertex ${u} — nothing is waiting on it`);
      t.at(5).emit(u, `position ${order} in the ordering`);
      t.group(u, order);
      order += 1;
      t.settle(u);

      for (const { to } of t.outEdges(u)) {
        t.at(6).explore(u, to);
        indegree[to] -= 1;
        if (indegree[to] === 0) {
          queue.push(to);
          t.at(8).frontier(to, `vertex ${to}'s last prerequisite is gone`);
        } else {
          t.at(7).relax(u, to, indegree[to], `vertex ${to} still waits on ${indegree[to]} more`);
        }
      }
    }

    if (order < t.size) {
      t.at(10).fail(`cycle detected — only ${order} of ${t.size} vertices could be ordered`);
      t.done();
      return;
    }
    t.at(9).done(`topological order found for all ${t.size} vertices`);
  }
}
