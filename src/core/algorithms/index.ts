/**
 * Algorithm layer barrel + registration entrypoint.
 *
 * Importing this module guarantees the registry is fully populated. Category
 * barrels are imported for their registration side-effects; adding a family
 * means adding its barrel here in the same way.
 */
import './sorting';
import './searching';
import './graph';
import './tree';
import './structures';
// Pseudocode listings register alongside the algorithms so a single import of
// this barrel leaves both registries consistent.
import '../pseudocode';

export * from './types';
export { StepTracer } from './StepTracer';
export { algorithmRegistry, AlgorithmRegistry } from './AlgorithmRegistry';
export type { AnyAlgorithm } from './AlgorithmRegistry';
