import { AlgorithmCategory } from '../types';
import { DPAlgorithm } from '../dp/DPAlgorithm';

/**
 * Machine-learning and probability algorithms initially reuse the DP table
 * visualizer: learners can watch beliefs, states and cluster assignments change
 * cell by cell without waiting for a bespoke renderer.
 */
export abstract class MLAlgorithm extends DPAlgorithm {}

export const ML_CATEGORY = AlgorithmCategory.MachineLearning;
