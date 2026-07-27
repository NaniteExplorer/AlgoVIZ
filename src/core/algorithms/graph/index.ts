import { algorithmRegistry } from '../AlgorithmRegistry';
import { BreadthFirstSearch } from './BreadthFirstSearch';
import { DepthFirstSearch } from './DepthFirstSearch';
import { Dijkstra } from './Dijkstra';
import { AStar } from './AStar';
import { TopologicalSort } from './TopologicalSort';
import { KruskalMST } from './KruskalMST';
import { PrimMST } from './PrimMST';
import { UnionFind } from './UnionFind';
import { TarjanSCC } from './TarjanSCC';
import { BellmanFord } from './BellmanFord';
import { MaxFlow } from './MaxFlow';

/**
 * Graph category barrel. Importing this module registers every graph algorithm
 * exactly once. To add a new one: create the class, add one line here.
 *
 * Ordered so the sidebar groups read as a progression — traversal, then
 * shortest paths, then spanning trees, connectivity and finally flow.
 */
export const GRAPH_ALGORITHMS = [
  new BreadthFirstSearch(),
  new DepthFirstSearch(),
  new Dijkstra(),
  new AStar(),
  new BellmanFord(),
  new KruskalMST(),
  new PrimMST(),
  new TopologicalSort(),
  new UnionFind(),
  new TarjanSCC(),
  new MaxFlow(),
] as const;

algorithmRegistry.registerAll(GRAPH_ALGORITHMS);

export {
  BreadthFirstSearch,
  DepthFirstSearch,
  Dijkstra,
  AStar,
  BellmanFord,
  KruskalMST,
  PrimMST,
  TopologicalSort,
  UnionFind,
  TarjanSCC,
  MaxFlow,
};
export { DisjointSet } from './DisjointSet';
export * from './GraphStep';
export type { GraphTracer } from './GraphTracer';
