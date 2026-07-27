import type { AlgorithmMeta } from '../types';
import { DPAlgorithm, DP_CATEGORY, randInt } from './DPAlgorithm';
import type { DPInput } from './DPStep';
import type { DPTracer } from './DPTracer';

interface Payload {
  matrix: number[][];
  n: number;
}

/** Stands in for infinity while keeping the table in plain integers. */
const INF = 999;

/**
 * Floyd–Warshall all-pairs shortest paths.
 *
 * Filed under dynamic programming rather than graphs on purpose: although the
 * input is a graph, the algorithm *is* a table being rewritten n times, and it
 * reads far better as a matrix than as a node-link scene. It is also the
 * family's clearest example of a DP whose "dimension" is the loop variable
 * itself — each pass allows one more intermediate vertex.
 */
export class FloydWarshall extends DPAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'floyd-warshall',
    name: 'Floyd–Warshall',
    category: DP_CATEGORY,
    group: 'Graph DP',
    description:
      'Computes shortest paths between every pair of vertices by allowing one more intermediate vertex on each pass. After pass k, cell (i, j) holds the shortest i→j path using only vertices 0..k as waypoints. Handles negative edges, and detects negative cycles as a negative value on the diagonal.',
    complexity: {
      time: { best: 'O(V³)', average: 'O(V³)', worst: 'O(V³)' },
      space: 'O(V²)',
    },
    accent: '#38bdf8',
  };

  makeInput(size: number, random: () => number): DPInput {
    const n = Math.max(3, Math.min(size, 7));
    const matrix: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => {
        if (i === j) return 0;
        // Sparse enough that later passes actually discover new routes; a dense
        // matrix would already be near-optimal after pass zero.
        return random() < 0.45 ? randInt(random, 1, 9) : INF;
      }),
    );

    const label = (i: number) => String.fromCharCode(65 + i);
    return {
      rows: n,
      cols: n,
      rowLabels: Array.from({ length: n }, (_, i) => label(i)),
      colLabels: Array.from({ length: n }, (_, i) => label(i)),
      payload: { matrix, n } satisfies Payload,
      title: `${n} vertices, all-pairs shortest paths`,
    };
  }

  protected solve(t: DPTracer): void {
    const { matrix, n } = t.payload<Payload>();

    t.at(1);
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) t.write(i, j, matrix[i][j]);
    }

    for (let k = 0; k < n; k += 1) {
      const via = String.fromCharCode(65 + k);
      for (let i = 0; i < n; i += 1) {
        if (i === k) continue;
        for (let j = 0; j < n; j += 1) {
          if (j === k || i === j) continue;

          t.at(3).focus(i, j, `can ${via} shorten ${label(i)}→${label(j)}?`);
          const direct = t.at(4).read(i, j);
          const first = t.at(5).read(i, k);
          const second = t.at(5).read(k, j);
          const through = first + second;

          if (through < direct) {
            t.at(6).decide(i, j, `via ${via}`, `${first} + ${second} = ${through} beats ${format(direct)}`);
            t.write(i, j, through, [
              [i, k],
              [k, j],
            ]);
          }
        }
      }
      // Highlighting the pivot row and column at the end of each pass makes the
      // "one more allowed waypoint" structure legible.
      t.at(7);
      for (let x = 0; x < n; x += 1) {
        t.trace(k, x);
        t.trace(x, k);
      }
    }
  }
}

function label(i: number): string {
  return String.fromCharCode(65 + i);
}

function format(value: number): string {
  return value >= INF ? '∞' : String(value);
}
