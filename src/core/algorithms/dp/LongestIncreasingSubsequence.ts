import type { AlgorithmMeta } from '../types';
import { DPAlgorithm, DP_CATEGORY, randInt } from './DPAlgorithm';
import type { DPInput } from './DPStep';
import type { DPTracer } from './DPTracer';

interface Payload {
  values: number[];
}

/**
 * Longest increasing subsequence, O(n²) formulation.
 *
 * A one-dimensional DP rendered as a single row, which makes an important point
 * the grid problems can't: the "table" of a DP is whatever shape the state
 * space is, not necessarily a matrix. Row 0 is the input, row 1 is the DP
 * array, so the dependency arrows fan backwards along a line.
 */
export class LongestIncreasingSubsequence extends DPAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'lis',
    name: 'Longest Increasing Subsequence',
    category: DP_CATEGORY,
    group: 'Sequence DP',
    description:
      'Finds the longest strictly increasing subsequence of an array. Each position looks back at every earlier position with a smaller value and extends the best chain found. A one-dimensional table, which makes the "look back at earlier subproblems" pattern especially visible.',
    complexity: {
      time: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
      space: 'O(n)',
    },
    accent: '#34d399',
  };

  makeInput(size: number, random: () => number): DPInput {
    const n = Math.max(5, Math.min(size, 16));
    const values = Array.from({ length: n }, () => randInt(random, 1, 40));

    return {
      // Row 0 holds the input values, row 1 the DP lengths.
      rows: 2,
      cols: n,
      rowLabels: ['value', 'LIS'],
      colLabels: Array.from({ length: n }, (_, i) => String(i)),
      payload: { values } satisfies Payload,
      title: `${n} values`,
    };
  }

  protected solve(t: DPTracer): void {
    const { values } = t.payload<Payload>();
    const n = values.length;
    const previous = new Array<number>(n).fill(-1);

    t.at(1);
    for (let i = 0; i < n; i += 1) t.write(0, i, values[i]);

    for (let i = 0; i < n; i += 1) {
      // Every element is an increasing subsequence of length 1 on its own.
      t.at(2).focus(1, i, `value ${values[i]} at index ${i}`);
      t.write(1, i, 1);

      for (let j = 0; j < i; j += 1) {
        t.at(4).read(0, j);
        if (values[j] >= values[i]) continue;

        const candidate = t.at(5).read(1, j) + 1;
        if (candidate > t.peek(1, i)) {
          previous[i] = j;
          t.at(6).decide(1, i, `+${j}`, `extend the chain ending at index ${j}`);
          t.write(1, i, candidate, [[1, j]]);
        }
      }
    }

    // Traceback from the best endpoint reconstructs the subsequence itself.
    t.at(8);
    let bestIndex = 0;
    for (let i = 1; i < n; i += 1) if (t.peek(1, i) > t.peek(1, bestIndex)) bestIndex = i;

    const chain: number[] = [];
    for (let i = bestIndex; i >= 0; i = previous[i]) {
      t.trace(1, i);
      t.trace(0, i);
      chain.unshift(values[i]);
      if (previous[i] === -1) break;
    }

    t.at(9).decide(
      1,
      bestIndex,
      '★',
      `longest increasing subsequence: ${chain.join(' < ')} (length ${chain.length})`,
    );
  }
}
