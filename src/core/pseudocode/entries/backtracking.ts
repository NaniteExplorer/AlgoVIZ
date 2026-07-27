import type { Pseudocode } from '../PseudocodeRegistry';

/** Pseudocode listings for the backtracking family. */
export const BACKTRACKING_PSEUDOCODE: Record<string, Pseudocode> = {
  'n-queens': {
    lines: [
      /* 0 */ 'procedure solve(board, col)',
      /* 1 */ '  // start from an empty board',
      /* 2 */ '  if col = n then return SOLVED',
      /* 3 */ '  for row ← 0 to n-1 do',
      /* 4 */ '    try (row, col)',
      /* 5 */ '    if (row, col) is attacked then',
      /* 6 */ '      reject and try the next row',
      /* 7 */ '    place a queen at (row, col)',
      /* 8 */ '    if solve(board, col + 1) then return SOLVED',
      /* 9 */ '    remove the queen        // backtrack',
      /* 10 */ '  return FAILED',
    ],
  },

  'sudoku-solver': {
    lines: [
      /* 0 */ 'procedure solve(grid, index)',
      /* 1 */ '  // givens are fixed and skipped',
      /* 2 */ '  if index = n·n then return SOLVED',
      /* 3 */ '  for digit ← 1 to n do',
      /* 4 */ '    try digit at this cell',
      /* 5 */ '    check the row, column and box peers',
      /* 6 */ '    if digit clashes then try the next digit',
      /* 7 */ '    write digit into the cell',
      /* 8 */ '    if solve(grid, index + 1) then return SOLVED',
      /* 9 */ '    erase the cell          // backtrack',
      /* 10 */ '  return FAILED',
    ],
  },

  'rat-in-maze': {
    lines: [
      /* 0 */ 'procedure walk(row, col)',
      /* 1 */ '  // start at the top-left',
      /* 2 */ '',
      /* 3 */ '  if out of bounds, a wall, or already visited then return FAILED',
      /* 4 */ '  if (row, col) is the exit then return SOLVED',
      /* 5 */ '  mark (row, col) as part of the path',
      /* 6 */ '  for each direction (down, right, up, left) do',
      /* 7 */ '    step to the neighbouring cell',
      /* 8 */ '    if walk(neighbour) then return SOLVED',
      /* 9 */ '    that direction failed — try the next',
      /* 10 */ '  unmark (row, col)         // backtrack',
      /* 11 */ '  return FAILED',
    ],
  },

  permutations: {
    lines: [
      /* 0 */ 'procedure build(depth)',
      /* 1 */ '  // start with an empty ordering',
      /* 2 */ '  if depth = n then emit the permutation; return',
      /* 3 */ '  for each unused value v do',
      /* 4 */ '    choose v',
      /* 5 */ '    place v at position depth',
      /* 6 */ '    build(depth + 1)',
      /* 7 */ '    un-choose v             // backtrack',
    ],
  },

  'subset-sum': {
    lines: [
      /* 0 */ 'procedure explore(index, sum)',
      /* 1 */ '  // looking for a subset summing to target',
      /* 2 */ '  if sum = target then return SOLVED',
      /* 3 */ '  if index = n then return FAILED',
      /* 4 */ '  if sum > target then return FAILED           // prune: overshoot',
      /* 5 */ '  if sum + remaining[index] < target then return FAILED  // prune: hopeless',
      /* 6 */ '',
      /* 7 */ '  take A[index]:  explore(index + 1, sum + A[index])',
      /* 8 */ '',
      /* 9 */ '  skip A[index]:  explore(index + 1, sum)',
      /* 10 */ '  return FAILED',
    ],
  },

  'tower-of-hanoi': {
    lines: [
      /* 0 */ 'procedure move(n, from, to, via)',
      /* 1 */ '  // move n discs from `from` to `to`',
      /* 2 */ '  if n = 1 then move the single disc; return',
      /* 3 */ '',
      /* 4 */ '  move(n - 1, from, via, to)   // clear the way',
      /* 5 */ '  move(1,     from, to,  via)  // move the largest',
      /* 6 */ '  move(n - 1, via,  to,  from) // rebuild on top',
    ],
  },
};
