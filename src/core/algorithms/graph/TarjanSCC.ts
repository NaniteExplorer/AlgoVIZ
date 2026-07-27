import type { AlgorithmMeta } from '../types';
import { GraphAlgorithm, GRAPH_CATEGORY } from './GraphAlgorithm';
import type { GraphTracer } from './GraphTracer';

/**
 * Tarjan's strongly connected components.
 *
 * The most conceptually demanding algorithm in the family, and worth it: the
 * low-link value is a genuinely clever idea — "the earliest vertex I can reach
 * by going down and then taking at most one back-edge" — and it is impossible
 * to appreciate from pseudocode alone. Watching the stack and the low-links
 * update together is what makes it click.
 */
export class TarjanSCC extends GraphAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'tarjan-scc',
    name: 'Tarjan SCC',
    category: GRAPH_CATEGORY,
    group: 'Connectivity',
    description:
      'Finds strongly connected components — maximal groups where every vertex can reach every other — in a single depth-first pass. Each vertex tracks a "low-link": the earliest vertex reachable by descending and then taking at most one back-edge. A vertex whose low-link equals its own index is the root of a component.',
    complexity: {
      time: { best: 'O(V+E)', average: 'O(V+E)', worst: 'O(V+E)' },
      space: 'O(V)',
    },
    accent: '#38bdf8',
  };

  protected explore(t: GraphTracer): void {
    const index = new Array<number>(t.size).fill(-1);
    const low = new Array<number>(t.size).fill(0);
    const onStack = new Array<boolean>(t.size).fill(false);
    const stack: number[] = [];
    let counter = 0;
    let components = 0;

    const strongConnect = (u: number): void => {
      index[u] = counter;
      low[u] = counter;
      counter += 1;
      stack.push(u);
      onStack[u] = true;

      t.at(2).visit(u, `enter ${u} (index ${index[u]})`);
      t.frontier(u, `push ${u} onto the stack`);

      for (const { to } of t.outEdges(u)) {
        t.at(4).explore(u, to);

        if (index[to] === -1) {
          strongConnect(to);
          low[u] = Math.min(low[u], low[to]);
          t.at(5).relax(u, to, low[u], `low-link of ${u} drops to ${low[u]} via the subtree`);
        } else if (onStack[to]) {
          // Only a vertex still on the stack counts: one already popped
          // belongs to a finished component and cannot be part of this one.
          low[u] = Math.min(low[u], index[to]);
          t.at(7).relax(u, to, low[u], `back-edge to ${to} pulls ${u}'s low-link to ${low[u]}`);
        }
      }

      // Low-link never escaped past this vertex, so it roots a component.
      if (low[u] === index[u]) {
        t.at(9);
        const group = components;
        components += 1;
        const members: number[] = [];
        for (;;) {
          const w = stack.pop() as number;
          onStack[w] = false;
          members.push(w);
          t.group(w, group);
          t.emit(w, `vertex ${w} joins component ${group}`);
          t.settle(w);
          if (w === u) break;
        }
        t.at(10).selectEdge(u, u, `component ${group}: {${members.reverse().join(', ')}}`);
      }
    };

    t.at(1);
    for (let v = 0; v < t.size; v += 1) {
      if (index[v] === -1) strongConnect(v);
    }

    t.at(11).done(
      `${components} strongly connected component${components === 1 ? '' : 's'}`,
    );
  }
}
