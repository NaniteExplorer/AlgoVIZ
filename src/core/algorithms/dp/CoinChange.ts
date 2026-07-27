import type { AlgorithmMeta } from '../types';
import { DPAlgorithm, DP_CATEGORY, randInt } from './DPAlgorithm';
import type { DPInput } from './DPStep';
import type { DPTracer } from './DPTracer';

interface Payload {
  coins: number[];
  target: number;
}

/** Denomination sets chosen so the greedy answer is sometimes wrong. */
const COIN_SETS = [
  [1, 3, 4],
  [1, 5, 6, 9],
  [2, 5, 7],
  [1, 4, 5],
];

const UNREACHABLE = 9999;

/**
 * Minimum-coin change.
 *
 * Worth its place in the catalog specifically because greedy fails on it: with
 * coins {1, 3, 4} and a target of 6, taking the largest coin first gives
 * 4+1+1 = three coins, while the optimal answer is 3+3 = two. The table shows
 * exactly where the greedy path diverges.
 */
export class CoinChange extends DPAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'coin-change',
    name: 'Coin Change',
    category: DP_CATEGORY,
    group: 'Grid DP',
    description:
      'Finds the fewest coins that sum to a target amount, given unlimited coins of each denomination. Every amount looks back one coin-value at a time and keeps the cheapest option. Unlike the greedy approach, this is always optimal — with coins {1,3,4}, greedy pays three coins for 6 where two suffice.',
    complexity: {
      time: { best: 'O(nA)', average: 'O(nA)', worst: 'O(nA)' },
      space: 'O(nA)',
    },
    accent: '#fbbf24',
  };

  makeInput(size: number, random: () => number): DPInput {
    const coins = COIN_SETS[randInt(random, 0, COIN_SETS.length - 1)];
    const target = Math.max(6, Math.min(size + 4, 18));

    return {
      rows: coins.length + 1,
      cols: target + 1,
      rowLabels: ['∅', ...coins.map((c) => `${c}¢`)],
      colLabels: Array.from({ length: target + 1 }, (_, a) => String(a)),
      payload: { coins, target } satisfies Payload,
      title: `coins {${coins.join(', ')}} → ${target}¢`,
    };
  }

  protected solve(t: DPTracer): void {
    const { coins, target } = t.payload<Payload>();

    // Row 0: with no coins, only zero is reachable. A large sentinel stands in
    // for infinity so the `min` arithmetic stays in plain integers.
    t.at(1).write(0, 0, 0);
    for (let a = 1; a <= target; a += 1) t.write(0, a, UNREACHABLE);

    for (let i = 1; i <= coins.length; i += 1) {
      const coin = coins[i - 1];
      t.at(2).write(i, 0, 0);

      for (let a = 1; a <= target; a += 1) {
        t.at(4).focus(i, a, `amount ${a}¢ with coins up to ${coin}¢`);

        const without = t.at(5).read(i - 1, a);
        if (coin > a) {
          t.at(6).decide(i, a, 'skip', `${coin}¢ is larger than ${a}¢`);
          t.write(i, a, without, [[i - 1, a]]);
          continue;
        }

        // Reading the *same* row at a - coin is what allows unlimited reuse of
        // a denomination — the distinction from 0/1 knapsack, in one index.
        const withCoin = t.at(7).read(i, a - coin) + 1;
        if (withCoin < without) {
          t.at(8).decide(i, a, `use ${coin}¢`, `${withCoin} coins beats ${formatCount(without)}`);
          t.write(i, a, withCoin, [
            [i - 1, a],
            [i, a - coin],
          ]);
        } else {
          t.at(9).decide(i, a, 'skip', `${formatCount(without)} already as good`);
          t.write(i, a, without, [
            [i - 1, a],
            [i, a - coin],
          ]);
        }
      }
    }

    // Traceback names the actual coins used.
    t.at(11);
    let i = coins.length;
    let a = target;
    const used: number[] = [];
    while (a > 0 && i > 0) {
      t.trace(i, a);
      if (t.peek(i, a) === t.peek(i - 1, a)) {
        i -= 1;
      } else {
        used.push(coins[i - 1]);
        a -= coins[i - 1];
      }
    }

    const best = t.peek(coins.length, target);
    t.trace(
      Math.max(i, 0),
      Math.max(a, 0),
      best >= UNREACHABLE ? 'target is unreachable' : `${used.join(' + ')} = ${target}¢`,
    );
  }
}

function formatCount(value: number): string {
  return value >= UNREACHABLE ? 'unreachable' : `${value} coins`;
}
