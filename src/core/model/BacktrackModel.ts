import {
  type BacktrackInput,
  type BacktrackStep,
  BacktrackStepKind,
  type BoardStyle,
  MAZE_WALL,
} from '../algorithms/backtracking/BacktrackStep';

export enum BoardCellRole {
  /** Open and unoccupied. */
  Empty = 'empty',
  /** Impassable (maze wall). */
  Wall = 'wall',
  /** A fixed clue that the search may not change. */
  Given = 'given',
  /** Currently holding a placed value. */
  Placed = 'placed',
  /** Just written this step. */
  Writing = 'writing',
  /** Just cleared this step. */
  Erasing = 'erasing',
  /** Examined by the constraint check this step. */
  Checking = 'checking',
  /** Part of an accepted solution. */
  Solved = 'solved',
}

/** Lifecycle of a node in the recursion tree. */
export enum NodeStatus {
  /** On the current call stack. */
  Active = 'active',
  /** Explored and abandoned. */
  Rejected = 'rejected',
  /** Led to a solution. */
  Accepted = 'accepted',
  /** Returned from, without a verdict of its own. */
  Closed = 'closed',
}

export interface TreeNode {
  id: number;
  parent: number | undefined;
  choice: string | undefined;
  depth: number;
  status: NodeStatus;
}

export interface BacktrackMetrics {
  /** Nodes pushed onto the recursion tree. */
  explored: number;
  /** Branches abandoned. */
  pruned: number;
  placements: number;
  solutions: number;
  /** Deepest point the recursion reached. */
  maxDepth: number;
}

/**
 * Authoritative state of a backtracking search: a board and a recursion tree.
 *
 * The tree is stored as a flat id→node map with parent pointers, and *layout is
 * not stored here*. Positioning a tree needs to know the viewport, which is a
 * rendering concern; keeping the model to pure structure is what lets the same
 * state drive a wide desktop pane and a narrow phone one.
 *
 * Node retention is bounded: an exhaustive search can push hundreds of
 * thousands of nodes, and keeping every dead branch forever would both exhaust
 * memory and render as an illegible smear. Rejected nodes outside the recent
 * window are dropped, with a running tally kept so the UI can still say how
 * much was pruned.
 */
export class BacktrackModel {
  /** Most recently pushed nodes kept for drawing. Older ones are discarded. */
  static readonly MAX_NODES = 400;

  private input: BacktrackInput = {
    width: 0,
    height: 0,
    initial: [],
    payload: {},
    title: '',
    board: 'cells',
  };

  private cells: number[] = [];
  private givens = new Set<number>();
  private solved = new Set<number>();
  private transient = new Map<number, BoardCellRole>();

  private _nodes = new Map<number, TreeNode>();
  private _path: number[] = [];
  private _droppedNodes = 0;
  private _metrics: BacktrackMetrics = {
    explored: 0,
    pruned: 0,
    placements: 0,
    solutions: 0,
    maxDepth: 0,
  };

  reset(input: BacktrackInput): void {
    this.input = input;
    this.cells = [...input.initial];
    this.givens = new Set(
      input.initial.map((v, i) => (v > 0 ? i : -1)).filter((i) => i >= 0),
    );
    this.solved.clear();
    this.transient.clear();
    this._nodes = new Map();
    this._path = [];
    this._droppedNodes = 0;
    this._metrics = { explored: 0, pruned: 0, placements: 0, solutions: 0, maxDepth: 0 };
  }

  rewind(): void {
    this.reset(this.input);
  }

  get width(): number {
    return this.input.width;
  }
  get height(): number {
    return this.input.height;
  }
  get boardStyle(): BoardStyle {
    return this.input.board;
  }
  get title(): string {
    return this.input.title;
  }
  get metrics(): BacktrackMetrics {
    return { ...this._metrics };
  }
  get nodes(): ReadonlyMap<number, TreeNode> {
    return this._nodes;
  }
  /** Node ids on the current call stack, root first. */
  get activePath(): readonly number[] {
    return this._path;
  }
  /** How many nodes were dropped to stay within the retention window. */
  get droppedNodes(): number {
    return this._droppedNodes;
  }

  valueAt(index: number): number {
    return this.cells[index] ?? 0;
  }

  roleAt(index: number): BoardCellRole {
    const transient = this.transient.get(index);
    if (transient) return transient;
    if (this.cells[index] === MAZE_WALL) return BoardCellRole.Wall;
    if (this.solved.has(index)) return BoardCellRole.Solved;
    if (this.givens.has(index)) return BoardCellRole.Given;
    return this.cells[index] > 0 ? BoardCellRole.Placed : BoardCellRole.Empty;
  }

  apply(step: BacktrackStep): void {
    this.transient.clear();

    switch (step.kind) {
      case BacktrackStepKind.Push: {
        if (step.node === undefined) break;
        this._nodes.set(step.node, {
          id: step.node,
          parent: step.parent,
          choice: step.choice,
          depth: step.depth ?? this._path.length + 1,
          status: NodeStatus.Active,
        });
        this._path.push(step.node);
        this._metrics.explored += 1;
        this._metrics.maxDepth = Math.max(this._metrics.maxDepth, this._path.length);
        this.evictOldNodes();
        break;
      }

      case BacktrackStepKind.Reject: {
        const node = step.node !== undefined ? this._nodes.get(step.node) : undefined;
        if (node) node.status = NodeStatus.Rejected;
        this._metrics.pruned += 1;
        break;
      }

      case BacktrackStepKind.Accept: {
        const node = step.node !== undefined ? this._nodes.get(step.node) : undefined;
        if (node) node.status = NodeStatus.Accepted;
        this._metrics.solutions += 1;
        // Freeze the current board as a solution so it stays visible while the
        // search carries on looking for others.
        for (let i = 0; i < this.cells.length; i += 1) {
          if (this.cells[i] > 0) this.solved.add(i);
        }
        break;
      }

      case BacktrackStepKind.Pop: {
        const id = this._path.pop();
        const node = id !== undefined ? this._nodes.get(id) : undefined;
        if (node && node.status === NodeStatus.Active) node.status = NodeStatus.Closed;
        break;
      }

      case BacktrackStepKind.Place:
        if (step.cell !== undefined) {
          this.cells[step.cell] = step.value ?? 1;
          this._metrics.placements += 1;
          this.transient.set(step.cell, BoardCellRole.Writing);
        }
        break;

      case BacktrackStepKind.Unplace:
        if (step.cell !== undefined) {
          this.cells[step.cell] = 0;
          this.solved.delete(step.cell);
          this.transient.set(step.cell, BoardCellRole.Erasing);
        }
        break;

      case BacktrackStepKind.Check:
        for (const cell of step.cells ?? []) {
          this.transient.set(cell, BoardCellRole.Checking);
        }
        break;

      case BacktrackStepKind.Done:
        this._path = [];
        break;
    }
  }

  /**
   * Drop the oldest nodes that are neither on the active path nor recent.
   *
   * Without this an exhaustive search grows the map without bound. The active
   * path must always survive, because it is what the renderer draws as the
   * current call stack.
   */
  private evictOldNodes(): void {
    if (this._nodes.size <= BacktrackModel.MAX_NODES) return;

    const keep = new Set(this._path);
    // Map preserves insertion order, so the head of the iteration is the oldest.
    const excess = this._nodes.size - BacktrackModel.MAX_NODES;
    let removed = 0;
    for (const id of this._nodes.keys()) {
      if (removed >= excess) break;
      if (keep.has(id)) continue;
      this._nodes.delete(id);
      removed += 1;
      this._droppedNodes += 1;
    }
  }
}
