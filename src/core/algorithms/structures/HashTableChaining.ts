import type { AlgorithmMeta } from '../types';
import { makeOpScript, StructureAlgorithm, STRUCTURES_CATEGORY } from './StructureAlgorithm';
import type { StructureInput } from './StructureStep';
import type { StructureTracer } from './StructureTracer';

/**
 * Hash table with separate chaining.
 *
 * Collisions are the whole story. A deliberately small bucket count guarantees
 * plenty of them, so the chains actually grow and the reader can see why load
 * factor — not table size — is what governs lookup cost.
 */
export class HashTableChaining extends StructureAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'hash-chaining',
    name: 'Hash Table (Chaining)',
    category: STRUCTURES_CATEGORY,
    group: 'Hashing',
    description:
      'Resolves collisions by hanging a linked list off each bucket. Lookup is constant time plus a walk down one chain, so the cost is governed by the load factor — keys per bucket — rather than by the table size. A small table here keeps collisions frequent enough to watch.',
    complexity: {
      time: { best: 'O(1)', average: 'O(1 + α)', worst: 'O(n)' },
      space: 'O(n)',
    },
    accent: '#a78bfa',
  };

  makeInput(size: number, random: () => number): StructureInput {
    const count = Math.max(6, Math.min(size + 4, 18));
    // Fewer buckets than keys, on purpose: a table with no collisions
    // demonstrates nothing.
    const capacity = Math.max(4, Math.round(count / 2.2));
    return {
      layout: 'buckets',
      ops: makeOpScript(count, random, { insert: 'insert', remove: 'delete', find: 'search' }),
      capacity,
      title: `${count} keys into ${capacity} buckets`,
    };
  }

  protected execute(t: StructureTracer): void {
    const buckets = t.capacity;
    // Head node id per bucket, or undefined when the bucket is empty.
    const heads: (number | undefined)[] = new Array(buckets).fill(undefined);

    const hash = (value: number) => value % buckets;

    for (const op of t.ops) {
      const bucket = hash(op.value);

      if (op.kind === 'insert') {
        t.at(1).phase(`insert ${op.value} → bucket ${bucket}`);
        const node = t.create(op.value, { slot: bucket });

        const head = heads[bucket];
        if (head === undefined) {
          heads[bucket] = node;
          t.at(2).focus(node, `bucket ${bucket} was empty`);
          continue;
        }

        // Prepend: O(1), and it keeps the newest key nearest the bucket.
        t.at(4).tag(node, 'collision', `collision in bucket ${bucket}`);
        t.at(5).link(node, 'next', head, 'chain the new key in front');
        heads[bucket] = node;
        continue;
      }

      if (op.kind === 'search') {
        t.at(7).phase(`search ${op.value} → bucket ${bucket}`);
        let cursor = heads[bucket];
        while (cursor !== undefined) {
          t.at(8).focus(cursor);
          t.compare(cursor, cursor, `is ${t.valueOf(cursor)} = ${op.value}?`);
          if (t.valueOf(cursor) === op.value) {
            t.at(9).tag(cursor, 'found', `found after walking the chain`);
            break;
          }
          cursor = t.portOf(cursor, 'next');
        }
        continue;
      }

      // Delete: walk the chain and splice.
      t.at(11).phase(`delete ${op.value} → bucket ${bucket}`);
      let previous: number | undefined;
      let cursor = heads[bucket];
      while (cursor !== undefined && t.valueOf(cursor) !== op.value) {
        t.at(12).focus(cursor);
        previous = cursor;
        cursor = t.portOf(cursor, 'next');
      }
      if (cursor === undefined) continue;

      const after = t.portOf(cursor, 'next');
      t.at(13).tag(cursor, 'removing');
      if (previous === undefined) heads[bucket] = after;
      else if (after === undefined) t.at(14).unlink(previous, 'next');
      else t.at(14).link(previous, 'next', after, 'splice the chain');
      t.destroy(cursor);
    }
  }
}
