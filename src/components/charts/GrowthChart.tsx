import { fitCurve, type GrowthCurve, type Sample } from '@/core/analysis/ComplexityModel';
import { cn } from '@/lib/cn';

interface Props {
  /** Measured work at each problem size. */
  samples: readonly Sample[];
  /** The curve the algorithm's card claims. Overlaid as a dashed line. */
  declared?: GrowthCurve;
  /** The curve that actually fits best, when it differs from `declared`. */
  fitted?: GrowthCurve;
  color: string;
  className?: string;
}

/**
 * Measured work against problem size, with theoretical curves overlaid.
 *
 * This is the chart that closes the loop between the complexity written on an
 * algorithm's card and the work it demonstrably does. Only the *scale* of each
 * theoretical curve is fitted, never its shape — otherwise any curve could be
 * bent to agree with the data and the comparison would prove nothing.
 */
export function GrowthChart({ samples, declared, fitted, color, className }: Props) {
  const width = 220;
  const height = 110;
  const padding = { left: 34, right: 8, top: 10, bottom: 20 };

  if (samples.length < 3) {
    return (
      <div
        className={cn(
          'flex h-32 items-center justify-center rounded-xl border border-dashed border-line text-xs text-content-muted',
          className,
        )}
      >
        Run the sweep to measure how this scales.
      </div>
    );
  }

  const nMax = Math.max(...samples.map((s) => s.n));
  const nMin = Math.min(...samples.map((s) => s.n));
  const yMax = Math.max(...samples.map((s) => s.value)) * 1.08;

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const toX = (n: number) => padding.left + ((n - nMin) / Math.max(1, nMax - nMin)) * plotW;
  const toY = (v: number) => padding.top + plotH - (v / Math.max(1, yMax)) * plotH;

  const measured = samples
    .map((s, i) => `${i === 0 ? 'M' : 'L'}${toX(s.n)} ${toY(s.value)}`)
    .join(' ');

  /** Sample a theoretical curve densely so it renders smooth, not polygonal. */
  const curvePath = (curve: GrowthCurve): string => {
    const { scale } = fitCurve(curve, samples);
    const steps = 48;
    let path = '';
    for (let i = 0; i <= steps; i += 1) {
      const n = nMin + ((nMax - nMin) * i) / steps;
      const y = Math.min(scale * curve.f(n), yMax);
      path += `${i === 0 ? 'M' : 'L'}${toX(n)} ${toY(y)}`;
    }
    return path;
  };

  return (
    <figure className={cn('flex flex-col gap-2', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`Measured steps against problem size, from n=${nMin} to n=${nMax}`}
      >
        {/* Axes */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="rgb(var(--c-line-strong))"
          strokeWidth={0.7}
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="rgb(var(--c-line-strong))"
          strokeWidth={0.7}
        />

        <text x={2} y={padding.top + 4} className="fill-current text-content-muted" fontSize={6}>
          {formatCompact(yMax)}
        </text>
        <text
          x={2}
          y={height - padding.bottom}
          className="fill-current text-content-muted"
          fontSize={6}
        >
          0
        </text>
        <text
          x={padding.left}
          y={height - 6}
          className="fill-current text-content-muted"
          fontSize={6}
        >
          n={nMin}
        </text>
        <text
          x={width - padding.right}
          y={height - 6}
          textAnchor="end"
          className="fill-current text-content-muted"
          fontSize={6}
        >
          n={nMax}
        </text>

        {declared ? (
          <path
            d={curvePath(declared)}
            fill="none"
            stroke="rgb(var(--c-content-muted))"
            strokeWidth={1}
            strokeDasharray="3 2"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {fitted && fitted.kind !== declared?.kind ? (
          <path
            d={curvePath(fitted)}
            fill="none"
            stroke="rgb(var(--c-accent-violet))"
            strokeWidth={1}
            strokeDasharray="1 2"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}

        <path
          d={measured}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
        {samples.map((s) => (
          <circle key={s.n} cx={toX(s.n)} cy={toY(s.value)} r={1.6} fill={color} />
        ))}
      </svg>

      <figcaption className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-content-muted">
        <Key color={color} label="measured steps" />
        {declared ? <Key color="rgb(var(--c-content-muted))" label={`declared ${declared.label}`} dashed /> : null}
        {fitted && fitted.kind !== declared?.kind ? (
          <Key color="rgb(var(--c-accent-violet))" label={`best fit ${fitted.label}`} dashed />
        ) : null}
      </figcaption>
    </figure>
  );
}

function Key({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden
        className="h-0 w-4 border-t-2"
        style={{ borderColor: color, borderStyle: dashed ? 'dashed' : 'solid' }}
      />
      {label}
    </span>
  );
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(Math.round(value));
}
