import type { AlgorithmMeta } from '../types';
import { DPAlgorithm, DP_CATEGORY, randInt } from './DPAlgorithm';
import type { DPInput } from './DPStep';
import type { DPTracer } from './DPTracer';

interface Payload {
  dims: number[];
}

/**
 * Matrix chain multiplication.
 *
 * The one *interval* DP in the family, and the reason it earns its place: the
 * table is filled by increasing chain length rather than row by row, so the
 * diagonal sweeps outward from the main diagonal instead of scanning top-left
 * to bottom-right. Watching that fill order is the whole point — it is the
 * clearest possible demonstration that DP order follows dependencies, not
 * array layout.
 */
export class MatrixChainMultiplication extends DPAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'matrix-chain',
    name: 'Matrix Chain Order',
    category: DP_CATEGORY,
    group: 'Interval DP',
    description:
      'Finds the cheapest way to parenthesise a chain of matrix multiplications. Cell (i, j) is the minimum scalar-multiplication cost of the sub-chain from i to j, trying every split point between them. Filled by increasing chain length, so the table grows outward along diagonals rather than in reading order.',
    complexity: {
      time: { best: 'O(n³)', average: 'O(n³)', worst: 'O(n³)' },
      space: 'O(n²)',
    },
    accent: '#f472b6',
  };

  makeInput(size: number, random: () => number): DPInput {
    // n matrices need n+1 dimensions: A_i is dims[i] × dims[i+1].
    const n = Math.max(3, Math.min(size, 8));
    const dims = Array.from({ length: n + 1 }, () => randInt(random, 2, 12) * 5);

    return {
      rows: n,
      cols: n,
      rowLabels: Array.from({ length: n }, (_, i) => `A${i + 1}`),
      colLabels: Array.from({ length: n }, (_, i) => `A${i + 1}`),
      payload: { dims } satisfies Payload,
      title: dims.map((d, i) => (i === 0 ? `${d}` : `×${d}`)).join(''),
    };
  }

  protected solve(t: DPTracer): void {
    const { dims } = t.payload<Payload>();
    const n = dims.length - 1;
    const split: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(-1));

    // A single matrix costs nothing to "multiply".
    t.at(1);
    for (let i = 0; i < n; i += 1) t.write(i, i, 0);

    // Outer loop over chain length is what produces the diagonal fill.
    for (let length = 2; length <= n; length += 1) {
      for (let i = 0; i + length - 1 < n; i += 1) {
        const j = i + length - 1;
        t.at(4).focus(i, j, `best split for A${i + 1}..A${j + 1}`);

        let best = Number.POSITIVE_INFINITY;
        let bestK = i;
        for (let k = i; k < j; k += 1) {
          const left = t.at(6).read(i, k);
          const right = t.at(6).read(k + 1, j);
          const cost = left + right + dims[i] * dims[k + 1] * dims[j + 1];
          if (cost < best) {
            best = cost;
            bestK = k;
          }
        }

        split[i][j] = bestK;
        t.at(7).decide(i, j, `k=${bestK + 1}`, `split after A${bestK + 1}`);
        t.write(i, j, best, [
          [i, bestK],
          [bestK + 1, j],
        ]);
      }
    }

    // Traceback down the recorded split points draws the parenthesisation.
    t.at(9);
    const traceCells = (i: number, j: number): string => {
      t.trace(i, j);
      if (i === j) return `A${i + 1}`;
      const k = split[i][j];
      return `(${traceCells(i, k)}·${traceCells(k + 1, j)})`;
    };
    const expression = n > 0 ? traceCells(0, n - 1) : '';
    t.at(10).decide(0, n - 1, '★', `optimal order: ${expression}`);
  }
}
