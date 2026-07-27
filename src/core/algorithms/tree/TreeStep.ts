/**
 * The tree category's step vocabulary — the only contract between a tree
 * algorithm and the `TreeVisualizer`. The full BST (structure + layout) is
 * precomputed; steps then drive node *visibility* (insertion reveals nodes one
 * at a time) and *highlighting* (descent comparisons, traversal visits).
 */
import type { TracedStep } from '../types';

export enum TreeStepKind {
  /** Reveal the entire pre-built tree at once (search / traversal intro). */
  RevealAll = 'reveal-all',
  /** Reveal a single node (insertion). */
  Reveal = 'reveal',
  /** Compare the search/insert key against `node` while descending. */
  Compare = 'compare',
  /** Visit a node in traversal order. */
  Visit = 'visit',
  /** The search target was found at `node`. */
  Found = 'found',
  /** The search finished without finding the target. */
  NotFound = 'not-found',
  /** The run is finished. */
  Done = 'done',
}

export interface TreeStep extends TracedStep {
  readonly kind: TreeStepKind;
  /** Node id the step acts on. */
  readonly node?: number;
  readonly note?: string;
}

/** A laid-out binary-search-tree node. Children/parent are node ids (or null). */
export interface TreeNode {
  readonly id: number;
  readonly value: number;
  depth: number;
  /** World-space layout position (z is always 0). */
  x: number;
  y: number;
  parent: number | null;
  left: number | null;
  right: number | null;
}

/** Problem instance for the tree family: a laid-out BST + optional search target. */
export interface TreeData {
  readonly nodes: TreeNode[];
  readonly root: number | null;
  /** Node ids in insertion order (here, identical to id order). */
  readonly order: number[];
  readonly target?: number;
}
