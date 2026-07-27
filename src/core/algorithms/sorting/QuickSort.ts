import type { AlgorithmMeta } from '../types';
import { SortingAlgorithm, SORTING_CATEGORY } from './SortingAlgorithm';
import type { SortTracer } from './SortTracer';

export class QuickSort extends SortingAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'quick-sort',
    name: 'Quick Sort',
    category: SORTING_CATEGORY,
    description:
      'A divide-and-conquer sort that picks a pivot and partitions the array so smaller elements precede it and larger ones follow, then recurses on each side. Fast in practice with O(n log n) average time and in-place O(log n) stack.',
    complexity: {
      time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' },
      space: 'O(log n)',
      stable: false,
    },
    accent: '#a78bfa',
  };

  protected sort(t: SortTracer): void {
    this.quickSort(t, 0, t.length - 1);
  }

  private quickSort(t: SortTracer, lo: number, hi: number): void {
    if (lo >= hi) {
      if (lo === hi) t.markSorted(lo);
      return;
    }
    const p = this.partition(t, lo, hi);
    t.at(3).markSorted(p);
    this.quickSort(t, lo, p - 1);
    this.quickSort(t, p + 1, hi);
  }

  /** Lomuto partition using the high element as pivot. */
  private partition(t: SortTracer, lo: number, hi: number): number {
    const pivot = t.value(hi);
    t.at(8).select(hi, 'pivot', 'choose pivot');
    let i = lo - 1;
    for (let j = lo; j < hi; j += 1) {
      t.at(11).compare(j, hi);
      if (t.value(j) < pivot) {
        i += 1;
        if (i !== j) t.at(12).swap(i, j);
      }
    }
    t.at(13).deselect(hi);
    if (i + 1 !== hi) t.at(13).swap(i + 1, hi);
    return i + 1;
  }
}
