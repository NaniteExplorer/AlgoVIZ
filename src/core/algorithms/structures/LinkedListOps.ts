import type { AlgorithmMeta } from '../types';
import { makeOpScript, StructureAlgorithm, STRUCTURES_CATEGORY } from './StructureAlgorithm';
import type { StructureInput } from './StructureStep';
import type { StructureTracer } from './StructureTracer';

/**
 * Singly linked list operations.
 *
 * The structure that makes pointers concrete. Insertion is O(1) *once you are
 * there*, and getting there is O(n) — a distinction that a diagram of arrows
 * makes obvious and that a complexity table never quite does.
 */
export class LinkedListOps extends StructureAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'linked-list',
    name: 'Linked List',
    category: STRUCTURES_CATEGORY,
    group: 'Linear',
    description:
      'Insertion, deletion and search on a singly linked list. Every operation has to walk from the head, so the cost is dominated by traversal — relinking itself is a single pointer write. Watching the cursor step node by node is the clearest argument for why arrays and lists trade off the way they do.',
    complexity: {
      time: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' },
      space: 'O(n)',
    },
    accent: '#22d3ee',
  };

  makeInput(size: number, random: () => number): StructureInput {
    const count = Math.max(4, Math.min(size, 14));
    return {
      layout: 'chain',
      ops: makeOpScript(count, random, { insert: 'insert', remove: 'delete', find: 'search' }),
      title: `${count} operations on a singly linked list`,
    };
  }

  protected execute(t: StructureTracer): void {
    let head: number | undefined;

    for (const op of t.ops) {
      if (op.kind === 'insert') {
        t.at(1).phase(`insert ${op.value}`);
        const node = t.create(op.value);

        if (head === undefined) {
          t.at(2).link(node, 'head', node, 'the list was empty — this is the new head');
          t.unlink(node, 'head');
          head = node;
          continue;
        }

        // Append at the tail so the list grows left-to-right on screen, which
        // matches how people draw one.
        let cursor = head;
        t.at(3).focus(cursor, 'start at the head');
        for (;;) {
          const next = t.portOf(cursor, 'next');
          if (next === undefined) break;
          cursor = next;
          t.at(4).focus(cursor, 'walk to the next node');
        }
        t.at(5).link(cursor, 'next', node, `link ${t.valueOf(cursor)} → ${op.value}`);
        continue;
      }

      if (op.kind === 'search') {
        t.at(7).phase(`search for ${op.value}`);
        let cursor = head;
        while (cursor !== undefined) {
          t.at(8).focus(cursor);
          t.compare(cursor, cursor, `is ${t.valueOf(cursor)} = ${op.value}?`);
          if (t.valueOf(cursor) === op.value) {
            t.at(9).tag(cursor, 'found', `found ${op.value}`);
            break;
          }
          cursor = t.portOf(cursor, 'next');
        }
        continue;
      }

      // Delete: find the predecessor, then splice around the victim.
      t.at(11).phase(`delete ${op.value}`);
      let previous: number | undefined;
      let cursor = head;
      while (cursor !== undefined && t.valueOf(cursor) !== op.value) {
        t.at(12).focus(cursor);
        previous = cursor;
        cursor = t.portOf(cursor, 'next');
      }
      if (cursor === undefined) continue;

      t.at(13).tag(cursor, 'removing', `remove ${op.value}`);
      const after = t.portOf(cursor, 'next');
      if (previous === undefined) {
        head = after;
      } else if (after === undefined) {
        t.at(14).unlink(previous, 'next');
      } else {
        t.at(14).link(previous, 'next', after, 'splice the predecessor past the victim');
      }
      t.destroy(cursor);
    }
  }
}
