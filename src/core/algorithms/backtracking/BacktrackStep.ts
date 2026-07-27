import type { TracedStep } from '../types';

/**
 * The backtracking category's step vocabulary.
 *
 * Every backtracking algorithm is two things happening at once: a *board*
 * changing (a queen placed, a digit written, a cell entered) and a *recursion
 * tree* growing and being pruned. The step union has to describe both, because
 * the whole lesson of backtracking is the relationship between them — you place
 * something, discover it can't work, and unwind.
 */
export enum BacktrackStepKind {
  /** Descend into a candidate: push a node onto the recursion tree. */
  Push = 'push',
  /** The candidate violates a constraint — mark the node dead. */
  Reject = 'reject',
  /** A complete, valid assignment was reached. */
  Accept = 'accept',
  /** Unwind one level of recursion. */
  Pop = 'pop',
  /** Write `value` into board cell `cell`. */
  Place = 'place',
  /** Undo a placement. */
  Unplace = 'unplace',
  /** A constraint check touching `cells` — drives conflict highlighting. */
  Check = 'check',
  /** The run is finished. */
  Done = 'done',
}

export interface BacktrackStep extends TracedStep {
  readonly kind: BacktrackStepKind;
  /** Recursion-tree node id, assigned by the tracer. */
  readonly node?: number;
  readonly parent?: number;
  /** Label for the tree edge into this node ("q=3", "digit 7"). */
  readonly choice?: string;
  /** Flat board index for Place/Unplace. */
  readonly cell?: number;
  readonly value?: number;
  /** Cells involved in a constraint check. */
  readonly cells?: readonly number[];
  readonly depth?: number;
  readonly note?: string;
}

/**
 * A backtracking problem instance.
 *
 * The board is a flat `width × height` array so one renderer handles a chess
 * board, a Sudoku grid, a maze and a subset-selection row without knowing which
 * it is drawing. `payload` carries the problem-specific extras.
 */
export interface BacktrackInput {
  readonly width: number;
  readonly height: number;
  /** Pre-filled cells: Sudoku givens, maze walls. 0 means empty. */
  readonly initial: readonly number[];
  readonly payload: Readonly<Record<string, unknown>>;
  readonly title: string;
  /** How the board should be drawn. */
  readonly board: BoardStyle;
}

/**
 * Board rendering hint.
 *
 * The step vocabulary is shared, but a chess board, a Sudoku grid and a maze
 * want visibly different cells — this tells the renderer which without it
 * having to inspect `payload`.
 */
export type BoardStyle = 'queens' | 'sudoku' | 'maze' | 'cells' | 'towers';

/** Walls in a maze board are stored as this sentinel in `initial`. */
export const MAZE_WALL = -1;
