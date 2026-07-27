import { BoardCellRole, NodeStatus } from '@/core/model/BacktrackModel';
import type { ThemeMode } from '@/theme';

export interface CellStyleSpec {
  fill: string;
  border: string;
  text: string;
  glow: number;
}

const DARK_BOARD: Record<BoardCellRole, CellStyleSpec> = {
  [BoardCellRole.Empty]: { fill: '#0e111c', border: '#1f2537', text: '#64748b', glow: 0 },
  [BoardCellRole.Wall]: { fill: '#020308', border: '#0d1119', text: '#0d1119', glow: 0 },
  [BoardCellRole.Given]: { fill: '#1e293b', border: '#475569', text: '#e2e8f0', glow: 0 },
  [BoardCellRole.Placed]: { fill: '#1e3a8a', border: '#3b82f6', text: '#dbeafe', glow: 0.25 },
  [BoardCellRole.Writing]: { fill: '#4c1d95', border: '#a78bfa', text: '#f3e8ff', glow: 0.85 },
  [BoardCellRole.Erasing]: { fill: '#7c2d3f', border: '#fb7185', text: '#ffe4e6', glow: 0.7 },
  [BoardCellRole.Checking]: { fill: '#0e4a5c', border: '#22d3ee', text: '#e0fbff', glow: 0.55 },
  [BoardCellRole.Solved]: { fill: '#065f46', border: '#34d399', text: '#d1fae5', glow: 0.6 },
};

const LIGHT_BOARD: Record<BoardCellRole, CellStyleSpec> = {
  [BoardCellRole.Empty]: { fill: '#ffffff', border: '#e2e5ee', text: '#94a3b8', glow: 0 },
  [BoardCellRole.Wall]: { fill: '#334155', border: '#1e293b', text: '#1e293b', glow: 0 },
  [BoardCellRole.Given]: { fill: '#e2e8f0', border: '#94a3b8', text: '#0f172a', glow: 0 },
  [BoardCellRole.Placed]: { fill: '#dbeafe', border: '#2563eb', text: '#1e3a8a', glow: 0 },
  [BoardCellRole.Writing]: { fill: '#ede9fe', border: '#6d28d9', text: '#3b0764', glow: 0 },
  [BoardCellRole.Erasing]: { fill: '#ffe4e6', border: '#be123c', text: '#7f1029', glow: 0 },
  [BoardCellRole.Checking]: { fill: '#cffafe', border: '#0e7490', text: '#0c4a5e', glow: 0 },
  [BoardCellRole.Solved]: { fill: '#d1fae5', border: '#047857', text: '#064e3b', glow: 0 },
};

const DARK_NODE: Record<NodeStatus, string> = {
  [NodeStatus.Active]: '#22d3ee',
  [NodeStatus.Rejected]: '#fb7185',
  [NodeStatus.Accepted]: '#34d399',
  [NodeStatus.Closed]: '#475569',
};

const LIGHT_NODE: Record<NodeStatus, string> = {
  [NodeStatus.Active]: '#0e7490',
  [NodeStatus.Rejected]: '#be123c',
  [NodeStatus.Accepted]: '#047857',
  [NodeStatus.Closed]: '#94a3b8',
};

const BOARD_THEMES: Record<ThemeMode, Record<BoardCellRole, CellStyleSpec>> = {
  dark: DARK_BOARD,
  light: LIGHT_BOARD,
};

const NODE_THEMES: Record<ThemeMode, Record<NodeStatus, string>> = {
  dark: DARK_NODE,
  light: LIGHT_NODE,
};

export function boardPalette(mode: ThemeMode): Record<BoardCellRole, CellStyleSpec> {
  return BOARD_THEMES[mode];
}

export function nodePalette(mode: ThemeMode): Record<NodeStatus, string> {
  return NODE_THEMES[mode];
}

export const BACKTRACK_LEGEND: { role: BoardCellRole; label: string }[] = [
  { role: BoardCellRole.Empty, label: 'Empty' },
  { role: BoardCellRole.Given, label: 'Fixed clue' },
  { role: BoardCellRole.Checking, label: 'Checking' },
  { role: BoardCellRole.Writing, label: 'Placing' },
  { role: BoardCellRole.Erasing, label: 'Undoing' },
  { role: BoardCellRole.Placed, label: 'Placed' },
  { role: BoardCellRole.Solved, label: 'Solution' },
];
