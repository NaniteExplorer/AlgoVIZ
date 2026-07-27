const { suite, check, checkTrue, seeded, replay } = require('./harness.cjs');

const B = '../.verify-build';
const { NQueens } = require(`${B}/core/algorithms/backtracking/NQueens`);
const { SudokuSolver } = require(`${B}/core/algorithms/backtracking/SudokuSolver`);
const { RatInMaze } = require(`${B}/core/algorithms/backtracking/RatInMaze`);
const { Permutations } = require(`${B}/core/algorithms/backtracking/Permutations`);
const { SubsetSum } = require(`${B}/core/algorithms/backtracking/SubsetSum`);
const { TowerOfHanoi } = require(`${B}/core/algorithms/backtracking/TowerOfHanoi`);
const { BacktrackModel } = require(`${B}/core/model/BacktrackModel`);
const { MAZE_WALL } = require(`${B}/core/algorithms/backtracking/BacktrackStep`);

/**
 * Backtracking is checked by validating the *final board*, not the step count:
 * a search can take any number of paths to a solution, but the solution itself
 * must satisfy the problem's constraints. That is the property worth asserting.
 */
module.exports = function runBacktrackingChecks() {
  suite('Backtracking');

  // N-Queens: the final board must be a genuinely legal placement.
  {
    const algo = new NQueens();
    for (const n of [4, 6, 8]) {
      const input = algo.makeInput(n, seeded(1));
      const model = new BacktrackModel();
      const { steps } = replay(algo, input, model, `n-queens n=${n}`);
      checkTrue(`n-queens n=${n}: reports a solution`, steps.some((s) => s.kind === 'accept'));

      const queens = [];
      for (let i = 0; i < n * n; i += 1) {
        if (model.valueAt(i) > 0) queens.push([Math.floor(i / n), i % n]);
      }
      check(`n-queens n=${n}: exactly n queens placed`, queens.length, n);

      let conflicts = 0;
      for (let i = 0; i < queens.length; i += 1) {
        for (let j = i + 1; j < queens.length; j += 1) {
          const [r1, c1] = queens[i];
          const [r2, c2] = queens[j];
          if (r1 === r2 || c1 === c2 || Math.abs(r1 - r2) === Math.abs(c1 - c2)) conflicts += 1;
        }
      }
      check(`n-queens n=${n}: no two queens attack`, conflicts, 0);
    }
  }

  // Sudoku: every row, column and box must contain 1..n exactly once.
  {
    const algo = new SudokuSolver();
    const input = algo.makeInput(6, seeded(9));
    const model = new BacktrackModel();
    replay(algo, input, model, 'sudoku');

    const n = 4;
    const box = 2;
    const at = (r, c) => model.valueAt(r * n + c);
    let bad = 0;
    const complete = (vals) => new Set(vals).size === n && vals.every((v) => v >= 1 && v <= n);
    for (let r = 0; r < n; r += 1) {
      if (!complete(Array.from({ length: n }, (_, c) => at(r, c)))) bad += 1;
    }
    for (let c = 0; c < n; c += 1) {
      if (!complete(Array.from({ length: n }, (_, r) => at(r, c)))) bad += 1;
    }
    for (let br = 0; br < n; br += box) {
      for (let bc = 0; bc < n; bc += box) {
        const vals = [];
        for (let r = br; r < br + box; r += 1) for (let c = bc; c < bc + box; c += 1) vals.push(at(r, c));
        if (!complete(vals)) bad += 1;
      }
    }
    check('sudoku: every row, column and box is complete', bad, 0);
  }

  // Maze: the marked path must be contiguous from entrance to exit.
  {
    const algo = new RatInMaze();
    const input = algo.makeInput(8, seeded(17));
    const model = new BacktrackModel();
    const { steps } = replay(algo, input, model, 'rat-in-maze');
    const n = input.width;

    if (steps.some((s) => s.kind === 'accept')) {
      const onPath = (r, c) => r >= 0 && r < n && c >= 0 && c < n && model.valueAt(r * n + c) === 2;
      checkTrue('maze: entrance is on the path', onPath(0, 0));
      checkTrue('maze: exit is on the path', onPath(n - 1, n - 1));

      // Flood-fill the marked cells from the entrance; the exit must be reached.
      const seen = new Set([0]);
      const queue = [[0, 0]];
      while (queue.length) {
        const [r, c] = queue.shift();
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = r + dr;
          const nc = c + dc;
          const key = nr * n + nc;
          if (onPath(nr, nc) && !seen.has(key)) {
            seen.add(key);
            queue.push([nr, nc]);
          }
        }
      }
      checkTrue('maze: path is contiguous entrance → exit', seen.has(n * n - 1));

      let throughWalls = 0;
      for (let i = 0; i < n * n; i += 1) {
        if (input.initial[i] === MAZE_WALL && model.valueAt(i) === 2) throughWalls += 1;
      }
      check('maze: path never crosses a wall', throughWalls, 0);
    }
  }

  // Permutations: exactly n! distinct orderings, no duplicates, no omissions.
  {
    const algo = new Permutations();
    for (const n of [3, 4, 5]) {
      const input = algo.makeInput(n, seeded(29));
      const steps = algo.run(input);
      const values = input.payload.values;

      // Rebuild each accepted board by replaying placements up to that point.
      const board = new Array(n).fill(0);
      const seen = [];
      for (const step of steps) {
        if (step.kind === 'place') board[step.cell] = step.value;
        else if (step.kind === 'unplace') board[step.cell] = 0;
        else if (step.kind === 'accept') seen.push(board.join(','));
      }

      const factorial = (k) => (k <= 1 ? 1 : k * factorial(k - 1));
      check(`permutations n=${n}: emits n! orderings`, seen.length, factorial(n));
      // Distinct *positions* is the real invariant — duplicate input values
      // legitimately produce repeated tuples.
      checkTrue(
        `permutations n=${n}: every ordering uses each value once`,
        seen.every((s) => {
          const counts = new Map();
          for (const v of s.split(',')) counts.set(v, (counts.get(v) ?? 0) + 1);
          const expect = new Map();
          for (const v of values) expect.set(String(v), (expect.get(String(v)) ?? 0) + 1);
          return [...expect].every(([k, v]) => counts.get(k) === v);
        }),
      );
    }
  }

  // Subset sum: an accepted run's chosen elements must total exactly the target.
  {
    const algo = new SubsetSum();
    for (const seed of [2, 13, 44]) {
      const input = algo.makeInput(10, seeded(seed));
      const { values, target } = input.payload;
      const model = new BacktrackModel();
      const { steps } = replay(algo, input, model, `subset-sum seed=${seed}`);

      if (steps.some((s) => s.kind === 'accept')) {
        let total = 0;
        for (let i = 0; i < values.length; i += 1) if (model.valueAt(i) > 0) total += values[i];
        check(`subset-sum seed=${seed}: chosen subset hits the target`, total, target);
      } else {
        // The generator always builds a reachable target, so failing is a bug.
        check(`subset-sum seed=${seed}: finds the guaranteed subset`, 'not found', 'found');
      }
    }
  }

  // Hanoi: exactly 2ⁿ-1 moves, and no disc ever lands on a smaller one.
  {
    const algo = new TowerOfHanoi();
    for (const discs of [3, 4, 5]) {
      const input = algo.makeInput(discs, seeded(1));
      const steps = algo.run(input);
      const moves = steps.filter((s) => s.kind === 'accept').length;
      check(`hanoi n=${discs}: makes 2ⁿ-1 moves`, moves, 2 ** discs - 1);

      // Replay the board and assert the stacking rule after every move.
      const model = new BacktrackModel();
      model.reset(input);
      let violations = 0;
      for (const step of steps) {
        model.apply(step);
        if (step.kind !== 'accept') continue;
        // Row 0 is the top of the peg, so scanning downwards the discs must
        // get strictly larger. A smaller disc below a larger one is the
        // illegal state the puzzle forbids.
        for (let peg = 0; peg < 3; peg += 1) {
          let above = 0;
          for (let row = 0; row < discs; row += 1) {
            const v = model.valueAt(row * 3 + peg);
            if (v === 0) continue;
            if (above !== 0 && v < above) violations += 1;
            above = v;
          }
        }
      }
      check(`hanoi n=${discs}: never stacks larger on smaller`, violations, 0);

      // And it must actually finish with everything on peg C.
      let onC = 0;
      for (let row = 0; row < discs; row += 1) if (model.valueAt(row * 3 + 2) > 0) onC += 1;
      check(`hanoi n=${discs}: all discs end on peg C`, onC, discs);
    }
  }
};
