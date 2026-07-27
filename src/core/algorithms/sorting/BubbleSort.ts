import type { AlgorithmMeta } from '../types';
import { SortingAlgorithm, SORTING_CATEGORY } from './SortingAlgorithm';
import type { SortTracer } from './SortTracer';

export class BubbleSort extends SortingAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    category: SORTING_CATEGORY,
    description:
      'Repeatedly steps through the list, comparing adjacent elements and swapping them when out of order. After each pass the largest remaining element "bubbles" to its final position. Simple but quadratic.',
    complexity: {
      time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
      space: 'O(1)',
      stable: true,
    },
    accent: '#fb7185',
  };

  protected sort(t: SortTracer): void {
    const n = t.length;
    for (let i = 0; i < n - 1; i += 1) {
      let swappedThisPass = false;
      for (let j = 0; j < n - i - 1; j += 1) {
        // `at(n)` points at a line in the registered pseudocode listing
        // (src/core/pseudocode/entries/sorting.ts), driving the synced code pane.
        t.at(5).compare(j, j + 1);
        if (t.value(j) > t.value(j + 1)) {
          t.at(6).swap(j, j + 1);
          swappedThisPass = true;
        }
      }
      // The element at the end of this pass is now in its final spot.
      t.at(8).markSorted(n - i - 1);
      // Early exit optimisation — gives bubble sort its O(n) best case.
      if (!swappedThisPass) break;
    }
  }
}
