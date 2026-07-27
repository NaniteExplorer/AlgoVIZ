import { DPCellRole } from '@/core/model/DPModel';
import type { ThemeMode } from '@/theme';

export interface DPCellStyle {
  fill: string;
  border: string;
  text: string;
  /** 0–1 glow intensity, multiplied by the theme's glow factor. */
  glow: number;
}

const DARK: Record<DPCellRole, DPCellStyle> = {
  [DPCellRole.Empty]: { fill: '#0e111c', border: '#1f2537', text: '#475569', glow: 0 },
  [DPCellRole.Filled]: { fill: '#16203a', border: '#243254', text: '#cbd5e1', glow: 0 },
  [DPCellRole.Reading]: { fill: '#0e4a5c', border: '#22d3ee', text: '#e0fbff', glow: 0.5 },
  [DPCellRole.Writing]: { fill: '#4c1d95', border: '#a78bfa', text: '#f3e8ff', glow: 0.8 },
  [DPCellRole.Focus]: { fill: '#7c2d3f', border: '#fb7185', text: '#ffe4e6', glow: 0.9 },
  [DPCellRole.Trace]: { fill: '#065f46', border: '#34d399', text: '#d1fae5', glow: 0.55 },
};

const LIGHT: Record<DPCellRole, DPCellStyle> = {
  [DPCellRole.Empty]: { fill: '#ffffff', border: '#e2e5ee', text: '#a3aab9', glow: 0 },
  [DPCellRole.Filled]: { fill: '#eef1f8', border: '#cbd0de', text: '#334155', glow: 0 },
  [DPCellRole.Reading]: { fill: '#cffafe', border: '#0e7490', text: '#0c4a5e', glow: 0 },
  [DPCellRole.Writing]: { fill: '#ede9fe', border: '#6d28d9', text: '#3b0764', glow: 0 },
  [DPCellRole.Focus]: { fill: '#ffe4e6', border: '#be123c', text: '#7f1029', glow: 0 },
  [DPCellRole.Trace]: { fill: '#d1fae5', border: '#047857', text: '#064e3b', glow: 0 },
};

const THEMES: Record<ThemeMode, Record<DPCellRole, DPCellStyle>> = { dark: DARK, light: LIGHT };

export function dpPalette(mode: ThemeMode): Record<DPCellRole, DPCellStyle> {
  return THEMES[mode];
}

/** Legend entries, in the order a learner meets them. */
export const DP_LEGEND: { role: DPCellRole; label: string }[] = [
  { role: DPCellRole.Empty, label: 'Not computed' },
  { role: DPCellRole.Focus, label: 'Deciding' },
  { role: DPCellRole.Reading, label: 'Reading' },
  { role: DPCellRole.Writing, label: 'Writing' },
  { role: DPCellRole.Filled, label: 'Settled' },
  { role: DPCellRole.Trace, label: 'Optimal path' },
];
