import type { StructureModel } from '@/core/model/StructureModel';

export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  width: number;
  height: number;
}

/**
 * Layout strategies for the data-structures family.
 *
 * Each is a *pure* `(model, viewport) => positions` function. Keeping them pure
 * and separate is what lets one visualizer draw a linked list, a hash table and
 * an AVL tree: the drawing code is identical, only the positioning differs.
 *
 * Positions are targets, not final coordinates — the visualizer tweens toward
 * them, which is what makes an AVL rotation read as nodes *moving* rather than
 * teleporting.
 */
export type LayoutFn = (model: StructureModel, viewport: Viewport) => Map<number, Point>;

/** Left-to-right chain: linked lists. */
export const chainLayout: LayoutFn = (model, viewport) => {
  const positions = new Map<number, Point>();
  const nodes = [...model.nodes.values()];
  if (nodes.length === 0) return positions;

  // Follow `next` pointers from whichever node nothing points at, so the
  // drawing order matches the list order rather than creation order.
  const targets = new Set(model.links.filter((l) => l.port === 'next').map((l) => l.to));
  const heads = nodes.filter((n) => !targets.has(n.id));
  const nextOf = new Map(model.links.filter((l) => l.port === 'next').map((l) => [l.from, l.to]));

  const ordered: number[] = [];
  const seen = new Set<number>();
  for (const head of heads) {
    let cursor: number | undefined = head.id;
    while (cursor !== undefined && !seen.has(cursor)) {
      seen.add(cursor);
      ordered.push(cursor);
      cursor = nextOf.get(cursor);
    }
  }
  // Anything unreachable (a cycle, or a freshly created orphan) goes last.
  for (const node of nodes) if (!seen.has(node.id)) ordered.push(node.id);

  const perRow = Math.max(1, Math.floor((viewport.width - 40) / 74));
  ordered.forEach((id, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    positions.set(id, { x: 46 + col * 74, y: 52 + row * 76 });
  });
  return positions;
};

/** Two vertical lanes growing from the bottom: stack and queue. */
export const stackLayout: LayoutFn = (model, viewport) => {
  const positions = new Map<number, Point>();
  const lanes = new Map<number, number[]>();
  for (const node of model.nodes.values()) {
    const slot = node.slot ?? 0;
    const lane = lanes.get(slot);
    if (lane) lane.push(node.id);
    else lanes.set(slot, [node.id]);
  }

  const laneCount = Math.max(1, lanes.size);
  const laneWidth = viewport.width / laneCount;
  const cellHeight = 34;

  for (const [slot, ids] of lanes) {
    const x = laneWidth * (slot + 0.5);
    ids.forEach((id, depth) => {
      // Grow upward from the base so both lanes share a floor and their
      // differing heights are directly comparable.
      positions.set(id, { x, y: viewport.height - 48 - depth * cellHeight });
    });
  }
  return positions;
};

/** Rows of buckets, each with a horizontal chain: hash tables with chaining. */
export const bucketsLayout: LayoutFn = (model, viewport) => {
  const positions = new Map<number, Point>();
  const buckets = Math.max(1, model.capacity);
  const rowHeight = Math.min(46, (viewport.height - 50) / buckets);
  const nextOf = new Map(model.links.filter((l) => l.port === 'next').map((l) => [l.from, l.to]));

  // A bucket's chain is found by walking from its head, so a node's depth in
  // the chain determines its x — which is what makes clustering visible.
  const byBucket = new Map<number, number[]>();
  for (const node of model.nodes.values()) {
    const slot = node.slot ?? 0;
    const list = byBucket.get(slot);
    if (list) list.push(node.id);
    else byBucket.set(slot, [node.id]);
  }

  for (const [slot, ids] of byBucket) {
    const targets = new Set(ids.filter((id) => nextOf.has(id)).map((id) => nextOf.get(id) as number));
    const head = ids.find((id) => !targets.has(id)) ?? ids[0];

    const ordered: number[] = [];
    const seen = new Set<number>();
    let cursor: number | undefined = head;
    while (cursor !== undefined && !seen.has(cursor)) {
      seen.add(cursor);
      ordered.push(cursor);
      cursor = nextOf.get(cursor);
    }
    for (const id of ids) if (!seen.has(id)) ordered.push(id);

    ordered.forEach((id, depth) => {
      positions.set(id, { x: 92 + depth * 62, y: 34 + slot * rowHeight });
    });
  }
  return positions;
};

