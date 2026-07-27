import { ignoreNever } from '@/core/util/assertNever';
import { type BacktrackStep, BacktrackStepKind } from './BacktrackStep';

/** Turn a backtracking step into a short narration line. */
export function describeBacktrackStep(step: BacktrackStep): string {
  if (step.note) return step.note;
  switch (step.kind) {
    case BacktrackStepKind.Push:
      return step.choice ? `Try ${step.choice}` : 'Descend one level';
    case BacktrackStepKind.Reject:
      return 'Dead end — unwind';
    case BacktrackStepKind.Accept:
      return 'Solution found';
    case BacktrackStepKind.Pop:
      return 'Return from this branch';
    case BacktrackStepKind.Place:
      return `Place ${step.value} in cell ${step.cell}`;
    case BacktrackStepKind.Unplace:
      return `Undo the placement in cell ${step.cell}`;
    case BacktrackStepKind.Check:
      return 'Check the constraints';
    case BacktrackStepKind.Done:
      return 'Search complete';
    default:
      ignoreNever(step.kind);
      return '';
  }
}
