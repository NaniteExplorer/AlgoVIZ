import type { Pseudocode } from '../PseudocodeRegistry';

/** Pseudocode listings for the advanced graph algorithms. */
export const GRAPH_ADVANCED_PSEUDOCODE: Record<string, Pseudocode> = {
  kruskal: {
    lines: [
      /* 0 */ 'procedure kruskal(G)',
      /* 1 */ '  sort every edge by weight, cheapest first',
      /* 2 */ '  dsu ← DisjointSet(V)',
      /* 3 */ '  for each edge (u, v, w) in order do',
      /* 4 */ '    if find(u) = find(v) then skip   // would close a cycle',
      /* 5 */ '    union(u, v);  keep the edge',
      /* 6 */ '    stop once V-1 edges are kept',
      /* 7 */ '  return the kept edges',
    ],
  },

  prim: {
    lines: [
      /* 0 */ 'procedure prim(G, start)',
      /* 1 */ '  best[v] ← ∞;  best[start] ← 0',
      /* 2 */ '  repeat V times:',
      /* 3 */ '    u ← vertex outside the tree with the smallest best[u]',
      /* 4 */ '    add u (and its edge) to the tree',
      /* 5 */ '    for each edge (u, v, w) do',
      /* 6 */ '      if v is outside the tree and w < best[v] then',
      /* 7 */ '        best[v] ← w;  bestFrom[v] ← u',
      /* 8 */ '',
      /* 9 */ '  return the tree',
    ],
  },

  'union-find': {
    lines: [
      /* 0 */ 'procedure connectedComponents(G)',
      /* 1 */ '  dsu ← DisjointSet(V)',
      /* 2 */ '  for each edge (u, v) do',
      /* 3 */ '    if find(u) = find(v) then skip   // already together',
      /* 4 */ '',
      /* 5 */ '    union(u, v)                      // union by rank',
      /* 6 */ '',
      /* 7 */ '  label every vertex by find(v)      // path compression',
      /* 8 */ '  return the labels',
    ],
  },

  'topological-sort': {
    lines: [
      /* 0 */ "procedure topoSort(G)   // Kahn's algorithm",
      /* 1 */ '  indegree[v] ← number of incoming edges',
      /* 2 */ '  queue ← every v with indegree 0',
      /* 3 */ '  while queue is not empty do',
      /* 4 */ '    u ← queue.pop()',
      /* 5 */ '    append u to the ordering',
      /* 6 */ '    for each edge (u → v) do',
      /* 7 */ '      indegree[v] ← indegree[v] - 1',
      /* 8 */ '      if indegree[v] = 0 then queue.push(v)',
      /* 9 */ '  if every vertex was emitted then return the ordering',
      /* 10 */ '  else the graph contains a cycle',
    ],
  },

  'bellman-ford': {
    lines: [
      /* 0 */ 'procedure bellmanFord(G, source)',
      /* 1 */ '  dist[v] ← ∞;  dist[source] ← 0',
      /* 2 */ '  repeat V-1 times:',
      /* 3 */ '    for each edge (u, v, w) do',
      /* 4 */ '      if dist[u] + w < dist[v] then',
      /* 5 */ '        dist[v] ← dist[u] + w',
      /* 6 */ '    if nothing changed then stop early',
      /* 7 */ '',
      /* 8 */ '  for each edge (u, v, w) do          // one extra pass',
      /* 9 */ '    if dist[u] + w < dist[v] then report a negative cycle',
      /* 10 */ '  return dist',
    ],
  },

  'tarjan-scc': {
    lines: [
      /* 0 */ 'procedure tarjan(G)',
      /* 1 */ '  for each unvisited v do strongConnect(v)',
      /* 2 */ '',
      /* 3 */ 'procedure strongConnect(u)',
      /* 4 */ '  index[u] ← low[u] ← counter++;  push u',
      /* 5 */ '  for each edge (u → v) do',
      /* 6 */ '    if v is unvisited then',
      /* 7 */ '      strongConnect(v);  low[u] ← min(low[u], low[v])',
      /* 8 */ '    else if v is on the stack then',
      /* 9 */ '      low[u] ← min(low[u], index[v])   // back-edge',
      /* 10 */ '  if low[u] = index[u] then',
      /* 11 */ '    pop the stack down to u — that is one component',
    ],
  },

  'max-flow': {
    lines: [
      /* 0 */ 'procedure maxFlow(G, source, sink)   // Edmonds–Karp',
      /* 1 */ '  residual ← capacities of G',
      /* 2 */ '  loop',
      /* 3 */ '    find the shortest source→sink path with BFS',
      /* 4 */ '      following only edges with residual capacity left',
      /* 5 */ '    if no such path exists then return total',
      /* 6 */ '    bottleneck ← smallest residual capacity on the path',
      /* 7 */ '    for each edge (u, v) on the path do',
      /* 8 */ '      residual[u][v] -= bottleneck',
      /* 9 */ '      residual[v][u] += bottleneck    // backward capacity',
      /* 10 */ '    total ← total + bottleneck',
    ],
  },
};
