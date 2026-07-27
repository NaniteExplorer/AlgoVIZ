import type { AlgorithmMeta } from '../types';
import { randInt, StructureAlgorithm, STRUCTURES_CATEGORY } from './StructureAlgorithm';
import type { StructureInput, StructureOp } from './StructureStep';
import type { StructureTracer } from './StructureTracer';

interface Vertex {
  node: number;
  value: number;
  left: Vertex | null;
  right: Vertex | null;
  height: number;
}

/**
 * AVL tree with self-balancing rotations.
 *
 * The payoff of the whole Trees group. A plain BST fed ascending keys degrades
 * into a linked list; an AVL tree rotates and stays logarithmic. The generator
 * therefore *deliberately* inserts a run of ascending values, so the rotations
 * are guaranteed to fire rather than being a rare accident.
 */
export class AVLRotations extends StructureAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'avl-tree',
    name: 'AVL Tree',
    category: STRUCTURES_CATEGORY,
    group: 'Trees',
    description:
      'A binary search tree that rotates to keep the two subtrees of every node within one level of each other. Feed a plain BST ascending keys and it degenerates into a linked list; an AVL tree performs a rotation and stays logarithmic. The four rebalancing cases — LL, RR, LR, RL — are all shown.',
    complexity: {
      time: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
      space: 'O(n)',
    },
    accent: '#f472b6',
  };

  makeInput(size: number, random: () => number): StructureInput {
    const count = Math.max(5, Math.min(size + 2, 12));
    const ops: StructureOp[] = [];

    // Start with a strictly ascending run: this is the pathological case for a
    // plain BST, and it forces AVL to rotate on almost every insertion.
    let value = randInt(random, 5, 15);
    const ascending = Math.ceil(count / 2);
    for (let i = 0; i < ascending; i += 1) {
      ops.push({ kind: 'insert', value });
      value += randInt(random, 3, 12);
    }
    // Then some scattered keys to exercise the LR and RL cases too.
    const used = new Set(ops.map((o) => o.value));
    while (ops.length < count) {
      const v = randInt(random, 1, value);
      if (used.has(v)) continue;
      used.add(v);
      ops.push({ kind: 'insert', value: v });
    }

    return {
      layout: 'tree',
      ops,
      title: `${count} insertions with rebalancing`,
    };
  }

  protected execute(t: StructureTracer): void {
    let root: Vertex | null = null;

    const height = (v: Vertex | null) => (v ? v.height : 0);
    const balance = (v: Vertex) => height(v.left) - height(v.right);

    const refresh = (v: Vertex) => {
      v.height = 1 + Math.max(height(v.left), height(v.right));
    };

    /** Re-emit a vertex's child links so the renderer follows the new shape. */
    const relink = (v: Vertex) => {
      if (v.left) t.link(v.node, 'left', v.left.node);
      else t.unlink(v.node, 'left');
      if (v.right) t.link(v.node, 'right', v.right.node);
      else t.unlink(v.node, 'right');
    };

    const rotateRight = (y: Vertex): Vertex => {
      const x = y.left as Vertex;
      t.at(9).tag(y.node, 'unbalanced', `rotate right at ${y.value}`);
      y.left = x.right;
      x.right = y;
      refresh(y);
      refresh(x);
      relink(y);
      relink(x);
      return x;
    };

    const rotateLeft = (x: Vertex): Vertex => {
      const y = x.right as Vertex;
      t.at(10).tag(x.node, 'unbalanced', `rotate left at ${x.value}`);
      x.right = y.left;
      y.left = x;
      refresh(x);
      refresh(y);
      relink(x);
      relink(y);
      return y;
    };

    const insert = (vertex: Vertex | null, value: number): Vertex => {
      if (!vertex) {
        const node = t.create(value);
        t.at(2).focus(node, `insert ${value} as a new leaf`);
        return { node, value, left: null, right: null, height: 1 };
      }

      t.at(3).compare(vertex.node, vertex.node, `${value} vs ${vertex.value}`);
      if (value < vertex.value) vertex.left = insert(vertex.left, value);
      else vertex.right = insert(vertex.right, value);

      refresh(vertex);
      relink(vertex);

      const factor = balance(vertex);
      if (Math.abs(factor) <= 1) return vertex;

      // The four classic cases. LR and RL need a preparatory rotation on the
      // child before the outer one applies.
      t.at(7).tag(vertex.node, 'unbalanced', `balance factor ${factor} at ${vertex.value}`);
      if (factor > 1 && vertex.left && value < vertex.left.value) return rotateRight(vertex);
      if (factor < -1 && vertex.right && value > vertex.right.value) return rotateLeft(vertex);
      if (factor > 1 && vertex.left) {
        vertex.left = rotateLeft(vertex.left);
        relink(vertex);
        return rotateRight(vertex);
      }
      if (factor < -1 && vertex.right) {
        vertex.right = rotateRight(vertex.right);
        relink(vertex);
        return rotateLeft(vertex);
      }
      return vertex;
    };

    for (const op of t.ops) {
      t.at(1).phase(`insert ${op.value}`);
      root = insert(root, op.value);
      t.at(12).phase(`height is now ${height(root)}`);
    }
  }
}
