import { StepTracer } from '../StepTracer';
import {
  type StructureInput,
  type StructureStep,
  StructureStepKind,
} from './StructureStep';

/**
 * Recorder + node allocator for data-structure algorithms.
 *
 * Owns node-id assignment and link bookkeeping so an algorithm can talk in
 * terms of "create a node, point this one's `next` at it" instead of managing
 * a parallel id space by hand. It also mirrors the link graph internally, which
 * is what lets algorithms *read* their own structure back (`portOf`) without
 * every one of them maintaining a second copy.
 */
export class StructureTracer extends StepTracer<StructureStep> {
  private nextId = 0;
  private readonly values = new Map<number, number>();
  private readonly links = new Map<number, Map<string, number>>();

  constructor(readonly input: StructureInput) {
    super();
  }

  get ops(): readonly StructureInput['ops'][number][] {
    return this.input.ops;
  }

  get capacity(): number {
    return this.input.capacity ?? 8;
  }

  // ── Nodes ───────────────────────────────────────────────────────────

  /** Allocate a node and record its creation. Returns the new id. */
  create(value: number, options: { label?: string; slot?: number; note?: string } = {}): number {
    const node = this.nextId;
    this.nextId += 1;
    this.values.set(node, value);
    this.record({
      kind: StructureStepKind.Create,
      node,
      value,
      label: options.label,
      slot: options.slot,
      note: options.note,
    });
    return node;
  }

  destroy(node: number, note?: string): void {
    this.values.delete(node);
    this.links.delete(node);
    // Also drop any pointer *into* the node, or the renderer would draw an
    // edge to something that no longer exists.
    for (const ports of this.links.values()) {
      for (const [port, target] of ports) if (target === node) ports.delete(port);
    }
    this.record({ kind: StructureStepKind.Destroy, node, note });
  }

  valueOf(node: number): number {
    return this.values.get(node) ?? 0;
  }

  update(node: number, value: number, note?: string): void {
    this.values.set(node, value);
    this.record({ kind: StructureStepKind.Update, node, value, note });
  }

  swap(a: number, b: number, note?: string): void {
    const va = this.valueOf(a);
    this.values.set(a, this.valueOf(b));
    this.values.set(b, va);
    this.record({ kind: StructureStepKind.Swap, node: a, other: b, note });
  }

  // ── Links ───────────────────────────────────────────────────────────

  link(node: number, port: string, other: number, note?: string): void {
    let ports = this.links.get(node);
    if (!ports) {
      ports = new Map();
      this.links.set(node, ports);
    }
    ports.set(port, other);
    this.record({ kind: StructureStepKind.Link, node, port, other, note });
  }

  unlink(node: number, port: string, note?: string): void {
    this.links.get(node)?.delete(port);
    this.record({ kind: StructureStepKind.Unlink, node, port, note });
  }

  /** Follow a port, or `undefined` if it is unset. */
  portOf(node: number, port: string): number | undefined {
    return this.links.get(node)?.get(port);
  }

  // ── Annotation ──────────────────────────────────────────────────────

  focus(node: number, note?: string): void {
    this.record({ kind: StructureStepKind.Focus, node, note });
  }

  compare(a: number, b: number, note?: string): void {
    this.record({ kind: StructureStepKind.Compare, node: a, other: b, note });
  }

  tag(node: number, tag: string, note?: string): void {
    this.record({ kind: StructureStepKind.Tag, node, tag, note });
  }

  /** Announce a logical operation boundary — shown as the current caption. */
  phase(note: string, slot?: number): void {
    this.record({ kind: StructureStepKind.Phase, note, slot });
  }

  done(note?: string): void {
    this.record({ kind: StructureStepKind.Done, note });
  }
}
