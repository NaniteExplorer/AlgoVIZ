import { GraphEdgeRole, GraphNodeRole } from '@/core/model/GraphModel';

export interface NodeStyle {
  color: string;
  emissive: number;
  /** Scale multiplier (current node swells, etc.). */
  scale: number;
}

export interface EdgeStyle {
  color: string;
  emissive: number;
  opacity: number;
}

export const GRAPH_NODE_STYLES: Record<GraphNodeRole, NodeStyle> = {
  [GraphNodeRole.Default]: { color: '#3b5bdb', emissive: 0.2, scale: 1 },
  [GraphNodeRole.Start]: { color: '#34d399', emissive: 0.8, scale: 1.35 },
  [GraphNodeRole.Goal]: { color: '#f472b6', emissive: 0.8, scale: 1.35 },
  [GraphNodeRole.Frontier]: { color: '#22d3ee', emissive: 0.6, scale: 1.1 },
  [GraphNodeRole.Current]: { color: '#fbbf24', emissive: 1.0, scale: 1.5 },
  [GraphNodeRole.Settled]: { color: '#6366f1', emissive: 0.4, scale: 1 },
  [GraphNodeRole.Path]: { color: '#fde047', emissive: 1.0, scale: 1.35 },
};

export const GRAPH_EDGE_STYLES: Record<GraphEdgeRole, EdgeStyle> = {
  [GraphEdgeRole.Default]: { color: '#1e3a8a', emissive: 0.1, opacity: 0.32 },
  [GraphEdgeRole.Explored]: { color: '#22d3ee', emissive: 0.5, opacity: 0.7 },
  [GraphEdgeRole.Path]: { color: '#fde047', emissive: 0.95, opacity: 1 },
  /** MST/flow edges: bright and solid, the algorithm's actual answer. */
  [GraphEdgeRole.Selected]: { color: '#34d399', emissive: 0.9, opacity: 1 },
  /** Considered and discarded — dimmed almost to nothing, but still visible so
      the viewer can see how much was ruled out. */
  [GraphEdgeRole.Rejected]: { color: '#7f1d1d', emissive: 0.05, opacity: 0.18 },
};

/**
 * Categorical ramp for component colouring (Union–Find, Tarjan).
 *
 * Chosen to stay distinguishable next to each other and to avoid colliding with
 * the role colours above — a component tinted the same cyan as "frontier" would
 * be actively misleading.
 */
export const GRAPH_GROUP_COLORS = [
  '#22d3ee',
  '#f472b6',
  '#a3e635',
  '#fbbf24',
  '#a78bfa',
  '#fb7185',
  '#38bdf8',
  '#4ade80',
];

export function groupColor(index: number): string {
  return GRAPH_GROUP_COLORS[index % GRAPH_GROUP_COLORS.length];
}

/** Disjoint-set parent pointers, drawn on top of the real edges. */
export const DSU_EDGE_STYLE: EdgeStyle = { color: '#a78bfa', emissive: 0.85, opacity: 0.95 };

export const GRAPH_LEGEND: { role: GraphNodeRole; label: string }[] = [
  { role: GraphNodeRole.Start, label: 'Start' },
  { role: GraphNodeRole.Goal, label: 'Goal' },
  { role: GraphNodeRole.Frontier, label: 'Frontier' },
  { role: GraphNodeRole.Current, label: 'Visiting' },
  { role: GraphNodeRole.Settled, label: 'Settled' },
  { role: GraphNodeRole.Path, label: 'Result path' },
];

export const GRAPH_EDGE_LEGEND: { role: GraphEdgeRole; label: string }[] = [
  { role: GraphEdgeRole.Selected, label: 'Kept' },
  { role: GraphEdgeRole.Rejected, label: 'Discarded' },
];
