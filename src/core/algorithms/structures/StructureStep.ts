import type { TracedStep } from '../types';

/**
 * The data-structures category's step vocabulary.
 *
 * One deliberately generic node/link language serves linked lists, stacks,
 * queues, heaps, hash tables, tries, AVL trees and segment trees. That is
 * possible because all of them are the same thing underneath: nodes holding
 * values, connected by named ports, being created, relinked and destroyed.
 * What differs is only how they are *laid out* — which is a rendering concern,
 * carried by {@link StructureLayout}.
 */
export enum StructureStepKind {
  /** Create a node holding `value`. */
  Create = 'create',
  /** Point `node`'s `port` at `other` ("next", "left", "child:a"). */
  Link = 'link',
  /** Clear `node`'s `port`. */
  Unlink = 'unlink',
  /** Destroy a node and everything pointing at it. */
  Destroy = 'destroy',
  /** Move the cursor to `node`. */
  Focus = 'focus',
  /** Overwrite a node's value in place. */
  Update = 'update',
  /** Exchange the values of two nodes (heap sift). */
  Swap = 'swap',
  /** Compare two nodes — counts toward metrics and highlights both. */
  Compare = 'compare',
  /** Tag a node for colouring ("collision", "unbalanced", "found"). */
  Tag = 'tag',
  /** Announce a logical phase ("rotate left at 12", "resize to 32"). */
  Phase = 'phase',
  /** The operation script is finished. */
  Done = 'done',
}

export interface StructureStep extends TracedStep {
  readonly kind: StructureStepKind;
  readonly node?: number;
  readonly other?: number;
  readonly port?: string;
  readonly value?: number;
  /** Display label, when it differs from the value (trie characters, keys). */
  readonly label?: string;
  readonly tag?: string;
  /** Layout hint: lane, bucket or level the node belongs to. */
  readonly slot?: number;
  readonly note?: string;
}

/** Which layout strategy the renderer should use. */
export type StructureLayout = 'chain' | 'stack' | 'tree' | 'buckets' | 'array';

/** One operation in the script the algorithm executes. */
export interface StructureOp {
  readonly kind:
    | 'insert'
    | 'delete'
    | 'search'
    | 'push'
    | 'pop'
    | 'enqueue'
    | 'dequeue'
    | 'update'
    | 'query';
  readonly value: number;
  /** Second operand, for range queries. */
  readonly extra?: number;
  /** String key, for tries and hash tables. */
  readonly key?: string;
}

/**
 * A data-structure problem instance.
 *
 * Unlike the other families the "input" is a *script of operations* rather than
 * a static dataset — which is the point: a data structure is defined by how it
 * behaves under a sequence of operations, not by any single snapshot.
 */
export interface StructureInput {
  readonly layout: StructureLayout;
  readonly ops: readonly StructureOp[];
  /** Bucket count for hash tables, or capacity for bounded structures. */
  readonly capacity?: number;
  readonly title: string;
}
