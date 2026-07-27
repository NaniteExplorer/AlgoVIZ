import { StructureNodeRole } from '@/core/model/StructureModel';
import type { ThemeMode } from '@/theme';

export interface NodeStyleSpec {
  fill: string;
  border: string;
  text: string;
  glow: number;
}

const DARK: Record<StructureNodeRole, NodeStyleSpec> = {
  [StructureNodeRole.Idle]: { fill: '#16203a', border: '#243254', text: '#cbd5e1', glow: 0 },
  [StructureNodeRole.Focus]: { fill: '#7c2d3f', border: '#fb7185', text: '#ffe4e6', glow: 0.85 },
  [StructureNodeRole.Comparing]: { fill: '#0e4a5c', border: '#22d3ee', text: '#e0fbff', glow: 0.6 },
  [StructureNodeRole.New]: { fill: '#4c1d95', border: '#a78bfa', text: '#f3e8ff', glow: 0.8 },
  [StructureNodeRole.Updating]: { fill: '#78350f', border: '#fbbf24', text: '#fef3c7', glow: 0.75 },
  [StructureNodeRole.Tagged]: { fill: '#065f46', border: '#34d399', text: '#d1fae5', glow: 0.55 },
};

const LIGHT: Record<StructureNodeRole, NodeStyleSpec> = {
  [StructureNodeRole.Idle]: { fill: '#eef1f8', border: '#cbd0de', text: '#334155', glow: 0 },
  [StructureNodeRole.Focus]: { fill: '#ffe4e6', border: '#be123c', text: '#7f1029', glow: 0 },
  [StructureNodeRole.Comparing]: { fill: '#cffafe', border: '#0e7490', text: '#0c4a5e', glow: 0 },
  [StructureNodeRole.New]: { fill: '#ede9fe', border: '#6d28d9', text: '#3b0764', glow: 0 },
  [StructureNodeRole.Updating]: { fill: '#fef3c7', border: '#b45309', text: '#78350f', glow: 0 },
  [StructureNodeRole.Tagged]: { fill: '#d1fae5', border: '#047857', text: '#064e3b', glow: 0 },
};

const THEMES: Record<ThemeMode, Record<StructureNodeRole, NodeStyleSpec>> = {
  dark: DARK,
  light: LIGHT,
};

export function structurePalette(mode: ThemeMode): Record<StructureNodeRole, NodeStyleSpec> {
  return THEMES[mode];
}

/**
 * Tags carry their own accent, because "found" and "collision" mean opposite
 * things and should not share the generic tagged colour.
 */
const DARK_TAGS: Record<string, string> = {
  collision: '#fb7185',
  found: '#34d399',
  unbalanced: '#fbbf24',
  removing: '#f43f5e',
};

const LIGHT_TAGS: Record<string, string> = {
  collision: '#be123c',
  found: '#047857',
  unbalanced: '#b45309',
  removing: '#9f1239',
};

export function tagColor(tag: string | undefined, mode: ThemeMode): string | undefined {
  if (!tag) return undefined;
  return (mode === 'dark' ? DARK_TAGS : LIGHT_TAGS)[tag];
}

export const STRUCTURE_LEGEND: { role: StructureNodeRole; label: string }[] = [
  { role: StructureNodeRole.Idle, label: 'Stored' },
  { role: StructureNodeRole.New, label: 'New' },
  { role: StructureNodeRole.Focus, label: 'Cursor' },
  { role: StructureNodeRole.Comparing, label: 'Comparing' },
  { role: StructureNodeRole.Updating, label: 'Changing' },
  { role: StructureNodeRole.Tagged, label: 'Marked' },
];
