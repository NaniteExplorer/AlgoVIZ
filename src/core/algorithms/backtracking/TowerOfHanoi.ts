import type { AlgorithmMeta } from '../types';
import { BacktrackAlgorithm, BACKTRACKING_CATEGORY } from './BacktrackAlgorithm';
import type { BacktrackInput } from './BacktrackStep';
import type { BacktrackTracer } from './BacktrackTracer';

/**
 * Tower of Hanoi.
 *
 * Strictly speaking not backtracking — nothing is ever rejected or undone — but
 * it belongs in this family because it is the purest recursion tree there is:
 * every node has exactly two children, the tree is perfectly balanced, and the
 * 2ⁿ−1 leaves *are* the moves. Sitting next to Permutations and Subset Sum, it
 * separates "recursion" from "search" in a way neither does alone.
 *
 * Board layout: three columns (pegs), `n` rows, with row 0 the top of each peg.
 */
export class TowerOfHanoi extends BacktrackAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'tower-of-hanoi',
    name: 'Tower of Hanoi',
    category: BACKTRACKING_CATEGORY,
    group: 'Classic',
    description:
      'Moves a stack of graduated discs between three pegs, never placing a larger disc on a smaller one. The solution is three lines of recursion — move n−1 aside, move the biggest, move n−1 back — and produces a perfectly balanced tree with exactly 2ⁿ−1 moves at its leaves.',
    complexity: {
      time: { best: 'O(2ⁿ)', average: 'O(2ⁿ)', worst: 'O(2ⁿ)' },
      space: 'O(n)',
    },
    accent: '#f472b6',
  };

  makeInput(size: number): BacktrackInput {
    // 2ⁿ−1 moves: 7 discs is 127 moves and several hundred steps, which is
    // about the limit of what stays watchable.
    const discs = Math.max(3, Math.min(size, 7));
    const initial = new Array<number>(3 * discs).fill(0);
    // Row 0 is the top of a peg, so the smallest disc goes there and the
    // largest rests on the last row. This has to match how `repaint` maps the
    // peg stacks back onto rows, or the tower starts out inverted.
    for (let row = 0; row < discs; row += 1) initial[row * 3] = row + 1;

    return {
      width: 3,
      height: discs,
      initial,
      payload: { discs },
      title: `${discs} discs — ${2 ** discs - 1} moves`,
      board: 'towers',
    };
  }

  protected search(t: BacktrackTracer): void {
    const { discs } = t.payload<{ discs: number }>();
    // Mirror of the board, so the algorithm can pop and push without scanning.
    const pegs: number[][] = [[], [], []];
    for (let d = discs; d >= 1; d -= 1) pegs[0].push(d);

    let moves = 0;
    const names = ['A', 'B', 'C'];

    const repaint = (): void => {
      // Rewrite all three columns after a move. Cheap at these sizes, and it
      // keeps peg state and board state impossible to desynchronise.
      for (let peg = 0; peg < 3; peg += 1) {
        const stack = pegs[peg];
        for (let row = 0; row < discs; row += 1) {
          const fromBottom = discs - 1 - row;
          const value = fromBottom < stack.length ? stack[fromBottom] : 0;
          const index = t.index(row, peg);
          if (t.cell(index) !== value) {
            if (value === 0) t.unplace(index);
            else t.place(index, value);
          }
        }
      }
    };

    const move = (count: number, from: number, to: number, via: number): void => {
      if (t.isTruncated || count === 0) return;

      if (count === 1) {
        const disc = pegs[from].pop();
        if (disc === undefined) return;
        pegs[to].push(disc);
        moves += 1;
        t.at(2).check([], `move disc ${disc}: ${names[from]} → ${names[to]}`);
        repaint();
        t.accept(`move ${moves}`);
        return;
      }

      t.at(4).enter(`${count}:${names[from]}→${names[via]}`, `clear ${count - 1} discs out of the way`);
      move(count - 1, from, via, to);
      t.leave();

      t.at(5).enter(`${names[from]}→${names[to]}`, `move the largest remaining disc`);
      move(1, from, to, via);
      t.leave();

      t.at(6).enter(`${count - 1}:${names[via]}→${names[to]}`, `bring the stack back on top`);
      move(count - 1, via, to, from);
      t.leave();
    };

    t.at(1).enter('root', `move ${discs} discs from A to C`);
    move(discs, 0, 2, 1);
    t.leave(`solved in ${moves} moves`);
  }
}
