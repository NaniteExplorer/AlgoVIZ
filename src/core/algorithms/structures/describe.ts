import { ignoreNever } from '@/core/util/assertNever';
import { type StructureStep, StructureStepKind } from './StructureStep';

/** Turn a data-structure step into a short narration line. */
export function describeStructureStep(step: StructureStep): string {
  if (step.note) return step.note;
  switch (step.kind) {
    case StructureStepKind.Create:
      return `Create a node holding ${step.value}`;
    case StructureStepKind.Link:
      return `Point ${step.node}.${step.port} at ${step.other}`;
    case StructureStepKind.Unlink:
      return `Clear ${step.node}.${step.port}`;
    case StructureStepKind.Destroy:
      return `Remove node ${step.node}`;
    case StructureStepKind.Focus:
      return `Move to node ${step.node}`;
    case StructureStepKind.Update:
      return `Set node ${step.node} to ${step.value}`;
    case StructureStepKind.Swap:
      return `Swap nodes ${step.node} and ${step.other}`;
    case StructureStepKind.Compare:
      return 'Compare two nodes';
    case StructureStepKind.Tag:
      return step.tag ? `Mark as ${step.tag}` : 'Mark node';
    case StructureStepKind.Phase:
      return 'Next operation';
    case StructureStepKind.Done:
      return 'All operations complete';
    default:
      ignoreNever(step.kind);
      return '';
  }
}
