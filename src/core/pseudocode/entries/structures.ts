import type { Pseudocode } from '../PseudocodeRegistry';

/** Pseudocode listings for the data-structures family. */
export const STRUCTURES_PSEUDOCODE: Record<string, Pseudocode> = {
  'linked-list': {
    lines: [
      /* 0 */ 'INSERT(value)',
      /* 1 */ '  node ← newNode(value)',
      /* 2 */ '  if head = null then head ← node; return',
      /* 3 */ '  cursor ← head',
      /* 4 */ '  while cursor.next ≠ null do cursor ← cursor.next',
      /* 5 */ '  cursor.next ← node',
      /* 6 */ '',
      /* 7 */ 'SEARCH(value)',
      /* 8 */ '  cursor ← head',
      /* 9 */ '  while cursor ≠ null and cursor.value ≠ value do cursor ← cursor.next',
      /* 10 */ '',
      /* 11 */ 'DELETE(value)',
      /* 12 */ '  walk to the node, remembering its predecessor',
      /* 13 */ '  mark the victim',
      /* 14 */ '  previous.next ← victim.next     // splice it out',
    ],
  },

  'stack-queue': {
    lines: [
      /* 0 */ 'PUSH / ENQUEUE(value)',
      /* 1 */ '  create the value in both containers',
      /* 2 */ '  stack: add to the top',
      /* 3 */ '  queue: add to the back',
      /* 4 */ '',
      /* 5 */ 'POP / DEQUEUE',
      /* 6 */ '  stack removes the newest item   (LIFO)',
      /* 7 */ '  queue removes the oldest item   (FIFO)',
    ],
  },

  'min-heap': {
    lines: [
      /* 0 */ 'INSERT(value)',
      /* 1 */ '  append the value as the last leaf',
      /* 2 */ '  siftUp:',
      /* 3 */ '    while value < parent do',
      /* 4 */ '      swap with the parent',
      /* 5 */ '',
      /* 6 */ 'EXTRACT-MIN',
      /* 7 */ '  the root is the minimum — remove it',
      /* 8 */ '  move the last leaf to the root',
      /* 9 */ '  siftDown:',
      /* 10 */ '    compare with both children',
      /* 11 */ '    swap with the smaller child while it is smaller',
    ],
  },

  'hash-chaining': {
    lines: [
      /* 0 */ 'INSERT(key)',
      /* 1 */ '  b ← hash(key) mod buckets',
      /* 2 */ '  if bucket b is empty then place the key there',
      /* 3 */ '  else',
      /* 4 */ '    collision in bucket b',
      /* 5 */ '    prepend the key to the chain',
      /* 6 */ '',
      /* 7 */ 'SEARCH(key)',
      /* 8 */ '  walk the chain in bucket hash(key)',
      /* 9 */ '  compare each entry',
      /* 10 */ '',
      /* 11 */ 'DELETE(key)',
      /* 12 */ '  walk the chain, remembering the predecessor',
      /* 13 */ '  mark the victim',
      /* 14 */ '  splice it out of the chain',
    ],
  },

  'hash-open-addressing': {
    lines: [
      /* 0 */ 'INSERT(key)',
      /* 1 */ '  i ← hash(key) mod slots',
      /* 2 */ '  while slot i is occupied do',
      /* 3 */ '    i ← (i + 1) mod slots        // linear probe',
      /* 4 */ '  store the key in slot i',
      /* 5 */ '',
      /* 6 */ 'SEARCH(key)',
      /* 7 */ '  probe forward from hash(key)',
      /* 8 */ '  an empty slot proves the key is absent',
      /* 9 */ '  a matching slot is a hit',
    ],
  },

  trie: {
    lines: [
      /* 0 */ 'INSERT(word)',
      /* 1 */ '  node ← root',
      /* 2 */ '  for each character c in word do',
      /* 3 */ '    if node has a child for c then',
      /* 4 */ '      follow it                  // prefix is shared',
      /* 5 */ '    else create a new child for c',
      /* 6 */ '  mark the final node as end-of-word',
      /* 7 */ '',
      /* 8 */ 'SEARCH(word)',
      /* 9 */ '  follow one child per character',
      /* 10 */ '  a missing branch means the word is absent',
      /* 11 */ '  reaching the end means it is present',
    ],
  },

  'avl-tree': {
    lines: [
      /* 0 */ 'INSERT(value)',
      /* 1 */ '  insert as in a plain BST',
      /* 2 */ '  create the leaf',
      /* 3 */ '  compare and descend left or right',
      /* 4 */ '',
      /* 5 */ '  // unwind, fixing balance on the way up',
      /* 6 */ '  height ← 1 + max(left, right)',
      /* 7 */ '  factor ← height(left) - height(right)',
      /* 8 */ '  if |factor| ≤ 1 then done',
      /* 9 */ '  LL / RL case → rotate right',
      /* 10 */ '  RR / LR case → rotate left',
      /* 11 */ '',
      /* 12 */ '  // tree height stays O(log n)',
    ],
  },

  'segment-tree': {
    lines: [
      /* 0 */ 'BUILD(lo, hi)',
      /* 1 */ '  build the whole tree bottom-up',
      /* 2 */ '  if lo = hi then the node is that single value',
      /* 3 */ '  else node ← build(left) + build(right)',
      /* 4 */ '',
      /* 5 */ 'QUERY(ql, qr)',
      /* 6 */ '  fully inside  → return this node',
      /* 7 */ '  overlapping   → descend into both children',
      /* 8 */ '  // disjoint contributes nothing',
      /* 9 */ 'UPDATE(index, value)',
      /* 10 */ '  set the leaf',
      /* 11 */ '  descend the single path to that leaf',
      /* 12 */ '  recompute each ancestor on the way back up',
    ],
  },
};
