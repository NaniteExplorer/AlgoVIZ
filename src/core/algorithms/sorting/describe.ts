import { ignoreNever } from '@/core/util/assertNever';
import { type SortStep, SortStepKind } from './SortStep';

/** Turn a step into a short narration line for the step inspector. */
export function describeSortStep(step: SortStep): string {
  if (step.note) return step.note;
  switch (step.kind) {
    case SortStepKind.Compare:
      return `Compare positions ${step.a} and ${step.b}`;
    case SortStepKind.Swap:
      return `Swap positions ${step.a} and ${step.b}`;
    case SortStepKind.Overwrite:
      return `Write ${step.value} into position ${step.a}`;
    case SortStepKind.Select:
      return `Select position ${step.a}${step.role ? ` as ${step.role}` : ''}`;
    case SortStepKind.Deselect:
      return `Release position ${step.a}`;
    case SortStepKind.MarkSorted:
      return `Position ${step.a} is now sorted`;
    default:
      // Compile-time exhaustiveness: adding a SortStepKind without a case here
      // is a type error, not a silently blank narration line.
      ignoreNever(step.kind);
      return '';
  }
}
