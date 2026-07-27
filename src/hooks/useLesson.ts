'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MetricSeries } from '@/core/analysis/MetricSeries';
import { lessonRegistry } from '@/content/lessons';
import { resolveAnchor, type Checkpoint, type Lesson, type LessonSection } from '@/core/learning/types';
import type { PlaybackSnapshot } from '@/core/playback/PlaybackController';

export interface AnsweredCheckpoint {
  correct: boolean;
  value: number;
  /** The right answer, resolved at runtime for metric predictions. */
  truth: number;
}

export interface LessonState {
  lesson?: Lesson;
  loading: boolean;
  activeSection?: LessonSection;
  /** A checkpoint the learner has reached but not yet answered. */
  pending?: Checkpoint;
  answers: Record<string, AnsweredCheckpoint>;
  score: { correct: number; total: number };
  /** Pseudocode lines the active section wants spotlighted. */
  highlightLines: number[];
  answer(checkpointId: string, value: number): void;
  skip(checkpointId: string): void;
}

/**
 * Drives a lesson against live playback.
 *
 * Anchors are resolved against the *actual* timeline length each time it
 * changes, so a lesson written as "40% of the way through" lands correctly no
 * matter what dataset was generated.
 *
 * A `predict-metric` checkpoint's true answer is read from the metric series
 * rather than stored in content — asking a learner to predict a number and
 * grading them against a hard-coded one would be wrong the moment the dataset
 * is re-rolled.
 */
export function useLesson(
  algorithmId: string,
  snapshot: PlaybackSnapshot,
  series: MetricSeries,
  onPause: () => void,
): LessonState {
  const [lesson, setLesson] = useState<Lesson | undefined>();
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, AnsweredCheckpoint>>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  // Load (or clear) the lesson when the algorithm changes.
  useEffect(() => {
    setAnswers({});
    setSkipped(new Set());

    const pending = lessonRegistry.load(algorithmId);
    if (!pending) {
      setLesson(undefined);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    pending.then((loaded) => {
      if (cancelled) return;
      setLesson(loaded);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [algorithmId]);

  const { total, cursor } = snapshot;

  const activeSection = useMemo(() => {
    if (!lesson) return undefined;
    // The active section is the last one whose anchor the cursor has passed.
    let current: LessonSection | undefined = lesson.sections[0];
    for (const section of lesson.sections) {
      if (!section.anchor) continue;
      if (cursor >= resolveAnchor(section.anchor, total)) current = section;
    }
    return current;
  }, [lesson, cursor, total]);

  const pending = useMemo(() => {
    if (!lesson) return undefined;
    return lesson.checkpoints.find(
      (checkpoint) =>
        !answers[checkpoint.id] &&
        !skipped.has(checkpoint.id) &&
        cursor >= resolveAnchor(checkpoint.anchor, total),
    );
  }, [lesson, answers, skipped, cursor, total]);

  // Reaching an unanswered checkpoint stops playback, so the question is not
  // scrolled past before it can be read.
  useEffect(() => {
    if (pending && snapshot.status === 'playing') onPause();
  }, [pending, snapshot.status, onPause]);

  /** Resolve a checkpoint's correct answer, reading metrics where needed. */
  const truthFor = useCallback(
    (checkpoint: Checkpoint): number => {
      if (checkpoint.kind === 'choice') return checkpoint.answer ?? 0;
      const column = checkpoint.metricKey ? series.column(checkpoint.metricKey) : undefined;
      const at = Math.max(0, Math.min(series.filledUpTo, resolveAnchor(checkpoint.anchor, total)));
      return column ? column[at] : 0;
    },
    [series, total],
  );

  const answer = useCallback(
    (checkpointId: string, value: number) => {
      const checkpoint = lesson?.checkpoints.find((c) => c.id === checkpointId);
      if (!checkpoint) return;

      const truth = truthFor(checkpoint);
      const correct =
        checkpoint.kind === 'choice'
          ? value === truth
          : // Numeric predictions are graded within a tolerance; demanding an
            // exact count would make the question a memory test, not a
            // comprehension one.
            Math.abs(value - truth) <= Math.max(1, truth * (checkpoint.tolerance ?? 0.2));

      setAnswers((prev) => ({ ...prev, [checkpointId]: { correct, value, truth } }));
    },
    [lesson, truthFor],
  );

  const skip = useCallback((checkpointId: string) => {
    setSkipped((prev) => new Set(prev).add(checkpointId));
  }, []);

  const score = useMemo(() => {
    const entries = Object.values(answers);
    return {
      correct: entries.filter((a) => a.correct).length,
      total: lesson?.checkpoints.length ?? 0,
    };
  }, [answers, lesson]);

  return {
    lesson,
    loading,
    activeSection,
    pending,
    answers,
    score,
    highlightLines: activeSection?.highlightLines ?? [],
    answer,
    skip,
  };
}
