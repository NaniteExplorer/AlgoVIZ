import type { AlgorithmMeta } from '../types';
import { makeOpScript, StructureAlgorithm, STRUCTURES_CATEGORY } from './StructureAlgorithm';
import type { StructureInput } from './StructureStep';
import type { StructureTracer } from './StructureTracer';

/**
 * Hash table with open addressing (linear probing).
 *
 * The counterpart to chaining, and the pair is the point: same problem,
 * opposite trade-off. Everything lives in one flat array, so there are no
 * pointer hops and excellent cache behaviour — but collisions form *clusters*
 * that make each other worse, which is visible here as a growing run of
 * occupied slots.
 */
export class HashTableOpenAddressing extends StructureAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'hash-open-addressing',
    name: 'Hash Table (Open Addressing)',
    category: STRUCTURES_CATEGORY,
    group: 'Hashing',
    description:
      'Stores every key directly in the table, probing forward one slot at a time on a collision. No pointers means excellent cache behaviour, but collisions form clusters that lengthen each other — watch a run of occupied slots grow and start absorbing unrelated keys.',
    complexity: {
      time: { best: 'O(1)', average: 'O(1/(1-α))', worst: 'O(n)' },
      space: 'O(n)',
    },
    accent: '#fb7185',
  };

  makeInput(size: number, random: () => number): StructureInput {
    const count = Math.max(5, Math.min(size + 2, 13));
    // Load factor around 0.65: high enough to cluster, low enough to never
    // fill the table (which would make insertion fail rather than teach).
    const capacity = Math.max(8, Math.round(count / 0.65));
    return {
      layout: 'array',
      ops: makeOpScript(count, random, { insert: 'insert', find: 'search' }),
      capacity,
      title: `${count} keys into ${capacity} slots (linear probing)`,
    };
  }

  protected execute(t: StructureTracer): void {
    const slots = t.capacity;
    const table: (number | undefined)[] = new Array(slots).fill(undefined);

    const hash = (value: number) => value % slots;

    for (const op of t.ops) {
      const home = hash(op.value);

      if (op.kind === 'insert') {
        t.at(1).phase(`insert ${op.value} → home slot ${home}`);

        let probe = home;
        let steps = 0;
        while (table[probe] !== undefined && steps < slots) {
          t.at(3).focus(table[probe] as number, `slot ${probe} is taken — probe forward`);
          t.tag(table[probe] as number, 'collision');
          probe = (probe + 1) % slots;
          steps += 1;
        }
        if (steps >= slots) continue; // table full; the generator prevents this

        const node = t.create(op.value, { slot: probe });
        table[probe] = node;
        t.at(4).focus(
          node,
          steps === 0 ? `landed in its home slot` : `placed ${steps} slot${steps === 1 ? '' : 's'} away`,
        );
        continue;
      }

      // Search: probe forward from the home slot until the key or a gap.
      t.at(6).phase(`search ${op.value} → home slot ${home}`);
      let probe = home;
      for (let steps = 0; steps < slots; steps += 1) {
        const node = table[probe];
        if (node === undefined) {
          // An empty slot proves the key is absent — this is exactly why
          // deletion in open addressing needs tombstones.
          t.at(8).phase(`slot ${probe} is empty — ${op.value} is not in the table`);
          break;
        }
        t.at(7).focus(node);
        t.compare(node, node, `is ${t.valueOf(node)} = ${op.value}?`);
        if (t.valueOf(node) === op.value) {
          t.at(9).tag(node, 'found', `found after ${steps} probe${steps === 1 ? '' : 's'}`);
          break;
        }
        probe = (probe + 1) % slots;
      }
    }
  }
}
