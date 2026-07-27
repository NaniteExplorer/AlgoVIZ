import {
  type StructureInput,
  type StructureLayout,
  type StructureStep,
  StructureStepKind,
} from '../algorithms/structures/StructureStep';

export enum StructureNodeRole {
  Idle = 'idle',
  /** The cursor. */
  Focus = 'focus',
  /** Being compared this step. */
  Comparing = 'comparing',
  /** Just created. */
  New = 'new',
  /** Just written or swapped. */
  Updating = 'updating',
  /** Tagged by the algorithm (collision, found, unbalanced, removing). */
  Tagged = 'tagged',
}

export interface StructureNode {
  id: number;
  value: number;
  label?: string;
  /** Lane, bucket or index the layout should place this node in. */
  slot?: number;
  tag?: string;
}

export interface StructureLink {
  from: number;
  to: number;
  port: string;
}

export interface StructureMetrics {
  operations: number;
  comparisons: number;
  nodes: number;
  links: number;
  /** Times a key landed on an already-occupied slot or bucket. */
  collisions: number;
}

/**
 * Authoritative state of a data structure: a set of nodes and named links.
 *
 * Layout is emphatically *not* stored here. Where a node should appear depends
 * on the viewport and on which layout strategy the family chose, both of which
 * are rendering concerns; keeping the model to pure topology is what lets the
 * same state drive a wide desktop pane and a narrow phone one, and what makes
 * it replayable.
 */
export class StructureModel {
  private input: StructureInput = { layout: 'chain', ops: [], title: '' };

  private _nodes = new Map<number, StructureNode>();
  private _links: StructureLink[] = [];
  private transient = new Map<number, StructureNodeRole>();
  private _caption = '';

  private _metrics: StructureMetrics = {
    operations: 0,
    comparisons: 0,
    nodes: 0,
    links: 0,
    collisions: 0,
  };

  reset(input: StructureInput): void {
    this.input = input;
    this._nodes = new Map();
    this._links = [];
    this.transient.clear();
    this._caption = '';
    this._metrics = { operations: 0, comparisons: 0, nodes: 0, links: 0, collisions: 0 };
  }

  rewind(): void {
    this.reset(this.input);
  }

  get layout(): StructureLayout {
    return this.input.layout;
  }
  get capacity(): number {
    return this.input.capacity ?? 0;
  }
  get title(): string {
    return this.input.title;
  }
  /** Caption for the operation currently in progress. */
  get caption(): string {
    return this._caption;
  }
  get nodes(): ReadonlyMap<number, StructureNode> {
    return this._nodes;
  }
  get links(): readonly StructureLink[] {
    return this._links;
  }
  get metrics(): StructureMetrics {
    return { ...this._metrics };
  }

  roleAt(id: number): StructureNodeRole {
    const transient = this.transient.get(id);
    if (transient) return transient;
    return this._nodes.get(id)?.tag ? StructureNodeRole.Tagged : StructureNodeRole.Idle;
  }

  apply(step: StructureStep): void {
    // A Compare belongs to the same visual beat as the Focus before it, so it
    // adds to the highlight set rather than replacing it.
    if (step.kind !== StructureStepKind.Compare) this.transient.clear();

    switch (step.kind) {
      case StructureStepKind.Create:
        if (step.node !== undefined) {
          this._nodes.set(step.node, {
            id: step.node,
            value: step.value ?? 0,
            label: step.label,
            slot: step.slot,
          });
          this._metrics.nodes += 1;
          this.transient.set(step.node, StructureNodeRole.New);
        }
        break;

      case StructureStepKind.Destroy:
        if (step.node !== undefined) {
          this._nodes.delete(step.node);
          // Drop links in both directions, or the renderer draws edges into
          // empty space.
          this._links = this._links.filter((l) => l.from !== step.node && l.to !== step.node);
        }
        break;

      case StructureStepKind.Link:
        if (step.node !== undefined && step.other !== undefined && step.port) {
          // A port holds exactly one target, so re-linking replaces.
          this._links = this._links.filter(
            (l) => !(l.from === step.node && l.port === step.port),
          );
          this._links.push({ from: step.node, to: step.other, port: step.port });
          this._metrics.links += 1;
          this.transient.set(step.node, StructureNodeRole.Updating);
        }
        break;

      case StructureStepKind.Unlink:
        if (step.node !== undefined && step.port) {
          this._links = this._links.filter(
            (l) => !(l.from === step.node && l.port === step.port),
          );
        }
        break;

      case StructureStepKind.Focus:
        if (step.node !== undefined) this.transient.set(step.node, StructureNodeRole.Focus);
        break;

      case StructureStepKind.Update: {
        const node = step.node !== undefined ? this._nodes.get(step.node) : undefined;
        if (node) {
          node.value = step.value ?? node.value;
          node.label = undefined;
          this.transient.set(node.id, StructureNodeRole.Updating);
        }
        break;
      }

      case StructureStepKind.Swap: {
        const a = step.node !== undefined ? this._nodes.get(step.node) : undefined;
        const b = step.other !== undefined ? this._nodes.get(step.other) : undefined;
        if (a && b) {
          const value = a.value;
          a.value = b.value;
          b.value = value;
          this.transient.set(a.id, StructureNodeRole.Updating);
          this.transient.set(b.id, StructureNodeRole.Updating);
        }
        break;
      }

      case StructureStepKind.Compare:
        this._metrics.comparisons += 1;
        if (step.node !== undefined) this.transient.set(step.node, StructureNodeRole.Comparing);
        if (step.other !== undefined) this.transient.set(step.other, StructureNodeRole.Comparing);
        break;

      case StructureStepKind.Tag: {
        const node = step.node !== undefined ? this._nodes.get(step.node) : undefined;
        if (node && step.tag) {
          node.tag = step.tag;
          if (step.tag === 'collision') this._metrics.collisions += 1;
          this.transient.set(node.id, StructureNodeRole.Tagged);
        }
        break;
      }

      case StructureStepKind.Phase:
        this._metrics.operations += 1;
        this._caption = step.note ?? '';
        break;

      case StructureStepKind.Done:
        this._caption = step.note ?? '';
        break;
    }
  }
}
