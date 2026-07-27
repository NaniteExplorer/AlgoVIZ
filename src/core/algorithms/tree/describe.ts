import { ignoreNever } from '@/core/util/assertNever';
import { type TreeStep, TreeStepKind } from './TreeStep';

/** Turn a tree step into a short narration line for the step inspector. */
export function describeTreeStep(step: TreeStep): string {
  if (step.note) return step.note;
  switch (step.kind) {
    case TreeStepKind.RevealAll:
      return 'Show the tree';
    case TreeStepKind.Reveal:
      return `Insert node ${step.node}`;
    case TreeStepKind.Compare:
      return `Compare at node ${step.node}`;
    case TreeStepKind.Visit:
      return `Visit node ${step.node}`;
    case TreeStepKind.Found:
      return `Target found at node ${step.node}`;
    case TreeStepKind.NotFound:
      return 'Target is not present';
    case TreeStepKind.Done:
      return 'Traversal complete';
    default:
      ignoreNever(step.kind);
      return '';
  }
}
