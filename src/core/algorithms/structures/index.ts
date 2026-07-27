import { algorithmRegistry } from '../AlgorithmRegistry';
import { AVLRotations } from './AVLRotations';
import { HashTableChaining } from './HashTableChaining';
import { HashTableOpenAddressing } from './HashTableOpenAddressing';
import { LinkedListOps } from './LinkedListOps';
import { MinHeapOps } from './MinHeapOps';
import { SegmentTreeOps } from './SegmentTreeOps';
import { StackQueueOps } from './StackQueueOps';
import { TrieOps } from './TrieOps';

/**
 * Registration barrel for the data-structures family.
 *
 * Ordered as a curriculum: linear structures first, then hashing, then heaps
 * and finally the tree structures that build on all of it.
 */
export const STRUCTURE_ALGORITHMS = [
  new LinkedListOps(),
  new StackQueueOps(),
  new HashTableChaining(),
  new HashTableOpenAddressing(),
  new MinHeapOps(),
  new TrieOps(),
  new AVLRotations(),
  new SegmentTreeOps(),
];

algorithmRegistry.registerAll(STRUCTURE_ALGORITHMS);

export { StructureAlgorithm, STRUCTURES_CATEGORY } from './StructureAlgorithm';
export { StructureTracer } from './StructureTracer';
export * from './StructureStep';
export { describeStructureStep } from './describe';
