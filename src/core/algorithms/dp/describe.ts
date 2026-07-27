import { ignoreNever } from '@/core/util/assertNever';
import { type DPStep, DPStepKind } from './DPStep';

/** Turn a DP step into a short narration line for the step inspector. */
export function describeDPStep(step: DPStep): string {
  if (step.note) return step.note;
  switch (step.kind) {
    case DPStepKind.Init:
      return 'Set up the table';
    case DPStepKind.Read:
      return `Read cell (${step.r}, ${step.c})`;
    case DPStepKind.Write:
      return `Write ${step.value} into cell (${step.r}, ${step.c})`;
    case DPStepKind.Focus:
      return `Evaluate cell (${step.r}, ${step.c})`;
    case DPStepKind.Decide:
      return step.label ? `Choose "${step.label}"` : 'Make a choice';
    case DPStepKind.Trace:
      return `Cell (${step.r}, ${step.c}) is on the optimal path`;
    case DPStepKind.Done:
      return 'Table complete';
    default:
      ignoreNever(step.kind);
      return '';
  }
}
