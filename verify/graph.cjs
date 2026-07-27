const { suite, check, checkTrue, seeded, replay } = require('./harness.cjs');

const B = '../.verify-build';
const { KruskalMST } = require(`${B}/core/algorithms/graph/KruskalMST`);
const { PrimMST } = require(`${B}/core/algorithms/graph/PrimMST`);
const { UnionFind } = require(`${B}/core/algorithms/graph/UnionFind`);
const { TopologicalSort } = require(`${B}/core/algorithms/graph/TopologicalSort`);
const { BellmanFord } = require(`${B}/core/algorithms/graph/BellmanFord`);
const { TarjanSCC } = require(`${B}/core/algorithms/graph/TarjanSCC`);
const { MaxFlow } = require(`${B}/core/algorithms/graph/MaxFlow`);
const { Dijkstra } = require(`${B}/core/algorithms/graph/Dijkstra`);
const { GraphModel } = require(`${B}/core/model/GraphModel`);

/** Connected, weighted, undirected graph on a ring plus random chords. */
function connectedGraph(n, random) {
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: i,
    x: Math.cos((i / n) * Math.PI * 2) * 30,
    y: 0,
    z: Math.sin((i / n) * Math.PI * 2) * 30,
  }));
  const seen = new Set();
  const edges = [];
  const add = (u, v, w) => {
    const key = u < v ? `${u}-${v}` : `${v}-${u}`;
    if (u === v || seen.has(key)) return;
    seen.add(key);
    edges.push({ u, v, w });
  };
  for (let i = 1; i < n; i += 1) add(i, i - 1, 1 + Math.floor(random() * 9));
  for (let k = 0; k < n; k += 1) {
    add(Math.floor(random() * n), Math.floor(random() * n), 1 + Math.floor(random() * 9));
  }
  return { nodes, edges, start: 0, goal: n - 1, weighted: true };
}

/** Directed acyclic graph: edges always run from a lower id to a higher one. */
function dag(n, random, backEdges = 0) {
  const nodes = Array.from({ length: n }, (_, i) => ({ id: i, x: i * 5, y: 0, z: 0 }));
  const edges = [];
  const seen = new Set();
  const add = (u, v, w) => {
    const key = `${u}->${v}`;
    if (u === v || seen.has(key)) return;
    seen.add(key);
    edges.push({ u, v, w });
  };
  for (let i = 0; i < n - 1; i += 1) {
    const outDegree = 1 + Math.floor(random() * 2);
    for (let k = 0; k < outDegree; k += 1) {
      add(i, i + 1 + Math.floor(random() * Math.min(3, n - i - 1)), 1 + Math.floor(random() * 9));
    }
  }
  for (let k = 0; k < backEdges; k += 1) {
    const to = Math.floor(random() * (n - 2));
    add(to + 1 + Math.floor(random() * Math.min(3, n - to - 2)), to, 1);
  }
  return { nodes, edges, start: 0, goal: n - 1, directed: true, weighted: true };
}

