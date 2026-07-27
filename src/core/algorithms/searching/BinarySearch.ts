import type { AlgorithmMeta } from '../types';
import { SearchingAlgorithm, SEARCHING_CATEGORY } from './SearchingAlgorithm';
import type { SearchTracer } from './SearchTracer';

export class BinarySearch extends SearchingAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'binary-search',
    name: 'Binary Search',
    category: SEARCHING_CATEGORY,
    description:
      'On sorted data, repeatedly probes the middle of the active window and discards the half that cannot contain the target. Each comparison halves the search space, giving logarithmic time.',
    complexity: {
      time: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' },
      space: 'O(1)',
    },
    accent: '#a78bfa',
  };

  protected search(t: SearchTracer): void {
    let lo = 0;
    let hi = t.length - 1;

    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      t.at(2).bounds(lo, hi);
      t.at(3).probe(mid);
      const v = t.value(mid);
      if (v === t.target) {
        t.at(4).found(mid, `found the target at index ${mid}`);
        return;
      }
      if (v < t.target) {
        t.at(6).eliminate(lo, mid, 'target is larger → discard the left half');
        lo = mid + 1;
      } else {
        t.at(8).eliminate(mid, hi, 'target is smaller → discard the right half');
        hi = mid - 1;
      }
    }
    t.at(9).exhausted('window is empty — target is absent');
  }
}
