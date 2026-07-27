import type { AlgorithmMeta } from '../types';
import { BacktrackAlgorithm, BACKTRACKING_CATEGORY } from './BacktrackAlgorithm';
import type { BacktrackInput } from './BacktrackStep';
import type { BacktrackTracer } from './BacktrackTracer';

/**
 * N-Queens.
 *
 * The canonical backtracking problem, and the clearest one to watch: the board
 * fills column by column, a conflict lights up the attacking squares, and the
 * recursion tree visibly prunes whole subtrees the moment a placement fails.
 *
 * Board size is capped at 10 — the search space grows fast enough that n=12
 * produces a timeline nobody can meaningfully scrub.
 */
export class NQueens extends BacktrackAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'n-queens',
    name: 'N-Queens',
    category: BACKTRACKING_CATEGORY,
    group: 'Board',
    description:
      'Places N queens on an N×N board so that no two share a row, column or diagonal. Queens are placed one column at a time; when no safe row remains, the search unwinds and retries the previous column. The recursion tree shows exactly how much of the search space each conflict prunes away.',
    complexity: {
      time: { best: 'O(n!)', average: 'O(n!)', worst: 'O(n!)' },
      space: 'O(n)',
    },
    accent: '#fb7185',
  };

  makeInput(size: number): BacktrackInput {
    const n = Math.max(4, Math.min(size, 10));
    return {
      width: n,
      height: n,
      initial: new Array<number>(n * n).fill(0),
      payload: { n },
      title: `${n} queens on a ${n}×${n} board`,
      board: 'queens',
    };
  }

  protected search(t: BacktrackTracer): void {
    const n = t.width;
    // Column-wise occupancy for the O(1) safety test. Tracking diagonals by
    // their invariants (r-c and r+c) is what keeps `isSafe` constant time.
    const rows = new Set<number>();
    const diag = new Set<number>();
    const antiDiag = new Set<number>();

    const place = (col: number): boolean => {
      if (col === n) {
        t.at(2).accept('all queens placed without conflict');
        return true;
      }

      for (let row = 0; row < n; row += 1) {
        if (t.isTruncated) return false;

        const index = t.index(row, col);
        t.at(4).enter(`c${col}=r${row}`, `try row ${row} in column ${col}`);
        t.at(5).check(attackedCells(t, row, col, n), `is (${row}, ${col}) attacked?`);

        if (rows.has(row) || diag.has(row - col) || antiDiag.has(row + col)) {
          t.at(6).reject('conflicts with a queen already placed');
          t.leave();
          continue;
        }

        rows.add(row);
        diag.add(row - col);
        antiDiag.add(row + col);
        t.at(7).place(index, 1, `place a queen at (${row}, ${col})`);

        if (place(col + 1)) return true;

        // Undo before trying the next row — the defining move of backtracking.
        rows.delete(row);
        diag.delete(row - col);
        antiDiag.delete(row + col);
        t.at(9).unplace(index, `remove the queen from (${row}, ${col})`);
        t.at(10).reject('no solution follows from this placement');
        t.leave();
      }

      return false;
    };

    t.at(1).enter('root', 'start with an empty board');
    place(0);
    t.leave();
  }
}

/** Squares a queen at (row, col) would attack — highlighted during the check. */
function attackedCells(
  t: BacktrackTracer,
  row: number,
  col: number,
  n: number,
): number[] {
  const cells: number[] = [];
  for (let c = 0; c < col; c += 1) {
    cells.push(t.index(row, c));
    const up = row - (col - c);
    const down = row + (col - c);
    if (up >= 0) cells.push(t.index(up, c));
    if (down < n) cells.push(t.index(down, c));
  }
  return cells;
}
