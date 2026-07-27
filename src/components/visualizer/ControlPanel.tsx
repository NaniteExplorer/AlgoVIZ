'use client';

import type { ControlSpec } from '@/core/visualization/CategoryModule';
import type { PlaybackSnapshot } from '@/core/playback/PlaybackController';
import type { VisualizerActions } from '@/hooks/useVisualizer';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';
import {
  PlayIcon,
  PauseIcon,
  StepBackIcon,
  StepForwardIcon,
  ShuffleIcon,
  RestartIcon,
} from './icons';

interface Props {
  snapshot: PlaybackSnapshot;
  controls: ControlSpec[];
  params: Record<string, number>;
  accent: string;
  actions: VisualizerActions;
  className?: string;
}

/**
 * Transport plus the family's parameter sliders.
 *
 * One implementation serves every breakpoint — desktop sidebar, tablet tab and
 * mobile bottom sheet all render this component. Having a second "mobile
 * controls" variant would guarantee the two drift.
 */
export function ControlPanel({ snapshot, controls, params, accent, actions, className }: Props) {
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <Scrubber snapshot={snapshot} accent={accent} onSeek={actions.seek} />
      <Transport snapshot={snapshot} accent={accent} actions={actions} />

      <Slider
        label="Speed"
        value={snapshot.speed}
        min={1}
        max={300}
        step={1}
        suffix=" steps/s"
        accent={accent}
        onChange={actions.setSpeed}
      />

      {controls.map((c) => (
        <Slider
          key={c.key}
          label={c.label}
          value={params[c.key] ?? c.default}
          min={c.min}
          max={c.max}
          step={c.step}
          suffix={c.suffix ?? ''}
          accent={accent}
          onChange={(v) => actions.setParam(c.key, v)}
        />
      ))}

      <button
        type="button"
        onClick={actions.regenerate}
        className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-line bg-surface-800 px-4 text-sm font-medium text-content-primary transition-colors hover:bg-surface-700"
      >
        <ShuffleIcon width={16} height={16} />
        Generate new dataset
      </button>
    </div>
  );
}

/** Timeline scrubber. Exported so the compact mobile transport can reuse it. */
export function Scrubber({
  snapshot,
  accent,
  onSeek,
  className,
}: {
  snapshot: PlaybackSnapshot;
  accent: string;
  onSeek(index: number): void;
  className?: string;
}) {
  const position = snapshot.cursor + 1;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between font-mono text-xs text-content-muted">
        <span>step</span>
        <span className="tabular-nums">
          {position} / {snapshot.total}
        </span>
      </div>
      <input
        type="range"
        min={-1}
        max={Math.max(snapshot.total - 1, 0)}
        value={snapshot.cursor}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="algoviz-range"
        style={{ accentColor: accent }}
        aria-label="Timeline position"
        // The raw index is meaningless read aloud; the narration is the point.
        aria-valuetext={`Step ${position} of ${snapshot.total}${snapshot.note ? `: ${snapshot.note}` : ''}`}
      />
    </div>
  );
}

/** Play/pause and stepping. Exported for the mobile mini-transport. */
export function Transport({
  snapshot,
  accent,
  actions,
  compact = false,
}: {
  snapshot: PlaybackSnapshot;
  accent: string;
  actions: VisualizerActions;
  compact?: boolean;
}) {
  const playing = snapshot.status === 'playing';
  return (
    <div
      role="group"
      aria-label="Playback"
      className={cn('flex items-center gap-2', compact ? 'justify-start' : 'justify-center')}
    >
      <IconButton
        label="Restart"
        variant="outline"
        size={compact ? 'sm' : 'md'}
        onClick={() => actions.seek(-1)}
        disabled={snapshot.cursor < 0}
      >
        <RestartIcon />
      </IconButton>
      <IconButton
        label="Step back"
        variant="outline"
        size={compact ? 'sm' : 'md'}
        onClick={actions.stepBackward}
        disabled={snapshot.cursor < 0}
      >
        <StepBackIcon />
      </IconButton>
      <button
        type="button"
        onClick={actions.toggle}
        aria-label={playing ? 'Pause' : 'Play'}
        aria-pressed={playing}
        style={{ background: accent, color: 'rgb(var(--c-accent-contrast))' }}
        className={cn(
          'glow-accent flex items-center justify-center rounded-full transition-transform duration-150 hover:scale-105',
          compact ? 'h-10 w-10' : 'h-12 w-12',
        )}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <IconButton
        label="Step forward"
        variant="outline"
        size={compact ? 'sm' : 'md'}
        onClick={actions.stepForward}
        disabled={snapshot.total > 0 && snapshot.cursor >= snapshot.total - 1}
      >
        <StepForwardIcon />
      </IconButton>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix = '',
  accent,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  accent: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center justify-between font-mono text-xs text-content-muted">
        <span>{label}</span>
        <span className="tabular-nums text-content-primary">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="algoviz-range"
        style={{ accentColor: accent }}
        // The visible label also renders the live value, so relying on the
        // wrapping <label> would announce "Speed 47 steps/s" as the control's
        // *name*. An explicit name plus the native value keeps the two separate.
        aria-label={label}
      />
    </label>
  );
}
