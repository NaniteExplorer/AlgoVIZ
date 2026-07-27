'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { ACTIVE_CATEGORIES, entriesOf, getEntryBySlug } from '@/catalog';
import type { AlgorithmCategory } from '@/core/algorithms';
import { MAX_LANES } from '@/core/playback/RaceController';
import { useRace } from '@/hooks/useRace';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';
import {
  PauseIcon,
  PlayIcon,
  RestartIcon,
  ShuffleIcon,
  StepBackIcon,
  StepForwardIcon,
} from '@/components/visualizer/icons';

const DEFAULTS = { a: 'bubble-sort', b: 'quick-sort', size: 40, seed: 1 };

/**
 * Two (or more) algorithms racing on identical input.
 *
 * The URL is the state: `?a=…&b=…&n=40&seed=7` makes any particular race
 * shareable and reproducible, which matters for teaching — "look at this exact
 * comparison" has to be a link, not a set of instructions.
 */
export function RaceView() {
  const router = useRouter();
  const params = useSearchParams();

  const slugs = useMemo(() => {
    const picked = ['a', 'b', 'c', 'd']
      .map((key) => params.get(key))
      .filter((slug): slug is string => Boolean(slug) && Boolean(getEntryBySlug(slug as string)));
    return picked.length >= 2 ? picked.slice(0, MAX_LANES) : [DEFAULTS.a, DEFAULTS.b];
  }, [params]);

  const size = Number(params.get('n')) || DEFAULTS.size;
  const seed = Number(params.get('seed')) || DEFAULTS.seed;

  // Every lane must be from one family, or "the same input" is meaningless.
  const category = (getEntryBySlug(slugs[0])?.category ?? 'sorting') as AlgorithmCategory;
  const validSlugs = useMemo(
    () => slugs.filter((slug) => getEntryBySlug(slug)?.category === category),
    [slugs, category],
  );

  const { containerRefs, snapshot, actions } = useRace({
    category,
    algorithmIds: validSlugs,
    seed,
    size,
  });

  const setParam = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) next.set(key, value);
      router.replace(`/compare?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  const playing = snapshot.status === 'playing';
  const options = entriesOf(category);
  const longest = Math.max(1, ...snapshot.lanes.map((l) => l.total));

  return (
    <div className="flex flex-col gap-4 px-3 py-4 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-content-primary">
          Algorithm Race
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-content-muted">
          The same input, the same steps-per-second, side by side. A lane that needs four times as
          many steps takes four times as long — which is exactly what the complexity notation is
          trying to tell you.
        </p>
      </header>

      <div className="panel flex flex-wrap items-end gap-3 p-3">
        <Field label="Family">
          <select
            value={category}
            onChange={(e) => {
              const next = entriesOf(e.target.value as AlgorithmCategory);
              setParam({ a: next[0]?.slug ?? '', b: next[1]?.slug ?? next[0]?.slug ?? '' });
            }}
            className="h-9 rounded-lg border border-line bg-surface-800 px-2 text-sm text-content-primary"
          >
            {ACTIVE_CATEGORIES.map((info) => (
              <option key={info.category} value={info.category}>
                {info.label}
              </option>
            ))}
          </select>
        </Field>

        {['a', 'b'].map((key, index) => (
          <Field key={key} label={index === 0 ? 'Lane A' : 'Lane B'}>
            <select
              value={validSlugs[index] ?? ''}
              onChange={(e) => setParam({ [key]: e.target.value })}
              className="h-9 rounded-lg border border-line bg-surface-800 px-2 text-sm text-content-primary"
            >
              {options.map((entry) => (
                <option key={entry.slug} value={entry.slug}>
                  {entry.name}
                </option>
              ))}
            </select>
          </Field>
        ))}

        <Field label={`Size ${size}`}>
          <input
            type="range"
            min={8}
            max={80}
            value={size}
            onChange={(e) => setParam({ n: e.target.value })}
            className="algoviz-range w-32"
          />
        </Field>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // A new seed re-deals the shared instance for every lane at once.
            const next = Math.floor(Math.random() * 100000);
            setParam({ seed: String(next) });
            actions.regenerate(next);
          }}
        >
          <ShuffleIcon width={14} height={14} />
          New dataset
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {containerRefs.slice(0, validSlugs.length).map((ref, index) => {
          const lane = snapshot.lanes[index];
          return (
            <section key={index} className="panel overflow-hidden">
              <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: lane?.accent ?? '#22d3ee' }}
                  />
                  <span className="truncate text-sm font-medium text-content-primary">
                    {lane?.name ?? validSlugs[index]}
                  </span>
                </span>
                {lane?.place ? (
                  <Badge tone={lane.place === 1 ? 'success' : 'neutral'}>
                    {lane.place === 1 ? '🏆 1st' : `${ordinal(lane.place)}`}
                  </Badge>
                ) : null}
              </header>

              <div
                ref={ref}
                className="h-[clamp(200px,32dvh,320px)] w-full"
                role="img"
                aria-label={`${lane?.name ?? 'Algorithm'} visualization`}
              />

              <footer className="flex flex-col gap-1.5 border-t border-line px-3 py-2">
                {/* Bars are scaled to the *longest* lane, so their relative
                    lengths are the comparison. */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-700">
                  <div
                    className="h-full rounded-full transition-[width] duration-100"
                    style={{
                      width: `${((lane?.cursor ?? -1) + 1) / longest * 100}%`,
                      background: lane?.accent ?? '#22d3ee',
                    }}
                  />
                </div>
                <div className="flex flex-wrap justify-between gap-x-3 font-mono text-[11px] text-content-muted">
                  <span className="tabular-nums">
                    {((lane?.cursor ?? -1) + 1).toLocaleString()} / {(lane?.total ?? 0).toLocaleString()} steps
                  </span>
                  {Object.entries(lane?.metrics ?? {})
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <span key={key} className="tabular-nums">
                        {key} {value.toLocaleString()}
                      </span>
                    ))}
                </div>
              </footer>
            </section>
          );
        })}
      </div>

      <div className="panel sticky bottom-0 flex flex-wrap items-center gap-3 p-3 safe-b">
        <div role="group" aria-label="Race playback" className="flex items-center gap-2">
          <IconButton label="Restart" variant="outline" size="sm" onClick={actions.reset}>
            <RestartIcon />
          </IconButton>
          <IconButton label="Step back" variant="outline" size="sm" onClick={actions.stepBackward}>
            <StepBackIcon />
          </IconButton>
          <button
            type="button"
            onClick={actions.toggle}
            aria-label={playing ? 'Pause the race' : 'Start the race'}
            aria-pressed={playing}
            className="glow-accent flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-contrast"
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <IconButton
            label="Step forward"
            variant="outline"
            size="sm"
            onClick={actions.stepForward}
          >
            <StepForwardIcon />
          </IconButton>
        </div>

        <label className="flex min-w-[10rem] flex-1 items-center gap-2 text-xs text-content-muted">
          Speed
          <input
            type="range"
            min={1}
            max={300}
            value={snapshot.speed}
            onChange={(e) => actions.setSpeed(Number(e.target.value))}
            className="algoviz-range"
            aria-label="Playback speed, shared by every lane"
          />
          <span className="w-16 shrink-0 text-right font-mono tabular-nums">
            {snapshot.speed}/s
          </span>
        </label>

        {snapshot.finishOrder.length > 0 ? (
          <p className="text-xs text-content-secondary">
            Finished:{' '}
            {snapshot.finishOrder
              .map((id) => snapshot.lanes.find((l) => l.laneId === id)?.name)
              .filter(Boolean)
              .join(' → ')}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={cn('flex flex-col gap-1 text-[11px] text-content-muted')}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function ordinal(place: number): string {
  const suffix = ['th', 'st', 'nd', 'rd'][place % 100 > 10 && place % 100 < 14 ? 0 : place % 10] ?? 'th';
  return `${place}${suffix}`;
}
