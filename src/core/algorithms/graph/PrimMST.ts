import type { AlgorithmMeta } from '../types';
import { GraphAlgorithm, GRAPH_CATEGORY } from './GraphAlgorithm';
import type { GraphTracer } from './GraphTracer';

/**
 * Prim's minimum spanning tree.
 *
 * Deliberately sits next to Kruskal, because the pair makes the point that two
 * completely different greedy strategies reach the same optimum. Prim grows a
 * single connected blob outward; Kruskal scatters fragments and merges them.
 * Same total weight, visibly different animation.
 */
export class PrimMST extends GraphAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'prim',
    name: "Prim's MST",
    category: GRAPH_CATEGORY,
    group: 'Spanning Trees',
    description:
      'Grows a minimum spanning tree outward from one vertex, repeatedly taking the cheapest edge that leaves the tree. Compare it with Kruskal: Prim keeps one connected blob and expands it, Kruskal merges scattered fragments — different pictures, identical total weight.',
    complexity: {
      time: { best: 'O(E log V)', average: 'O(E log V)', worst: 'O(E log V)' },
      space: 'O(V)',
    },
    accent: '#34d399',
  };

  protected explore(t: GraphTracer): void {
    const inTree = new Set<number>();
    // Cheapest known edge into each outside vertex — the "cut" being maintained.
    const best = new Array<number>(t.size).fill(Infinity);
    const bestFrom = new Array<number>(t.size).fill(-1);

    const start = t.start;
    best[start] = 0;
    t.at(1).frontier(start, 'start the tree at one vertex');

    let total = 0;

    for (let iteration = 0; iteration < t.size; iteration += 1) {
      // Select the cheapest vertex not yet in the tree.
      let u = -1;
      let cheapest = Infinity;
      for (let v = 0; v < t.size; v += 1) {
        if (!inTree.has(v) && best[v] < cheapest) {
          cheapest = best[v];
          u = v;
        }
      }
      if (u === -1) break; // remaining vertices are unreachable

      inTree.add(u);
      t.at(3).visit(u, iteration === 0 ? 'seed vertex' : `add vertex ${u} (edge weight ${cheapest})`);

      if (bestFrom[u] !== -1) {
        total += cheapest;
        t.at(4).selectEdge(bestFrom[u], u, `keep ${bestFrom[u]}–${u}, tree weight now ${total}`);
      }

      // Relax the cut: every edge out of u may improve an outside vertex.
      for (const { to, w } of t.neighbors(u)) {
        if (inTree.has(to)) continue;
        t.at(6).explore(u, to);
        if (w < best[to]) {
          const first = best[to] === Infinity;
          best[to] = w;
          bestFrom[to] = u;
          if (first) t.at(7).frontier(to, `vertex ${to} is now reachable for ${w}`);
          t.at(7).relax(u, to, w, `cheapest way into ${to} is now ${w}`);
        }
      }
      t.settle(u);
    }

    t.at(9).done(`spanning tree complete — total weight ${total}`);
  }
}
