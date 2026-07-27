import type { AlgorithmMeta } from '../types';
import { BacktrackAlgorithm, BACKTRACKING_CATEGORY, randInt } from './BacktrackAlgorithm';
import type { BacktrackInput } from './BacktrackStep';
import type { BacktrackTracer } from './BacktrackTracer';

/**
 * Sudoku solver.
 *
 * A 4×4 board rather than the usual 9×9. That is a deliberate teaching choice:
 * a real 9×9 puzzle takes tens of thousands of steps and the animation becomes
 * an unwatchable blur, whereas a 4×4 shows the same constraint propagation and
 * the same unwind behaviour in a few hundred steps you can actually follow.
 */
export class SudokuSolver extends BacktrackAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'sudoku-solver',
    name: 'Sudoku Solver',
    category: BACKTRACKING_CATEGORY,
    group: 'Board',
    description:
      'Fills a Sudoku grid by trying each candidate digit in the first empty cell, recursing, and undoing the choice when it leads to a contradiction. Every attempt checks the cell\'s row, column and box; a 4×4 board keeps the step count small enough to actually follow the constraint propagation.',
    complexity: {
      time: { best: 'O(1)', average: 'O(9^m)', worst: 'O(9^m)' },
      space: 'O(m)',
    },
    accent: '#a78bfa',
  };

  makeInput(size: number, random: () => number): BacktrackInput {
    const n = 4;
    const solved = generateSolved(random);
    // More givens means a shallower search. The size slider maps to difficulty:
    // small size = many givens = a quick, legible solve.
    const clues = Math.max(4, Math.min(10, 14 - Math.round(size)));
    const keep = new Set<number>();
    while (keep.size < clues) keep.add(randInt(random, 0, n * n - 1));

    const initial = solved.map((v, i) => (keep.has(i) ? v : 0));
    return {
      width: n,
      height: n,
      initial,
      payload: { givens: [...keep] },
      title: `4×4 Sudoku, ${clues} givens`,
      board: 'sudoku',
    };
  }

  protected search(t: BacktrackTracer): void {
    const n = t.width;
    const box = Math.round(Math.sqrt(n));
    const givens = new Set(t.payload<{ givens: number[] }>().givens);

    const solve = (index: number): boolean => {
      if (t.isTruncated) return false;
      if (index === n * n) {
        t.at(2).accept('every cell is filled consistently');
        return true;
      }
      // Skip the clues — they are fixed, not decisions.
      if (givens.has(index)) return solve(index + 1);

      const row = Math.floor(index / n);
      const col = index % n;

      for (let digit = 1; digit <= n; digit += 1) {
        t.at(4).enter(`${digit}`, `try ${digit} at (${row}, ${col})`);
        const peers = peerCells(t, row, col, n, box);
        t.at(5).check(peers, `does ${digit} clash in this row, column or box?`);

        if (peers.some((p) => t.cell(p) === digit)) {
          t.at(6).reject(`${digit} already appears in a peer cell`);
          t.leave();
          continue;
        }

        t.at(7).place(index, digit);
        if (solve(index + 1)) return true;

        t.at(9).unplace(index, `${digit} leads nowhere — take it back`);
        t.at(10).reject('this digit cannot complete the grid');
        t.leave();
      }

      return false;
    };

    t.at(1).enter('root', 'start from the given clues');
    solve(0);
    t.leave();
  }
}

/** Row, column and box peers of a cell — everything its value must differ from. */
function peerCells(
  t: BacktrackTracer,
  row: number,
  col: number,
  n: number,
  box: number,
): number[] {
  const cells = new Set<number>();
  for (let c = 0; c < n; c += 1) if (c !== col) cells.add(t.index(row, c));
  for (let r = 0; r < n; r += 1) if (r !== row) cells.add(t.index(r, col));

  const boxRow = Math.floor(row / box) * box;
  const boxCol = Math.floor(col / box) * box;
  for (let r = boxRow; r < boxRow + box; r += 1) {
    for (let c = boxCol; c < boxCol + box; c += 1) {
      if (r !== row || c !== col) cells.add(t.index(r, c));
    }
  }
  return [...cells];
}

/**
 * A random valid 4×4 grid.
 *
 * Built by permuting a known-good base solution rather than by search, so
 * generation is instant and always produces a solvable puzzle.
 */
function generateSolved(random: () => number): number[] {
  const base = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1],
  ];

  // Relabelling digits preserves validity.
  const digits = [1, 2, 3, 4];
  for (let i = digits.length - 1; i > 0; i -= 1) {
    const j = randInt(random, 0, i);
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }

  // Swapping the two rows inside a band also preserves validity.
  const rows = [0, 1, 2, 3];
  if (random() < 0.5) [rows[0], rows[1]] = [rows[1], rows[0]];
  if (random() < 0.5) [rows[2], rows[3]] = [rows[3], rows[2]];

  const out: number[] = [];
  for (const r of rows) for (const v of base[r]) out.push(digits[v - 1]);
  return out;
}
