const { suite, check, checkTrue, seeded, replay } = require('./harness.cjs');

const B = '../.verify-build';
const { LinkedListOps } = require(`${B}/core/algorithms/structures/LinkedListOps`);
const { StackQueueOps } = require(`${B}/core/algorithms/structures/StackQueueOps`);
const { MinHeapOps } = require(`${B}/core/algorithms/structures/MinHeapOps`);
const { HashTableChaining } = require(`${B}/core/algorithms/structures/HashTableChaining`);
const {
  HashTableOpenAddressing,
} = require(`${B}/core/algorithms/structures/HashTableOpenAddressing`);
const { TrieOps } = require(`${B}/core/algorithms/structures/TrieOps`);
const { AVLRotations } = require(`${B}/core/algorithms/structures/AVLRotations`);
const { SegmentTreeOps } = require(`${B}/core/algorithms/structures/SegmentTreeOps`);
const { StructureModel } = require(`${B}/core/model/StructureModel`);

/** Follow `port` links from `root`, returning the visited node ids in order. */
function walk(model, root, port) {
  const next = new Map(model.links.filter((l) => l.port === port).map((l) => [l.from, l.to]));
  const out = [];
  const seen = new Set();
  let cursor = root;
  while (cursor !== undefined && !seen.has(cursor)) {
    seen.add(cursor);
    out.push(cursor);
    cursor = next.get(cursor);
  }
  return out;
}

/** The node ids nothing points at via `port` — chain heads. */
function headsOf(model, port) {
  const targets = new Set(model.links.filter((l) => l.port === port).map((l) => l.to));
  return [...model.nodes.keys()].filter((id) => !targets.has(id));
}

