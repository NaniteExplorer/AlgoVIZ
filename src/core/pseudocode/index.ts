import { pseudocodeRegistry } from './PseudocodeRegistry';
import { SORTING_PSEUDOCODE } from './entries/sorting';
import { SEARCHING_PSEUDOCODE } from './entries/searching';
import { GRAPH_PSEUDOCODE } from './entries/graph';
import { TREE_PSEUDOCODE } from './entries/tree';
import { DP_PSEUDOCODE } from './entries/dp';
import { BACKTRACKING_PSEUDOCODE } from './entries/backtracking';
import { GRAPH_ADVANCED_PSEUDOCODE } from './entries/graph-advanced';
import { STRUCTURES_PSEUDOCODE } from './entries/structures';

/**
 * Registration barrel.
 *
 * Imported for its side effect from `src/core/algorithms/index.ts`, mirroring
 * how each algorithm family registers itself. Not every algorithm has a listing
 * yet — the pane simply stays hidden for the ones that don't, so coverage can
 * grow one entry at a time.
 */
pseudocodeRegistry
  .registerAll(SORTING_PSEUDOCODE)
  .registerAll(SEARCHING_PSEUDOCODE)
  .registerAll(GRAPH_PSEUDOCODE)
  .registerAll(TREE_PSEUDOCODE)
  .registerAll(DP_PSEUDOCODE)
  .registerAll(BACKTRACKING_PSEUDOCODE)
  .registerAll(GRAPH_ADVANCED_PSEUDOCODE)
  .registerAll(STRUCTURES_PSEUDOCODE);

export { pseudocodeRegistry, PseudocodeRegistry, type Pseudocode } from './PseudocodeRegistry';
