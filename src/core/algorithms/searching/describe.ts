import { ignoreNever } from '@/core/util/assertNever';
import { type SearchStep, SearchStepKind } from './SearchStep';

/** Turn a search step into a short narration line for the step inspector. */
export function describeSearchStep(step: SearchStep): string {
  if (step.note) return step.note;
  switch (step.kind) {
    case SearchStepKind.Bounds:
      return `Search window narrowed to [${step.lo}, ${step.hi}]`;
    case SearchStepKind.Probe:
      return `Compare element at index ${step.index} with the target`;
    case SearchStepKind.Eliminate:
      return `Rule out indices ${step.from}–${step.to}`;
    case SearchStepKind.Found:
      return `Target found at index ${step.index}`;
    case SearchStepKind.Exhausted:
      return 'Target is not present';
    default:
      ignoreNever(step.kind);
      return '';
  }
}