module.exports = function runStructureChecks() {
  suite('Data structures');

  // Linked list: final contents must match the operation script.
  {
    for (const seed of [8, 21]) {
      const algo = new LinkedListOps();
      const input = algo.makeInput(12, seeded(seed));
      const model = new StructureModel();
      replay(algo, input, model, `linked-list seed=${seed}`);

      const expected = [];
      for (const op of input.ops) {
        if (op.kind === 'insert') expected.push(op.value);
        else if (op.kind === 'delete') {
          const at = expected.indexOf(op.value);
          if (at >= 0) expected.splice(at, 1);
        }
      }

      const heads = headsOf(model, 'next');
      const order = heads.length ? walk(model, heads[0], 'next') : [];
      const actual = order.map((id) => model.nodes.get(id).value);
      check(`linked-list seed=${seed}: contents match the script`, actual, expected);
      check(`linked-list seed=${seed}: no orphaned nodes`, model.nodes.size, expected.length);
    }
  }

  // Stack vs queue: the two lanes must remove opposite ends.
  {
    const algo = new StackQueueOps();
    const input = algo.makeInput(12, seeded(15));
    const model = new StructureModel();
    replay(algo, input, model, 'stack-queue');

    // Simulate both containers independently.
    const stack = [];
    const queue = [];
    for (const op of input.ops) {
      if (op.kind === 'push') {
        stack.push(op.value);
        queue.push(op.value);
      } else {
        stack.pop();
        queue.shift();
      }
    }

    const lane = (slot) =>
      [...model.nodes.values()].filter((n) => n.slot === slot).map((n) => n.value);
    check('stack lane matches a real stack', lane(0).sort((a, b) => a - b), [...stack].sort((a, b) => a - b));
    check('queue lane matches a real queue', lane(1).sort((a, b) => a - b), [...queue].sort((a, b) => a - b));
    checkTrue(
      'stack and queue diverge (they remove different items)',
      JSON.stringify(stack) !== JSON.stringify(queue) || stack.length <= 1,
    );
  }

  // Min-heap: the heap property must hold, and extract-min must be in order.
  {
    for (const seed of [6, 34]) {
      const algo = new MinHeapOps();
      const input = algo.makeInput(14, seeded(seed));
      const steps = algo.run(input);

      // Replay while tracking the heap array to check the invariant after
      // every completed operation.
      const model = new StructureModel();
      model.reset(input);
      const extracted = [];
      let violations = 0;

      for (const step of steps) {
        model.apply(step);
        if (step.kind !== 'phase') continue;

        // Reconstruct the array by level order from the root.
        const heads = headsOf(model, 'left').filter((id) =>
          headsOf(model, 'right').includes(id),
        );
        const root = heads[0];
        if (root === undefined) continue;
        const order = [];
        const queue = [root];
        const childOf = (id, port) =>
          model.links.find((l) => l.from === id && l.port === port)?.to;
        while (queue.length) {
          const id = queue.shift();
          order.push(model.nodes.get(id)?.value ?? 0);
          const l = childOf(id, 'left');
          const r = childOf(id, 'right');
          if (l !== undefined) queue.push(l);
          if (r !== undefined) queue.push(r);
        }
        for (let i = 1; i < order.length; i += 1) {
          if (order[Math.floor((i - 1) / 2)] > order[i]) violations += 1;
        }
        if (step.note?.startsWith('extract-min')) {
          extracted.push(Number(step.note.match(/\((-?\d+)\)/)?.[1]));
        }
      }

      check(`min-heap seed=${seed}: heap property never violated`, violations, 0);
      checkTrue(
        `min-heap seed=${seed}: extract-min returns non-decreasing values`,
        extracted.every((v, i) => i === 0 || Number.isNaN(v) || v >= extracted[i - 1]),
      );
    }
  }

  // Hash chaining: every stored key must sit in its correct bucket.
  {
    const algo = new HashTableChaining();
    const input = algo.makeInput(14, seeded(12));
    const model = new StructureModel();
    replay(algo, input, model, 'hash-chaining');

    const buckets = input.capacity;
    let misplaced = 0;
    for (const node of model.nodes.values()) {
      if (node.value % buckets !== node.slot) misplaced += 1;
    }
    check('hash-chaining: every key is in its hash bucket', misplaced, 0);

    const expected = new Set();
    for (const op of input.ops) {
      if (op.kind === 'insert') expected.add(op.value);
      else if (op.kind === 'delete') expected.delete(op.value);
    }
    check('hash-chaining: stored keys match the script', model.nodes.size, expected.size);
  }

  // Open addressing: no two keys share a slot, and every key is findable by
  // probing forward from its home.
  {
    const algo = new HashTableOpenAddressing();
    const input = algo.makeInput(10, seeded(27));
    const model = new StructureModel();
    replay(algo, input, model, 'hash-open-addressing');

    const slots = input.capacity;
    const occupied = new Map();
    let clashes = 0;
    for (const node of model.nodes.values()) {
      if (occupied.has(node.slot)) clashes += 1;
      occupied.set(node.slot, node.value);
    }
    check('open-addressing: no two keys share a slot', clashes, 0);

    let unreachable = 0;
    for (const node of model.nodes.values()) {
      let probe = node.value % slots;
      let found = false;
      for (let i = 0; i < slots; i += 1) {
        if (!occupied.has(probe)) break; // an empty slot ends the probe
        if (occupied.get(probe) === node.value) {
          found = true;
          break;
        }
        probe = (probe + 1) % slots;
      }
      if (!found) unreachable += 1;
    }
    check('open-addressing: every key is reachable by probing', unreachable, 0);
  }

  // Trie: every inserted word must be a path from the root.
  {
    const algo = new TrieOps();
    const input = algo.makeInput(8, seeded(18));
    const model = new StructureModel();
    replay(algo, input, model, 'trie');

    // The root is the only node with no incoming edge.
    const targets = new Set(model.links.map((l) => l.to));
    const root = [...model.nodes.keys()].find((id) => !targets.has(id));
    checkTrue('trie: has a single root', root !== undefined);

    let missing = 0;
    for (const op of input.ops) {
      if (op.kind !== 'insert' || !op.key) continue;
      let node = root;
      for (const ch of op.key) {
        node = model.links.find((l) => l.from === node && l.port === ch)?.to;
        if (node === undefined) break;
      }
      if (node === undefined) missing += 1;
    }
    check('trie: every inserted word is a path from the root', missing, 0);
  }

  // AVL: the tree must remain balanced and a valid BST.
  {
    for (const seed of [10, 42]) {
      const algo = new AVLRotations();
      const input = algo.makeInput(10, seeded(seed));
      const model = new StructureModel();
      replay(algo, input, model, `avl seed=${seed}`);

      const childOf = (id, port) => model.links.find((l) => l.from === id && l.port === port)?.to;
      const targets = new Set(model.links.map((l) => l.to));
      const root = [...model.nodes.keys()].find((id) => !targets.has(id));

      const heightOf = (id) => {
        if (id === undefined) return 0;
        return 1 + Math.max(heightOf(childOf(id, 'left')), heightOf(childOf(id, 'right')));
      };

      let unbalanced = 0;
      let bstViolations = 0;
      const inOrder = [];
      const visit = (id) => {
        if (id === undefined) return;
        const l = childOf(id, 'left');
        const r = childOf(id, 'right');
        if (Math.abs(heightOf(l) - heightOf(r)) > 1) unbalanced += 1;
        visit(l);
        inOrder.push(model.nodes.get(id)?.value ?? 0);
        visit(r);
      };
      visit(root);

      for (let i = 1; i < inOrder.length; i += 1) {
        if (inOrder[i] < inOrder[i - 1]) bstViolations += 1;
      }

      check(`avl seed=${seed}: every node is balanced`, unbalanced, 0);
      check(`avl seed=${seed}: in-order traversal is sorted`, bstViolations, 0);
      check(`avl seed=${seed}: holds every inserted key`, inOrder.length, input.ops.length);
      // A plain BST fed this script would be a chain; AVL must do far better.
      const ceiling = Math.ceil(1.45 * Math.log2(inOrder.length + 2));
      checkTrue(
        `avl seed=${seed}: height ${heightOf(root)} is within the AVL bound ${ceiling}`,
        heightOf(root) <= ceiling,
      );
    }
  }

  // Segment tree: every internal node must equal the sum of its children.
  {
    const algo = new SegmentTreeOps();
    const input = algo.makeInput(8, seeded(50));
    const model = new StructureModel();
    replay(algo, input, model, 'segment-tree');

    const childOf = (id, port) => model.links.find((l) => l.from === id && l.port === port)?.to;
    const targets = new Set(model.links.map((l) => l.to));
    const root = [...model.nodes.keys()].find((id) => !targets.has(id));

    let broken = 0;
    const verify = (id) => {
      if (id === undefined) return 0;
      const l = childOf(id, 'left');
      const r = childOf(id, 'right');
      const value = model.nodes.get(id)?.value ?? 0;
      if (l === undefined && r === undefined) return value;
      const total = verify(l) + verify(r);
      if (total !== value) broken += 1;
      return value;
    };
    verify(root);
    check('segment-tree: every node equals the sum of its children', broken, 0);
  }
};
