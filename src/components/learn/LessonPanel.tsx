'use client';

import { useState } from 'react';
import type { LessonBlock, LessonSection } from '@/core/learning/types';
import type { LessonState } from '@/hooks/useLesson';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

/**
 * Prose that follows the animation.
 *
 * Sections advance with playback rather than being a wall of text beside it, so
 * the explanation on screen is always about the thing currently happening.
 * Checkpoints pause the run and ask a question — which is the difference
 * between watching a visualization and learning from one.
 */
export function LessonPanel({ state }: { state: LessonState }) {
  const { lesson, loading, activeSection, pending, answers, score } = state;

  if (loading) {
    return <p className="p-4 text-xs text-content-muted">Loading the lesson…</p>;
  }

  if (!lesson) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-line p-5 text-center">
        <p className="text-xs text-content-muted">
          No written lesson for this algorithm yet — the description, pseudocode and analysis tabs
          still cover it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-content-primary">{lesson.title}</h3>
          <p className="text-[11px] text-content-muted">
            {lesson.summary} · about {lesson.estimatedMinutes} min
          </p>
        </div>
        {score.total > 0 ? (
          <Badge tone={score.correct === score.total ? 'success' : 'neutral'}>
            {score.correct}/{score.total}
          </Badge>
        ) : null}
      </header>

      {pending ? (
        <CheckpointCard
          key={pending.id}
          checkpoint={pending}
          onAnswer={(value) => state.answer(pending.id, value)}
          onSkip={() => state.skip(pending.id)}
        />
      ) : null}

      {activeSection ? <SectionView section={activeSection} /> : null}

      {/* A short table of contents doubles as a progress indicator. */}
      <ol className="flex flex-col gap-0.5 border-t border-line pt-3">
        {lesson.sections.map((section) => (
          <li
            key={section.id}
            className={cn(
              'flex items-center gap-2 rounded px-2 py-1 text-[11px]',
              section.id === activeSection?.id
                ? 'bg-surface-800 text-content-primary'
                : 'text-content-muted',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'h-1.5 w-1.5 shrink-0 rounded-full',
                section.id === activeSection?.id ? 'bg-accent' : 'bg-surface-600',
              )}
            />
            {section.title}
          </li>
        ))}
      </ol>

      {Object.keys(answers).length > 0 ? (
        <section className="border-t border-line pt-3">
          <h4 className="mb-2 text-xs font-semibold text-content-primary">Your answers</h4>
          <ul className="flex flex-col gap-2">
            {lesson.checkpoints
              .filter((c) => answers[c.id])
              .map((c) => (
                <li key={c.id} className="text-[11px] leading-relaxed">
                  <span
                    className={cn(
                      'font-medium',
                      answers[c.id].correct ? 'text-accent-emerald' : 'text-accent-rose',
                    )}
                  >
                    {answers[c.id].correct ? '✓ ' : '✗ '}
                  </span>
                  <span className="text-content-secondary">{c.question}</span>
                  <p className="mt-0.5 text-content-muted">{c.explanation}</p>
                  {c.kind === 'predict-metric' ? (
                    <p className="mt-0.5 font-mono text-content-muted">
                      you said {answers[c.id].value.toLocaleString()} · actual{' '}
                      {Math.round(answers[c.id].truth).toLocaleString()}
                    </p>
                  ) : null}
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function SectionView({ section }: { section: LessonSection }) {
  return (
    <article className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-accent">
        {section.title}
      </h4>
      {section.blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </article>
  );
}

const CALLOUT_TONES: Record<string, string> = {
  insight: 'border-accent/40 bg-accent/10 text-content-secondary',
  warning: 'border-accent-rose/40 bg-accent-rose/10 text-content-secondary',
  complexity: 'border-accent-violet/40 bg-accent-violet/10 text-content-secondary',
};

function BlockView({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case 'p':
      return <p className="text-xs leading-relaxed text-content-secondary">{block.text}</p>;

    case 'heading':
      return <h5 className="text-xs font-semibold text-content-primary">{block.text}</h5>;

    case 'list':
      return block.ordered ? (
        <ol className="ml-4 list-decimal space-y-1 text-xs leading-relaxed text-content-secondary">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="ml-4 list-disc space-y-1 text-xs leading-relaxed text-content-secondary">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );

    case 'code':
      return (
        <figure>
          <pre className="overflow-x-auto rounded-lg border border-line bg-surface-950/60 p-3 font-mono text-[11px] leading-relaxed text-content-secondary">
            {block.lines.join('\n')}
          </pre>
          {block.caption ? (
            <figcaption className="mt-1 text-[10px] text-content-muted">{block.caption}</figcaption>
          ) : null}
        </figure>
      );

    case 'callout':
      return (
        <aside className={cn('rounded-lg border-l-2 px-3 py-2 text-xs leading-relaxed', CALLOUT_TONES[block.tone])}>
          {block.text}
        </aside>
      );

    case 'formula':
      return (
        <p className="rounded-lg bg-surface-800/60 px-3 py-2 text-center font-mono text-xs text-content-primary">
          {block.text}
        </p>
      );

    default:
      return null;
  }
}

function CheckpointCard({
  checkpoint,
  onAnswer,
  onSkip,
}: {
  checkpoint: NonNullable<LessonState['pending']>;
  onAnswer(value: number): void;
  onSkip(): void;
}) {
  const [guess, setGuess] = useState('');

  return (
    <section
      aria-labelledby={`checkpoint-${checkpoint.id}`}
      className="rounded-xl border border-accent/40 bg-accent/5 p-3"
    >
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
        Checkpoint — playback paused
      </p>
      <h4 id={`checkpoint-${checkpoint.id}`} className="text-xs font-medium text-content-primary">
        {checkpoint.question}
      </h4>

      {checkpoint.kind === 'choice' ? (
        <div role="radiogroup" aria-labelledby={`checkpoint-${checkpoint.id}`} className="mt-2 flex flex-col gap-1.5">
          {(checkpoint.options ?? []).map((option, index) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={false}
              onClick={() => onAnswer(index)}
              className="rounded-lg border border-line bg-surface-900 px-3 py-2 text-left text-xs text-content-secondary transition-colors hover:border-accent hover:text-content-primary"
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <form
          className="mt-2 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const value = Number(guess);
            if (Number.isFinite(value)) onAnswer(value);
          }}
        >
          <input
            type="number"
            inputMode="numeric"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="your estimate"
            aria-label={checkpoint.question}
            className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface-900 px-2 text-xs text-content-primary"
          />
          <Button type="submit" size="sm" variant="primary" disabled={guess === ''}>
            Check
          </Button>
        </form>
      )}

      <button
        type="button"
        onClick={onSkip}
        className="mt-2 text-[10px] text-content-muted underline-offset-2 hover:underline"
      >
        Skip this one
      </button>
    </section>
  );
}
