import type { Pseudocode } from '../PseudocodeRegistry';

/** Pseudocode listings for the graph family. */
export const GRAPH_PSEUDOCODE: Record<string, Pseudocode> = {
  bfs: {
    lines: [
      /* 0 */ 'procedure BFS(G, start, goal)',
      /* 1 */ '  Q ← queue containing start',
      /* 2 */ '  visited ← {}',
      /* 3 */ '  while Q is not empty do',
      /* 4 */ '    u ← Q.dequeue()',
      /* 5 */ '    if u = goal then return reconstructPath(u)',
      /* 6 */ '    for each neighbour v of u do',
      /* 7 */ '      if v not seen then',
      /* 8 */ '        parent[v] ← u',
      /* 9 */ '        Q.enqueue(v)',
      /* 10 */ '  return UNREACHABLE',
    ],
  },

  dfs: {
    lines: [
      /* 0 */ 'procedure DFS(G, start, goal)',
      /* 1 */ '  S ← stack containing start',
      /* 2 */ '  visited ← {}',
      /* 3 */ '  while S is not empty do',
      /* 4 */ '    u ← S.pop()',
      /* 5 */ '    if u = goal then return reconstructPath(u)',
      /* 6 */ '    for each neighbour v of u do',
      /* 7 */ '      if v not visited then',
      /* 8 */ '        parent[v] ← u',
      /* 9 */ '        S.push(v)',
      /* 10 */ '  return UNREACHABLE',
    ],
  },

  dijkstra: {
    lines: [
      /* 0 */ "procedure Dijkstra(G, start, goal)   // w(e) ≥ 0",
      /* 1 */ '  dist[v] ← ∞ for all v;  dist[start] ← 0',
      /* 2 */ '  settled ← {}',
      /* 3 */ '  loop',
      /* 4 */ '    u ← unsettled node with least dist[u]',
      /* 5 */ '    if none exists then break',
      /* 6 */ '    settled ← settled ∪ {u}',
      /* 7 */ '    if u = goal then break',
      /* 8 */ '    for each edge (u, v, w) do',
      /* 9 */ '      if dist[u] + w < dist[v] then',
      /* 10 */ '        dist[v] ← dist[u] + w      // relax',
      /* 11 */ '        parent[v] ← u',
      /* 12 */ '  return reconstructPath(goal)',
    ],
  },

  'a-star': {
    lines: [
      /* 0 */ 'procedure AStar(G, start, goal, h)',
      /* 1 */ '  g[start] ← 0;  f[start] ← h(start, goal)',
      /* 2 */ '  open ← {start}',
      /* 3 */ '  while open is not empty do',
      /* 4 */ '    u ← node in open with least f[u]',
      /* 5 */ '    if u = goal then return reconstructPath(u)',
      /* 6 */ '    move u from open to closed',
      /* 7 */ '    for each edge (u, v, w) do',
      /* 8 */ '      if g[u] + w < g[v] then',
      /* 9 */ '        g[v] ← g[u] + w',
      /* 10 */ '        f[v] ← g[v] + h(v, goal)',
      /* 11 */ '        parent[v] ← u;  add v to open',
      /* 12 */ '  return UNREACHABLE',
    ],
  },
};
