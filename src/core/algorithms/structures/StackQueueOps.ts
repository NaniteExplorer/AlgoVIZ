import type { AlgorithmMeta } from '../types';
import { randInt, StructureAlgorithm, STRUCTURES_CATEGORY } from './StructureAlgorithm';
import type { StructureInput, StructureOp } from './StructureStep';
import type { StructureTracer } from './StructureTracer';

/**
 * Stack and queue side by side.
 *
 * Deliberately one algorithm rather than two: the entire lesson is the
 * *difference* between them, and running the identical operation script through
 * both — LIFO on the left, FIFO on the right — makes that difference impossible
 * to miss. Two separate pages would show two piles of boxes.
 */
export class StackQueueOps extends StructureAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'stack-queue',
    name: 'Stack vs Queue',
    category: STRUCTURES_CATEGORY,
    group: 'Linear',
    description:
      'Runs one identical script of pushes and pops through both a stack and a queue at the same time. Same inputs, same operations — but LIFO reverses the order and FIFO preserves it. Everything that separates the two structures is visible in the divergence.',
    complexity: {
      time: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' },
      space: 'O(n)',
    },
    accent: '#fbbf24',
  };

  makeInput(size: number, random: () => number): StructureInput {
    const count = Math.max(6, Math.min(size + 4, 16));
    const ops: StructureOp[] = [];
    let held = 0;

    for (let i = 0; i < count; i += 1) {
      // Push while the container is small or early in the script, so it never
      // spends the whole run empty.
      const push = held === 0 || (i < count * 0.4 ? true : random() < 0.55);
      if (push) {
        ops.push({ kind: 'push', value: randInt(random, 10, 99) });
        held += 1;
      } else {
        ops.push({ kind: 'pop', value: 0 });
        held -= 1;
      }
    }

    return {
      layout: 'stack',
      ops,
      title: `${count} operations, LIFO vs FIFO`,
    };
  }

  protected execute(t: StructureTracer): void {
    // Slot 0 is the stack lane, slot 1 the queue lane.
    const stack: number[] = [];
    const queue: number[] = [];
    const removed: number[] = [];

    for (const op of t.ops) {
      if (op.kind === 'push') {
        t.at(1).phase(`push ${op.value}`);
        const onStack = t.create(op.value, { slot: 0, label: String(op.value) });
        const onQueue = t.create(op.value, { slot: 1, label: String(op.value) });
        stack.push(onStack);
        queue.push(onQueue);
        t.at(2).focus(onStack, 'the stack grows at the top');
        t.at(3).focus(onQueue, 'the queue grows at the back');
        continue;
      }

      t.at(5).phase('pop / dequeue');
      // LIFO: the most recent push.
      const popped = stack.pop();
      if (popped !== undefined) {
        t.at(6).tag(popped, 'removing', `stack pops ${t.valueOf(popped)} — the newest`);
        removed.push(popped);
      }
      // FIFO: the oldest push still present.
      const dequeued = queue.shift();
      if (dequeued !== undefined) {
        t.at(7).tag(dequeued, 'removing', `queue removes ${t.valueOf(dequeued)} — the oldest`);
        removed.push(dequeued);
      }

      // Destroy after both are tagged, so the contrast is visible for a beat.
      for (const node of removed.splice(0)) t.destroy(node);
    }
  }
}
