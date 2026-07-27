'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AlgorithmCategory, AlgorithmMeta } from '@/core/algorithms';
import { algorithmRegistry } from '@/core/algorithms';
import type { MetricSeries } from '@/core/analysis/MetricSeries';
import { bestFit, curveForLabel, type Fit } from '@/core/analysis/ComplexityModel';
import {
  ComplexitySampler,
  sweepSizes,
  type SweepResult,
} from '@/core/analysis/ComplexitySampler';
import type { PlaybackSnapshot } from '@/core/playback/PlaybackController';
import type { ControlSpec, MetricSpec } from '@/core/visualization/CategoryModule';
import { Button } from '@/components/ui/Button';
import { GrowthChart } from '@/components/charts/GrowthChart';
import { Sparkline } from '@/components/charts/Sparkline';

interface Props {
  category: AlgorithmCategory;
  meta: AlgorithmMeta;
  snapshot: PlaybackSnapshot;
  series: MetricSeries;
  metricSpecs: MetricSpec[];
  controls: ControlSpec[];
  accent: string;
}

/**
 * Two charts that answer questions the animation alone cannot.
 *
 * The sparklines show *this* run's shape — where the comparisons piled up,
 * whether the work was even or bursty. The growth chart answers the bigger
 * question by re-running the algorithm headlessly at a range of sizes and
 * overlaying the complexity its card claims. Seeing a measured curve sit on
 * top of a declared O(n log n) is worth more than reading the notation.
 */
export function InsightsPanel({
  category,
  meta,
  snapshot,
  series,
  metricSpecs,
  controls,
  accent,
}: Props) {
  const [sweep, setSweep] = useState<SweepResult[]>([]);
  const [running, setRunning] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);

  const sizeControl = controls[0];

  // Discard results whenever the algorithm changes — a sweep of merge sort
  // shown under quick sort's heading would be actively misleading.
  useEffect(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    setSweep([]);
    setRunning(false);
  }, [meta.id]);

  useEffect(() => () => cancelRef.current?.(), []);

  const runSweep = useCallback(() => {
    if (!sizeControl) return;
    cancelRef.current?.();
    setRunning(true);

    const algorithm = algorithmRegistry.require(meta.id);
    const sampler = new ComplexitySampler(category, algorithm, sizeControl.key);
    const sizes = sweepSizes(Math.max(sizeControl.min, 4), sizeControl.max);

    cancelRef.current = sampler.run(sizes, setSweep, (results) => {
      setSweep(results);
      setRunning(false);
      cancelRef.current = null;
    });
  }, [category, meta.id, sizeControl]);

  const declared = curveForLabel(meta.complexity.time.average);
  const fit: Fit | undefined = bestFit(sweep);

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h4 className="mb-2 text-xs font-semibold text-content-primary">This run</h4>
        <div className="flex flex-col gap-3">
          {metricSpecs.map((spec) => (
            <Sparkline
              key={spec.key}
              label={spec.label}
              points={series.samples(spec.key)}
              domain={Math.max(1, snapshot.total - 1)}
              cursor={snapshot.cursor}
              color={accent}
            />
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-content-muted">
          Each line is a counter over the whole run; the vertical marker is where playback is now.
          Scrub the timeline and watch where the work actually happens.
        </p>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-content-primary">How it scales</h4>
          <Button size="sm" variant="outline" onClick={runSweep} disabled={running || !sizeControl}>
            {running ? 'Measuring…' : sweep.length ? 'Run again' : 'Measure'}
          </Button>
        </div>

        <GrowthChart
          samples={sweep}
          declared={declared}
          fitted={fit?.curve}
          color={accent}
        />

        {fit && sweep.length >= 3 ? (
          <p className="mt-2 text-[10px] leading-relaxed text-content-muted">
            Measured growth most closely matches{' '}
            <span className="font-mono text-content-secondary">{fit.curve.label}</span> (R²{' '}
            {fit.r2.toFixed(3)}). This algorithm is documented as{' '}
            <span className="font-mono text-content-secondary">
              {meta.complexity.time.average}
            </span>
            {fit.curve.label.replace(/\s/g, '') ===
            meta.complexity.time.average.replace(/\s/g, '')
              ? ' — they agree.'
              : '. Over a narrow range of n, neighbouring curves fit almost equally well, so a mismatch here is not necessarily a contradiction.'}
          </p>
        ) : (
          <p className="mt-2 text-[10px] leading-relaxed text-content-muted">
            Re-runs the algorithm headlessly at a range of problem sizes and plots the step count
            against the complexity on its card.
          </p>
        )}
      </section>
    </div>
  );
}
