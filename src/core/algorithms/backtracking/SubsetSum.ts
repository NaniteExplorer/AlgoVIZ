import type { AlgorithmMeta } from '../types';
import { BacktrackAlgorithm, BACKTRACKING_CATEGORY, randInt } from './BacktrackAlgorithm';
import type { BacktrackInput } from './BacktrackStep';
import type { BacktrackTracer } from './BacktrackTracer';

const TAKEN = 1;

interface Payload {
  values: number[];
  target: number;
}

/**
 * Subset sum with pruning.
 *
 * Placed next to 0/1 knapsack on purpose: the two solve structurally identical
 * problems, one by exhaustive search with pruning and one by filling a table.
 * Watching the backtracking version explore thousands of branches that the DP
 * table settles in a few dozen cells is the most persuasive argument for
 * dynamic programming in the whole catalog.
 */
export class SubsetSum extends BacktrackAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'subset-sum',
    name: 'Subset Sum',
    category: BACKTRACKING_CATEGORY,
    group: 'Enumeration',
    description:
      'Decides whether any subset of a set sums exactly to a target, by trying "take it" and "skip it" at every element. Two prunes cut the tree hard: stop once the running total overshoots, and stop once even taking everything left cannot reach the target. Compare it with 0/1 Knapsack to see what a DP table buys you.',
    complexity: {
      time: { best: 'O(n)', average: 'O(2ⁿ)', worst: 'O(2ⁿ)' },
      space: 'O(n)',
    },
    accent: '#38bdf8',
  };

  makeInput(size: number, random: () => number): BacktrackInput {
    const n = Math.max(4, Math.min(size, 14));
    const values = Array.from({ length: n }, () => randInt(random, 2, 25));
    // Build the target from an actual subset so a solution is guaranteed to
    // exist — a search that always fails shows pruning but never success.
    const target = values
      .filter(() => random() < 0.45)
      .reduce((sum, v) => sum + v, 0) || values[0];

    return {
      width: n,
      height: 1,
      initial: new Array<number>(n).fill(0),
      payload: { values, target } satisfies Payload,
      title: `reach ${target} from ${n} values`,
      board: 'cells',
    };
  }

  protected search(t: BacktrackTracer): void {
    const { values, target } = t.payload<Payload>();
    const n = values.length;

    // Suffix sums power the second prune: if everything remaining still can't
    // close the gap, the whole subtree is hopeless.
    const remaining = new Array<number>(n + 1).fill(0);
    for (let i = n - 1; i >= 0; i -= 1) remaining[i] = remaining[i + 1] + values[i];

    const explore = (index: number, sum: number): boolean => {
      if (t.isTruncated) return false;

      if (sum === target) {
        t.at(2).accept(`subset found: total is exactly ${target}`);
        return true;
      }
      if (index === n) {
        t.at(3).reject('ran out of values');
        return false;
      }
      if (sum > target) {
        t.at(4).reject(`${sum} already overshoots ${target}`);
        return false;
      }
      if (sum + remaining[index] < target) {
        t.at(5).reject(`even taking everything left only reaches ${sum + remaining[index]}`);
        return false;
      }

      t.at(7).enter(`+${values[index]}`, `take ${values[index]} (total ${sum + values[index]})`);
      t.place(index, TAKEN);
      if (explore(index + 1, sum + values[index])) return true;
      t.unplace(index);
      t.leave();

      t.at(9).enter('skip', `skip ${values[index]} (total stays ${sum})`);
      if (explore(index + 1, sum)) return true;
      t.leave();

      return false;
    };

    t.at(1).enter('root', `looking for a subset summing to ${target}`);
    if (!explore(0, 0)) t.reject('no subset reaches the target');
    t.leave();
  }
}
