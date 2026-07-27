import { algorithmRegistry } from '../AlgorithmRegistry';
import { NQueens } from './NQueens';
import { Permutations } from './Permutations';
import { RatInMaze } from './RatInMaze';
import { SubsetSum } from './SubsetSum';
import { SudokuSolver } from './SudokuSolver';
import { TowerOfHanoi } from './TowerOfHanoi';

/**
 * Registration barrel for the backtracking family.
 *
 * Ordered by how directly each one shows the idea: the maze is a literal walk,
 * N-Queens is the textbook case, and Hanoi comes last because it is pure
 * recursion rather than search.
 */
export const BACKTRACKING_ALGORITHMS = [
  new RatInMaze(),
  new NQueens(),
  new SudokuSolver(),
  new Permutations(),
  new SubsetSum(),
  new TowerOfHanoi(),
];

algorithmRegistry.registerAll(BACKTRACKING_ALGORITHMS);

export { BacktrackAlgorithm, BACKTRACKING_CATEGORY } from './BacktrackAlgorithm';
export { BacktrackTracer } from './BacktrackTracer';
export * from './BacktrackStep';
export { describeBacktrackStep } from './describe';
