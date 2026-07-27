import type { AlgorithmMeta } from '../types';
import { randInt, StructureAlgorithm, STRUCTURES_CATEGORY } from './StructureAlgorithm';
import type { StructureInput, StructureOp } from './StructureStep';
import type { StructureTracer } from './StructureTracer';

/**
 * Segment tree with range queries and point updates.
 *
 * The structure that answers "sum of this range" in logarithmic time and, more
 * importantly, keeps answering it correctly after the underlying data changes.
 * A prefix-sum array beats it for a static array and loses completely the
 * moment a single element is updated — which is the comparison worth drawing.
 */
export class SegmentTreeOps extends StructureAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'segment-tree',
    name: 'Segment Tree',
    category: STRUCTURES_CATEGORY,
    group: 'Trees',
    description:
      'Answers range-sum queries in logarithmic time and stays correct under updates. Each node stores the sum of one interval; a query decomposes into a handful of covering nodes, and an update walks a single root-to-leaf path. Prefix sums are faster for static data, and useless the moment an element changes.',
    complexity: {
      time: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
      space: 'O(n)',
    },
    accent: '#67e8f9',
  };

  makeInput(size: number, random: () => number): StructureInput {
    // Powers of two keep the tree perfect, which makes the interval
    // decomposition far easier to read.
    const leaves = size <= 6 ? 4 : size <= 10 ? 8 : 16;
    const ops: StructureOp[] = [];

    for (let i = 0; i < leaves; i += 1) {
      ops.push({ kind: 'insert', value: randInt(random, 1, 20) });
    }
    // A few queries, then an update, then the same kind of query again — so the
    // point of the structure (surviving mutation) actually gets demonstrated.
    for (let i = 0; i < 2; i += 1) {
      const lo = randInt(random, 0, leaves - 2);
      ops.push({ kind: 'query', value: lo, extra: randInt(random, lo + 1, leaves - 1) });
    }
    ops.push({ kind: 'update', value: randInt(random, 0, leaves - 1), extra: randInt(random, 1, 20) });
    const lo = randInt(random, 0, leaves - 2);
    ops.push({ kind: 'query', value: lo, extra: randInt(random, lo + 1, leaves - 1) });

    return {
      layout: 'tree',
      ops,
      capacity: leaves,
      title: `${leaves} leaves — range sums with updates`,
    };
  }

  protected execute(t: StructureTracer): void {
    const values = t.ops.filter((op) => op.kind === 'insert').map((op) => op.value);
    const n = values.length;
    if (n === 0) return;

    // Node ids for a 1-indexed implicit tree: node i covers a fixed interval,
    // children at 2i and 2i+1.
    const nodes = new Map<number, number>();
    const sums = new Map<number, number>();

    const build = (index: number, lo: number, hi: number): number => {
      const node = t.create(0, { label: lo === hi ? String(values[lo]) : undefined });
      nodes.set(index, node);

      if (lo === hi) {
        sums.set(index, values[lo]);
        t.at(2).update(node, values[lo], `leaf ${lo} = ${values[lo]}`);
        return values[lo];
      }

      const mid = (lo + hi) >> 1;
      const left = build(2 * index, lo, mid);
      const right = build(2 * index + 1, mid + 1, hi);
      const total = left + right;
      sums.set(index, total);

      t.link(node, 'left', nodes.get(2 * index) as number);
      t.link(node, 'right', nodes.get(2 * index + 1) as number);
      t.at(3).update(node, total, `[${lo}..${hi}] sums to ${total}`);
      return total;
    };

    t.at(1).phase(`build a segment tree over ${n} values`);
    build(1, 0, n - 1);

    const query = (index: number, lo: number, hi: number, ql: number, qr: number): number => {
      const node = nodes.get(index) as number;
      // Disjoint: this whole subtree is irrelevant.
      if (qr < lo || hi < ql) return 0;

      // Fully covered: one node answers for the entire interval. This is the
      // step that makes the query logarithmic.
      if (ql <= lo && hi <= qr) {
        t.at(6).tag(node, 'found', `[${lo}..${hi}] is fully inside the query — take ${sums.get(index)}`);
        return sums.get(index) as number;
      }

      t.at(7).focus(node, `[${lo}..${hi}] partially overlaps — descend`);
      const mid = (lo + hi) >> 1;
      return (
        query(2 * index, lo, mid, ql, qr) + query(2 * index + 1, mid + 1, hi, ql, qr)
      );
    };

    const update = (index: number, lo: number, hi: number, position: number, value: number): void => {
      const node = nodes.get(index) as number;
      if (lo === hi) {
        sums.set(index, value);
        t.at(10).update(node, value, `leaf ${lo} becomes ${value}`);
        return;
      }
      t.at(11).focus(node, `descend toward leaf ${position}`);
      const mid = (lo + hi) >> 1;
      if (position <= mid) update(2 * index, lo, mid, position, value);
      else update(2 * index + 1, mid + 1, hi, position, value);

      // Recompute on the way back up: one path, log n nodes touched.
      const total = (sums.get(2 * index) ?? 0) + (sums.get(2 * index + 1) ?? 0);
      sums.set(index, total);
      t.at(12).update(node, total, `[${lo}..${hi}] recomputes to ${total}`);
    };

    for (const op of t.ops) {
      if (op.kind === 'query') {
        const lo = op.value;
        const hi = op.extra ?? lo;
        t.at(5).phase(`sum of [${lo}..${hi}]`);
        const total = query(1, 0, n - 1, lo, hi);
        t.at(8).phase(`sum of [${lo}..${hi}] = ${total}`);
      } else if (op.kind === 'update') {
        t.at(9).phase(`set index ${op.value} to ${op.extra}`);
        update(1, 0, n - 1, op.value, op.extra ?? 0);
      }
    }
  }
}
