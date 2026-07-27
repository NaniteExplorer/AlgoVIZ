import type { AlgorithmMeta } from '../types';
import { makeOpScript, StructureAlgorithm, STRUCTURES_CATEGORY } from './StructureAlgorithm';
import type { StructureInput } from './StructureStep';
import type { StructureTracer } from './StructureTracer';

/**
 * Binary min-heap insert and extract-min.
 *
 * The structure behind every priority queue, and therefore behind Dijkstra,
 * Prim and A*. The point worth seeing is that the heap property is *local* —
 * each node only ever compares with its parent or its children — yet it
 * guarantees a global minimum at the root.
 */
export class MinHeapOps extends StructureAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'min-heap',
    name: 'Min-Heap',
    category: STRUCTURES_CATEGORY,
    group: 'Heaps',
    description:
      'Insert and extract-min on a binary min-heap. New values sift up until their parent is smaller; extracting the root moves the last leaf to the top and sifts it back down. Only local parent/child comparisons are ever made, yet the smallest value is always at the root — which is what makes priority queues fast.',
    complexity: {
      time: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' },
      space: 'O(n)',
    },
    accent: '#34d399',
  };

  makeInput(size: number, random: () => number): StructureInput {
    const count = Math.max(6, Math.min(size + 2, 16));
    return {
      layout: 'tree',
      ops: makeOpScript(count, random, { insert: 'insert', remove: 'pop' }),
      title: `${count} heap operations`,
    };
  }

  protected execute(t: StructureTracer): void {
    // The heap is an array; `nodes[i]`'s children are at 2i+1 and 2i+2. Links
    // are emitted purely so the renderer can draw the tree.
    const nodes: number[] = [];

    const relink = (index: number): void => {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      if (left < nodes.length) t.link(nodes[index], 'left', nodes[left]);
      else t.unlink(nodes[index], 'left');
      if (right < nodes.length) t.link(nodes[index], 'right', nodes[right]);
      else t.unlink(nodes[index], 'right');
    };

    for (const op of t.ops) {
      if (op.kind === 'insert') {
        t.at(1).phase(`insert ${op.value}`);
        const node = t.create(op.value, { slot: nodes.length });
        nodes.push(node);
        const parentIndex = Math.floor((nodes.length - 2) / 2);
        if (nodes.length > 1) relink(parentIndex);

        // Sift up: swap with the parent while the heap property is violated.
        let i = nodes.length - 1;
        while (i > 0) {
          const parent = Math.floor((i - 1) / 2);
          t.at(3).compare(nodes[i], nodes[parent], `${t.valueOf(nodes[i])} vs parent ${t.valueOf(nodes[parent])}`);
          if (t.valueOf(nodes[parent]) <= t.valueOf(nodes[i])) break;
          t.at(4).swap(nodes[i], nodes[parent], 'child is smaller — sift up');
          i = parent;
        }
        continue;
      }

      // Extract-min.
      if (nodes.length === 0) continue;
      t.at(6).phase(`extract-min (${t.valueOf(nodes[0])})`);
      t.at(7).tag(nodes[0], 'removing', 'the root is always the minimum');

      const last = nodes.pop() as number;
      if (nodes.length === 0) {
        t.destroy(last);
        continue;
      }

      // Move the last leaf to the root, then sift it down.
      t.at(8).update(nodes[0], t.valueOf(last), 'move the last leaf to the root');
      t.destroy(last);
      const detachIndex = Math.floor((nodes.length - 1) / 2);
      relink(detachIndex);

      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let smallest = i;
        if (left < nodes.length) {
          t.at(10).compare(nodes[left], nodes[smallest]);
          if (t.valueOf(nodes[left]) < t.valueOf(nodes[smallest])) smallest = left;
        }
        if (right < nodes.length) {
          t.at(10).compare(nodes[right], nodes[smallest]);
          if (t.valueOf(nodes[right]) < t.valueOf(nodes[smallest])) smallest = right;
        }
        if (smallest === i) break;
        t.at(11).swap(nodes[i], nodes[smallest], 'a child is smaller — sift down');
        i = smallest;
      }
    }
  }
}