/** A single indexed row: open-addressed hash tables. */
export const arrayLayout: LayoutFn = (model, viewport) => {
  const positions = new Map<number, Point>();
  const slots = Math.max(1, model.capacity);
  const perRow = Math.max(1, Math.floor((viewport.width - 30) / 56));
  const cell = Math.min(56, (viewport.width - 30) / Math.min(slots, perRow));

  for (const node of model.nodes.values()) {
    const slot = node.slot ?? 0;
    const row = Math.floor(slot / perRow);
    const col = slot % perRow;
    positions.set(node.id, { x: 26 + col * cell + cell / 2, y: 60 + row * 70 });
  }
  return positions;
};

/**
 * Level-by-level tree layout: heaps, tries, AVL and segment trees.
 *
 * Nodes are placed by their depth and their in-order index within that depth,
 * which is stable as the tree changes shape — the property that matters, since
 * a layout that reshuffles siblings would make every AVL rotation look like a
 * total rebuild rather than a local fix.
 */
export const treeLayout: LayoutFn = (model, viewport) => {
  const positions = new Map<number, Point>();
  const nodes = [...model.nodes.values()];
  if (nodes.length === 0) return positions;

  const childLinks = model.links.filter((l) => l.port !== 'next');
  const childrenOf = new Map<number, number[]>();
  const hasParent = new Set<number>();
  for (const link of childLinks) {
    const list = childrenOf.get(link.from);
    if (list) list.push(link.to);
    else childrenOf.set(link.from, [link.to]);
    hasParent.add(link.to);
  }
  // Keep sibling order deterministic: left before right, then by id.
  for (const [from, kids] of childrenOf) {
    const order = new Map(
      childLinks.filter((l) => l.from === from).map((l) => [l.to, portRank(l.port)]),
    );
    kids.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0) || a - b);
  }

  const roots = nodes.filter((n) => !hasParent.has(n.id)).map((n) => n.id);
  const levels: number[][] = [];

  // Breadth-first so every node lands on its true depth even in a forest.
  let frontier = roots.length ? roots : [nodes[0].id];
  const seen = new Set(frontier);
  while (frontier.length) {
    levels.push(frontier);
    const next: number[] = [];
    for (const id of frontier) {
      for (const child of childrenOf.get(id) ?? []) {
        if (seen.has(child)) continue;
        seen.add(child);
        next.push(child);
      }
    }
    frontier = next;
  }
  // Orphans (a freshly created node not yet linked) get their own bottom row.
  const orphans = nodes.filter((n) => !seen.has(n.id)).map((n) => n.id);
  if (orphans.length) levels.push(orphans);

  const levelGap = Math.min(64, (viewport.height - 60) / Math.max(1, levels.length));
  levels.forEach((level, depth) => {
    const slot = viewport.width / (level.length + 1);
    level.forEach((id, i) => {
      positions.set(id, { x: slot * (i + 1), y: 42 + depth * levelGap });
    });
  });

  return positions;
};

function portRank(port: string): number {
  if (port === 'left') return 0;
  if (port === 'right') return 2;
  // Trie edges are single characters; alphabetical keeps them stable.
  return 1 + port.charCodeAt(0) / 1000;
}

export const LAYOUTS: Record<string, LayoutFn> = {
  chain: chainLayout,
  stack: stackLayout,
  buckets: bucketsLayout,
  array: arrayLayout,
  tree: treeLayout,
};
