import { ignoreNever } from '@/core/util/assertNever';
import { type GraphStep, GraphStepKind } from './GraphStep';

/** Turn a graph step into a short narration line for the step inspector. */
export function describeGraphStep(step: GraphStep): string {
  if (step.note) return step.note;
  switch (step.kind) {
    case GraphStepKind.Frontier:
      return `Add node ${step.node} to the frontier`;
    case GraphStepKind.Visit:
      return `Visit node ${step.node}`;
    case GraphStepKind.Explore:
      return `Explore edge ${step.from} → ${step.to}`;
    case GraphStepKind.Relax:
      return `Relax edge ${step.from} → ${step.to} (distance ${step.dist})`;
    case GraphStepKind.Settle:
      return `Settle node ${step.node}`;
    case GraphStepKind.Path:
      return `Node ${step.node} is on the shortest path`;
    case GraphStepKind.SelectEdge:
      return `Keep edge ${step.from} – ${step.to}`;
    case GraphStepKind.RejectEdge:
      return `Discard edge ${step.from} – ${step.to}`;
    case GraphStepKind.AddEdge:
      return `Link ${step.from} to ${step.to}`;
    case GraphStepKind.Group:
      return `Node ${step.node} joins component ${step.group}`;
    case GraphStepKind.Emit:
      return `Output node ${step.node}`;
    case GraphStepKind.Flow:
      return `Push ${step.amount} along ${step.from} → ${step.to}`;
    case GraphStepKind.Fail:
      return 'No valid result exists';
    case GraphStepKind.Done:
      return 'Search complete';
    default:
      ignoreNever(step.kind);
      return '';
  }
}