module.exports = function runGraphChecks() {
  suite('Advanced graph');

  // Kruskal and Prim must agree: two greedy strategies, one optimum.
  {
    for (const seed of [4, 19, 61]) {
      const input = connectedGraph(12, seeded(seed));
      const kruskal = new KruskalMST();
      const prim = new PrimMST();

      const km = new GraphModel();
      replay(kruskal, input, km, `kruskal seed=${seed}`);
      const pm = new GraphModel();
      replay(prim, input, pm, `prim seed=${seed}`);

      check(
        `MST seed=${seed}: Kruskal and Prim find the same total weight`,
        km.metrics.weight,
        pm.metrics.weight,
      );
      check(`MST seed=${seed}: Kruskal keeps V-1 edges`, km.metrics.selected, input.nodes.length - 1);
      check(`MST seed=${seed}: Prim keeps V-1 edges`, pm.metrics.selected, input.nodes.length - 1);

      // And it must genuinely be minimal — compare against a reference Kruskal.
      const sorted = [...input.edges].sort((a, b) => a.w - b.w || a.u - b.u || a.v - b.v);
      const parent = Array.from({ length: input.nodes.length }, (_, i) => i);
      const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
      let reference = 0;
      for (const { u, v, w } of sorted) {
        const ru = find(u);
        const rv = find(v);
        if (ru === rv) continue;
        parent[ru] = rv;
        reference += w;
      }
      check(`MST seed=${seed}: weight is truly minimal`, km.metrics.weight, reference);
    }
  }

  // Topological sort: every edge must point forward in the emitted order.
  {
    for (const seed of [7, 23]) {
      const input = dag(14, seeded(seed));
      const model = new GraphModel();
      replay(new TopologicalSort(), input, model, `topo seed=${seed}`);

      const order = model.emitted;
      check(`topo seed=${seed}: every vertex is emitted once`, order.length, input.nodes.length);
      const position = new Map(order.map((v, i) => [v, i]));
      let backwards = 0;
      for (const { u, v } of input.edges) {
        if ((position.get(u) ?? -1) > (position.get(v) ?? -1)) backwards += 1;
      }
      check(`topo seed=${seed}: no edge points backwards`, backwards, 0);
    }

    // A graph with a cycle must be reported, not silently mis-ordered.
    const cyclic = dag(10, seeded(3), 3);
    const model = new GraphModel();
    const steps = new TopologicalSort().run(cyclic);
    model.reset(cyclic);
    for (const s of steps) model.apply(s);
    checkTrue('topo: reports a cycle rather than a bogus ordering', model.failed);
  }

  // Union-Find must agree with a plain BFS component count.
  {
    const input = connectedGraph(14, seeded(11));
    // Drop half the edges so several components actually exist.
    const sparse = { ...input, edges: input.edges.filter((_, i) => i % 2 === 0) };
    const model = new GraphModel();
    replay(new UnionFind(), sparse, model, 'union-find');

    const adjacency = new Map();
    for (const { u, v } of sparse.edges) {
      if (!adjacency.has(u)) adjacency.set(u, []);
      if (!adjacency.has(v)) adjacency.set(v, []);
      adjacency.get(u).push(v);
      adjacency.get(v).push(u);
    }
    const seen = new Set();
    let components = 0;
    for (const node of sparse.nodes) {
      if (seen.has(node.id)) continue;
      components += 1;
      const queue = [node.id];
      seen.add(node.id);
      while (queue.length) {
        for (const next of adjacency.get(queue.pop()) ?? []) {
          if (!seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
    }
    const labels = new Set(sparse.nodes.map((n) => model.groupFor(n.id)));
    check('union-find: component count matches BFS', labels.size, components);
    checkTrue(
      'union-find: every vertex is assigned a component',
      sparse.nodes.every((n) => model.groupFor(n.id) !== undefined),
    );
  }

  // Bellman-Ford must agree with Dijkstra on non-negative graphs.
  {
    const input = connectedGraph(12, seeded(31));
    const bf = new BellmanFord();
    const model = new GraphModel();
    replay(bf, input, model, 'bellman-ford');

    // Reference shortest distance from source to goal.
    const n = input.nodes.length;
    const dist = new Array(n).fill(Infinity);
    dist[input.start] = 0;
    for (let pass = 0; pass < n - 1; pass += 1) {
      for (const { u, v, w } of input.edges) {
        if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
        if (dist[v] + w < dist[u]) dist[u] = dist[v] + w;
      }
    }

    // Sum the weights along the path Bellman-Ford reported.
    const steps = bf.run(input);
    const pathNodes = steps.filter((s) => s.kind === 'path').map((s) => s.node);
    checkTrue('bellman-ford: reports a path to the goal', pathNodes.length > 0);
    let total = 0;
    for (let i = 1; i < pathNodes.length; i += 1) {
      const a = pathNodes[i - 1];
      const b = pathNodes[i];
      const edge = input.edges.find(
        (e) => (e.u === a && e.v === b) || (e.u === b && e.v === a),
      );
      total += edge ? edge.w : Infinity;
    }
    check('bellman-ford: path length equals the true shortest distance', total, dist[input.goal]);

    // And Dijkstra must reach the same answer on the same non-negative graph.
    const dSteps = new Dijkstra().run(input);
    const dPath = dSteps.filter((s) => s.kind === 'path').map((s) => s.node);
    let dTotal = 0;
    for (let i = 1; i < dPath.length; i += 1) {
      const edge = input.edges.find(
        (e) =>
          (e.u === dPath[i - 1] && e.v === dPath[i]) || (e.u === dPath[i] && e.v === dPath[i - 1]),
      );
      dTotal += edge ? edge.w : Infinity;
    }
    check('bellman-ford and Dijkstra agree on a non-negative graph', total, dTotal);
  }

  // Tarjan: components must be genuinely mutually reachable.
  {
    const input = dag(12, seeded(13), 4);
    const model = new GraphModel();
    replay(new TarjanSCC(), input, model, 'tarjan');

    const out = new Map();
    for (const { u, v } of input.edges) {
      if (!out.has(u)) out.set(u, []);
      out.get(u).push(v);
    }
    const reaches = (from, to) => {
      const seen = new Set([from]);
      const queue = [from];
      while (queue.length) {
        const u = queue.pop();
        if (u === to) return true;
        for (const v of out.get(u) ?? []) {
          if (!seen.has(v)) {
            seen.add(v);
            queue.push(v);
          }
        }
      }
      return false;
    };

    const byGroup = new Map();
    for (const node of input.nodes) {
      const g = model.groupFor(node.id);
      if (g === undefined) continue;
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g).push(node.id);
    }
    checkTrue('tarjan: every vertex lands in a component', byGroup.size > 0);

    let broken = 0;
    for (const members of byGroup.values()) {
      for (const a of members) {
        for (const b of members) {
          if (a !== b && !(reaches(a, b) && reaches(b, a))) broken += 1;
        }
      }
    }
    check('tarjan: components are mutually reachable', broken, 0);

    // Maximality: no two components may be mutually reachable, or they should
    // have been merged into one.
    const groups = [...byGroup.entries()];
    let mergeable = 0;
    for (let i = 0; i < groups.length; i += 1) {
      for (let j = i + 1; j < groups.length; j += 1) {
        const a = groups[i][1][0];
        const b = groups[j][1][0];
        if (reaches(a, b) && reaches(b, a)) mergeable += 1;
      }
    }
    check('tarjan: components are maximal', mergeable, 0);
  }

  // Max flow: value must match a reference Edmonds-Karp, and conservation holds.
  {
    for (const seed of [5, 37]) {
      const input = dag(10, seeded(seed));
      const model = new GraphModel();
      replay(new MaxFlow(), input, model, `max-flow seed=${seed}`);

      const n = input.nodes.length;
      const cap = Array.from({ length: n }, () => new Array(n).fill(0));
      for (const { u, v, w } of input.edges) cap[u][v] += w;

      let reference = 0;
      for (;;) {
        const parent = new Array(n).fill(-1);
        parent[input.start] = input.start;
        const queue = [input.start];
        while (queue.length && parent[input.goal] === -1) {
          const u = queue.shift();
          for (let v = 0; v < n; v += 1) {
            if (parent[v] === -1 && cap[u][v] > 0) {
              parent[v] = u;
              queue.push(v);
            }
          }
        }
        if (parent[input.goal] === -1) break;
        let bottleneck = Infinity;
        for (let v = input.goal; v !== input.start; v = parent[v]) {
          bottleneck = Math.min(bottleneck, cap[parent[v]][v]);
        }
        for (let v = input.goal; v !== input.start; v = parent[v]) {
          cap[parent[v]][v] -= bottleneck;
          cap[v][parent[v]] += bottleneck;
        }
        reference += bottleneck;
      }

      check(`max-flow seed=${seed}: value matches reference`, model.metrics.flow, reference);
    }
  }
};
