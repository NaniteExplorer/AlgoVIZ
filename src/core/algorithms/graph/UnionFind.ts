import type { AlgorithmMeta } from '../types';
import { GraphAlgorithm, GRAPH_CATEGORY } from './GraphAlgorithm';
import type { GraphTracer } from './GraphTracer';
import { DisjointSet } from './DisjointSet';

/**
 * Union–Find / connected components.
 *
 * The data structure as the subject rather than as a helper. Every edge in the
 * graph is unioned in turn, and both of the structure's optimisations are made
 * visible: union by rank as the shape of the forest, and path compression as
 * pointers snapping directly to the root.
 */
export class UnionFind extends GraphAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'union-find',
    name: 'Union–Find',
    category: GRAPH_CATEGORY,
    group: 'Connectivity',
    description:
      'Tracks which vertices belong to the same connected component while edges are added one by one. Union by rank keeps the forest shallow and path compression flattens it further — both are drawn live, so you can watch pointers snap straight to the root.',
    complexity: {
      time: { best: 'O(α(n))', average: 'O(α(n))', worst: 'O(α(n))' },
      space: 'O(V)',
    },
    accent: '#a78bfa',
  };

  protected explore(t: GraphTracer): void {
    const dsu = new DisjointSet(t.size);
    dsu.onLink = (child, root) => t.addEdge(child, root, `${child} now points at ${root}`);
    dsu.onCompress = (node, root) =>
      t.addEdge(node, root, `path compression: ${node} re-points straight at ${root}`);

    t.at(1);
    for (const { u, v } of t.allEdges) {
      t.at(3).explore(u, v, `union(${u}, ${v})`);

      if (dsu.connected(u, v)) {
        t.at(4).rejectEdge(u, v, `${u} and ${v} are already in the same component`);
        continue;
      }

      dsu.union(u, v);
      t.at(5).selectEdge(u, v, `merged — ${dsu.components} components remain`);
    }

    // Recolour every vertex by its final component. Roots are relabelled to
    // 0,1,2… so the palette indexes stay small and stable.
    t.at(7);
    const labels = new Map<number, number>();
    for (let v = 0; v < t.size; v += 1) {
      const root = dsu.find(v);
      if (!labels.has(root)) labels.set(root, labels.size);
      t.group(v, labels.get(root) as number, `vertex ${v} is in component ${labels.get(root)}`);
    }

    t.at(8).done(`${dsu.components} connected component${dsu.components === 1 ? '' : 's'}`);
  }
}
