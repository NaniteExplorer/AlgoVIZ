import type { AlgorithmMeta } from '../types';
import { BacktrackAlgorithm, BACKTRACKING_CATEGORY, randInt } from './BacktrackAlgorithm';
import { type BacktrackInput, MAZE_WALL } from './BacktrackStep';
import type { BacktrackTracer } from './BacktrackTracer';

const PATH = 2;

/**
 * Rat in a maze.
 *
 * The most intuitive member of the family: the "recursion tree" is a literal
 * walk through a maze, and backtracking is literally retracing your steps. It
 * is the example to reach for when someone finds N-Queens too abstract.
 */
export class RatInMaze extends BacktrackAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'rat-in-maze',
    name: 'Rat in a Maze',
    category: BACKTRACKING_CATEGORY,
    group: 'Board',
    description:
      'Finds a path from the top-left to the bottom-right of a grid, moving only through open cells. The search commits to a direction, walks as far as it can, and retraces its steps when it hits a dead end — backtracking in its most literal form.',
    complexity: {
      time: { best: 'O(1)', average: 'O(4^(mn))', worst: 'O(4^(mn))' },
      space: 'O(mn)',
    },
    accent: '#34d399',
  };

  makeInput(size: number, random: () => number): BacktrackInput {
    const n = Math.max(5, Math.min(size + 2, 12));
    const cells = new Array<number>(n * n).fill(0);

    // Carve walls at random, then guarantee solvability by clearing the top row
    // and the right column — a maze the rat cannot escape teaches nothing.
    for (let i = 0; i < cells.length; i += 1) {
      if (random() < 0.28) cells[i] = MAZE_WALL;
    }
    for (let c = 0; c < n; c += 1) cells[c] = cells[c] === MAZE_WALL ? 0 : cells[c];
    for (let r = 0; r < n; r += 1) {
      const i = r * n + (n - 1);
      cells[i] = cells[i] === MAZE_WALL ? 0 : cells[i];
    }
    cells[0] = 0;
    cells[n * n - 1] = 0;

    return {
      width: n,
      height: n,
      initial: cells,
      payload: { walls: randInt(random, 0, 0) },
      title: `${n}×${n} maze — reach the bottom-right`,
      board: 'maze',
    };
  }

  protected search(t: BacktrackTracer): void {
    const n = t.width;
    const goal = n * n - 1;
    const visited = new Set<number>();

    // Down and right first: the goal is bottom-right, so this finds a path
    // sooner and the animation spends less time exploring backwards.
    const moves: [string, number, number][] = [
      ['↓', 1, 0],
      ['→', 0, 1],
      ['↑', -1, 0],
      ['←', 0, -1],
    ];

    const walk = (row: number, col: number): boolean => {
      if (t.isTruncated) return false;
      const index = t.index(row, col);

      t.at(3).check([index], `at (${row}, ${col})`);
      if (index === goal) {
        t.at(4).place(index, PATH, 'reached the exit');
        t.accept('a full path to the exit exists');
        return true;
      }

      t.at(5).place(index, PATH, `step onto (${row}, ${col})`);
      visited.add(index);

      for (const [label, dr, dc] of moves) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;

        const next = t.index(nr, nc);
        if (visited.has(next) || t.cell(next) === MAZE_WALL) continue;

        t.at(7).enter(label, `move ${label} to (${nr}, ${nc})`);
        if (walk(nr, nc)) return true;
        t.at(9).reject('that direction is a dead end');
        t.leave();
      }

      // Nothing worked from here: step back off this cell.
      t.at(10).unplace(index, `retreat from (${row}, ${col})`);
      visited.delete(index);
      return false;
    };

    t.at(1).enter('start', 'start at the top-left');
    const solved = walk(0, 0);
    if (!solved) t.reject('no path reaches the exit');
    t.leave();
  }
}
