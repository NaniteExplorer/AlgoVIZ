import type { AlgorithmMeta } from '../types';
import { DPAlgorithm, DP_CATEGORY, randInt } from './DPAlgorithm';
import type { DPInput } from './DPStep';
import type { DPTracer } from './DPTracer';

interface Item {
  weight: number;
  value: number;
}

interface Payload {
  items: Item[];
  capacity: number;
}

/**
 * 0/1 knapsack.
 *
 * The canonical "grid DP": every cell asks one question — *is this item worth
 * taking, given this much remaining capacity?* — and answers it by looking at
 * exactly two cells in the row above. The traceback at the end is what turns an
 * optimal *value* into an actual set of items, which is the part most
 * explanations skip.
 */
export class Knapsack01 extends DPAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'knapsack-01',
    name: '0/1 Knapsack',
    category: DP_CATEGORY,
    group: 'Grid DP',
    description:
      'Chooses a subset of items with maximum total value under a weight limit, where each item may be taken at most once. Each cell answers "best value using the first i items with capacity w", built from the two cells directly above it — take the item, or skip it.',
    complexity: {
      time: { best: 'O(nW)', average: 'O(nW)', worst: 'O(nW)' },
      space: 'O(nW)',
    },
    accent: '#22d3ee',
  };

  makeInput(size: number, random: () => number): DPInput {
    const count = Math.max(3, Math.min(size, 10));
    const items: Item[] = Array.from({ length: count }, () => ({
      weight: randInt(random, 1, 6),
      value: randInt(random, 3, 20),
    }));
    // Roughly half the total weight makes the choice genuinely interesting:
    // large enough to fit several items, tight enough to force trade-offs.
    const capacity = Math.max(
      4,
      Math.min(12, Math.round(items.reduce((s, i) => s + i.weight, 0) / 2)),
    );

    return {
      rows: count + 1,
      cols: capacity + 1,
      rowLabels: ['∅', ...items.map((i) => `${i.value}v/${i.weight}kg`)],
      colLabels: Array.from({ length: capacity + 1 }, (_, w) => String(w)),
      payload: { items, capacity } satisfies Payload,
      title: `${count} items, capacity ${capacity}`,
    };
  }

  protected solve(t: DPTracer): void {
    const { items, capacity } = t.payload<Payload>();

    // Row 0 is the empty item set: zero value at every capacity.
    t.at(1);
    for (let w = 0; w <= capacity; w += 1) t.write(0, w, 0);

    for (let i = 1; i <= items.length; i += 1) {
      const item = items[i - 1];
      // Column 0 is zero capacity: nothing fits.
      t.at(2).write(i, 0, 0);

      for (let w = 1; w <= capacity; w += 1) {
        t.at(4).focus(i, w, `item ${i} (${item.value}v/${item.weight}kg), capacity ${w}`);

        const skip = t.at(5).read(i - 1, w);
        if (item.weight > w) {
          t.at(6).decide(i, w, 'skip', 'item is heavier than the remaining capacity');
          t.write(i, w, skip, [[i - 1, w]]);
          continue;
        }

        const take = item.value + t.at(7).read(i - 1, w - item.weight);
        if (take > skip) {
          t.at(8).decide(i, w, 'take', `take it: ${item.value} + ${take - item.value} = ${take}`);
          t.write(i, w, take, [
            [i - 1, w],
            [i - 1, w - item.weight],
          ]);
        } else {
          t.at(9).decide(i, w, 'skip', `skipping is worth more (${skip} ≥ ${take})`);
          t.write(i, w, skip, [
            [i - 1, w],
            [i - 1, w - item.weight],
          ]);
        }
      }
    }

    // Traceback: walk up from the corner, stepping left whenever the value
    // changed — that change is exactly "this item was taken".
    t.at(11);
    let w = capacity;
    for (let i = items.length; i > 0; i -= 1) {
      t.trace(i, w);
      if (t.peek(i, w) !== t.peek(i - 1, w)) {
        w -= items[i - 1].weight;
        t.at(12).decide(i, w + items[i - 1].weight, '✓', `item ${i} is in the optimal set`);
      }
    }
    t.trace(0, w);
  }
}
