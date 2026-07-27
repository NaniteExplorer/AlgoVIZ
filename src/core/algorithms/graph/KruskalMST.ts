import type { AlgorithmMeta } from '../types';
import { GraphAlgorithm, GRAPH_CATEGORY } from './GraphAlgorithm';
import type { GraphTracer } from './GraphTracer';
import { DisjointSet } from './DisjointSet';

/**
 * Kruskal's minimum spanning tree.
 *
 * The clearest demonstration of union–find in the catalog: edges are considered
 * cheapest-first, and the *only* question asked of each is "would this close a
 * cycle?" — answered by the disjoint set, whose forest is drawn live as
 * dynamic edges. Watching the components merge is watching the data structure
 * do its job.
 */
export class KruskalMST extends GraphAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'kruskal',
    name: "Kruskal's MST",
    category: GRAPH_CATEGORY,
    group: 'Spanning Trees',
    description:
      'Builds a minimum spanning tree by sorting every edge by weight and greedily keeping any edge that connects two so-far-separate components. A disjoint-set structure answers "would this edge close a cycle?" in near-constant time; its forest is drawn alongside the graph as it merges.',
    complexity: {
      time: { best: 'O(E log E)', average: 'O(E log E)', worst: 'O(E log E)' },
      space: 'O(V)',
    },
    accent: '#fbbf24',
  };

  protected explore(t: GraphTracer): void {
    const dsu = new DisjointSet(t.size);
    // Every re-parenting becomes a visible edge in the DSU forest.
    dsu.onLink = (child, root) => t.addEdge(child, root, `merge component into ${root}`);

    // Sorting by weight then by endpoints keeps ties broken deterministically,
    // which the replay-based scrubber depends on.
    const edges = [...t.allEdges].sort((a, b) => a.w - b.w || a.u - b.u || a.v - b.v);

    let kept = 0;
    let total = 0;

    t.at(1);
    for (const { u, v, w } of edges) {
      if (kept === t.size - 1) break;

      t.at(3).explore(u, v, `consider edge ${u}–${v} (weight ${w})`);
      if (dsu.connected(u, v)) {
        t.at(4).rejectEdge(u, v, 'both ends are already connected — skip it');
        continue;
      }

      dsu.union(u, v);
      kept += 1;
      total += w;
      t.at(5).selectEdge(u, v, `keep ${u}–${v}, tree weight now ${total}`);
      t.visit(u);
      t.settle(u);
      t.settle(v);
    }

    if (kept === t.size - 1) {
      t.at(7).done(`spanning tree complete — ${kept} edges, total weight ${total}`);
    } else {
      t.at(7).fail(`graph is disconnected — only ${kept} of ${t.size - 1} edges could be chosen`);
      t.done();
    }
  }
}
