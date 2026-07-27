import { cn } from '@/lib/cn';

interface Props {
  /** `[x, y]` pairs, x ascending. */
  points: readonly (readonly [number, number])[];
  /** Upper bound of the y axis. Defaults to the data's own maximum. */
  max?: number;
  /** Upper bound of the x axis, so several charts can share a scale. */
  domain?: number;
  color: string;
  /** Vertical playhead at this x value. */
  cursor?: number;
  className?: string;
  label?: string;
}

/**
 * A single metric plotted over the run, with a playhead at the current step.
 *
 * Hand-rolled SVG rather than a charting library: the app draws exactly two
 * chart shapes, and a dependency for that would be several times the size of
 * the code it replaces — on a page that already carries Three.js.
 *
 * `preserveAspectRatio="none"` lets one viewBox stretch to any container size,
 * so the chart is responsive with no measurement and no resize observer.
 */
export function Sparkline({
  points,
  max,
  domain,
  color,
  cursor,
  className,
  label,
}: Props) {
  const width = 100;
  const height = 32;

  if (points.length < 2) {
    return (
      <div
        className={cn(
          'flex h-10 items-center justify-center rounded-lg border border-dashed border-line text-[10px] text-content-muted',
          className,
        )}
      >
        not enough data yet
      </div>
    );
  }

  const xMax = domain ?? points[points.length - 1][0] ?? 1;
  const yMax = max ?? Math.max(1, ...points.map(([, y]) => y));

  const toX = (x: number) => (x / Math.max(1, xMax)) * width;
  const toY = (y: number) => height - (y / Math.max(1, yMax)) * height;

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${toX(x)} ${toY(y)}`).join(' ');
  // Close the path back along the baseline for the fill.
  const area = `${line} L${toX(points[points.length - 1][0])} ${height} L${toX(points[0][0])} ${height} Z`;

  return (
    <figure className={cn('flex flex-col gap-1', className)}>
      {label ? (
        <figcaption className="flex items-baseline justify-between text-[10px] text-content-muted">
          <span>{label}</span>
          <span className="tabular-nums">{Math.round(yMax).toLocaleString()}</span>
        </figcaption>
      ) : null}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-10 w-full overflow-visible"
        role="img"
        aria-label={
          label
            ? `${label}: rises to ${Math.round(yMax).toLocaleString()} over the run`
            : 'metric over the run'
        }
      >
        <path d={area} fill={color} opacity={0.14} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
        {cursor !== undefined && cursor >= 0 ? (
          <line
            x1={toX(cursor)}
            x2={toX(cursor)}
            y1={0}
            y2={height}
            stroke="rgb(var(--c-content-primary))"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            opacity={0.5}
          />
        ) : null}
      </svg>
    </figure>
  );
}
