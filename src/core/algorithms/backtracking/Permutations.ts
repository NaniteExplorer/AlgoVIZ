import type { AlgorithmMeta } from '../types';
import { BacktrackAlgorithm, BACKTRACKING_CATEGORY, randInt } from './BacktrackAlgorithm';
import type { BacktrackInput } from './BacktrackStep';
import type { BacktrackTracer } from './BacktrackTracer';

/**
 * Generate all permutations.
 *
 * Unlike the board problems, this one never *rejects* anything — every leaf is
 * a valid answer. That makes it the clearest illustration of the recursion tree
 * itself: a perfectly regular n! fan-out, with the tree doing all the work and
 * the board just showing the current prefix.
 */
export class Permutations extends BacktrackAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'permutations',
    name: 'Permutations',
    category: BACKTRACKING_CATEGORY,
    group: 'Enumeration',
    description:
      'Enumerates every ordering of a set by choosing an unused element at each depth and undoing the choice on the way back up. No branch is ever pruned, so the recursion tree is a perfectly regular n! fan-out — the cleanest possible view of how a backtracking search is shaped.',
    complexity: {
      time: { best: 'O(n·n!)', average: 'O(n·n!)', worst: 'O(n·n!)' },
      space: 'O(n)',
    },
    accent: '#fbbf24',
  };

  makeInput(size: number, random: () => number): BacktrackInput {
    // n! grows brutally; 6 already means 720 leaves and several thousand steps.
    const n = Math.max(3, Math.min(size, 6));
    const values = Array.from({ length: n }, () => randInt(random, 1, 9));

    return {
      // A single row: the board shows the permutation being built.
      width: n,
      height: 1,
      initial: new Array<number>(n).fill(0),
      payload: { values },
      title: `all ${factorial(n)} orderings of ${n} values`,
      board: 'cells',
    };
  }

  protected search(t: BacktrackTracer): void {
    const { values } = t.payload<{ values: number[] }>();
    const n = values.length;
    const used = new Array<boolean>(n).fill(false);
    let found = 0;

    const build = (depth: number): void => {
      if (t.isTruncated) return;
      if (depth === n) {
        found += 1;
        t.at(2).accept(`permutation #${found}: ${currentPrefix(t, n)}`);
        return;
      }

      for (let i = 0; i < n; i += 1) {
        if (used[i]) continue;

        t.at(4).enter(String(values[i]), `place ${values[i]} at position ${depth}`);
        used[i] = true;
        t.at(5).place(depth, values[i]);

        build(depth + 1);

        used[i] = false;
        t.at(7).unplace(depth, `take ${values[i]} back out of position ${depth}`);
        t.leave();
      }
    };

    t.at(1).enter('root', 'start with an empty ordering');
    build(0);
    t.leave(`${found} permutations generated`);
  }
}

function currentPrefix(t: BacktrackTracer, n: number): string {
  return Array.from({ length: n }, (_, i) => t.cell(i)).join(' ');
}

function factorial(n: number): number {
  let out = 1;
  for (let i = 2; i <= n; i += 1) out *= i;
  return out;
}
