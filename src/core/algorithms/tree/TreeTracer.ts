import { StepTracer } from '../StepTracer';
import { type TreeData, type TreeStep, TreeStepKind } from './TreeStep';

/**
 * Ergonomic recorder + read model for tree algorithms. Wraps a pre-built
 * {@link TreeData} (structure + layout) and exposes child/value queries plus
 * step recorders, so algorithms read like their textbook pseudocode.
 */
export class TreeTracer extends StepTracer<TreeStep> {
  constructor(private readonly data: TreeData) {
    super();
  }

  get root(): number | null {
    return this.data.root;
  }
  get order(): readonly number[] {
    return this.data.order;
  }
  get target(): number | undefined {
    return this.data.target;
  }

  value(id: number): number {
    return this.data.nodes[id].value;
  }
  left(id: number): number | null {
    return this.data.nodes[id].left;
  }
  right(id: number): number | null {
    return this.data.nodes[id].right;
  }

  // ── Step recorders ──────────────────────────────────────────────────
  revealAll(note?: string): void {
    this.record({ kind: TreeStepKind.RevealAll, note });
  }
  reveal(node: number, note?: string): void {
    this.record({ kind: TreeStepKind.Reveal, node, note });
  }
  compare(node: number, note?: string): void {
    this.record({ kind: TreeStepKind.Compare, node, note });
  }
  visit(node: number, note?: string): void {
    this.record({ kind: TreeStepKind.Visit, node, note });
  }
  found(node: number, note?: string): void {
    this.record({ kind: TreeStepKind.Found, node, note });
  }
  notFound(note?: string): void {
    this.record({ kind: TreeStepKind.NotFound, note });
  }
  done(note?: string): void {
    this.record({ kind: TreeStepKind.Done, note });
  }
}
