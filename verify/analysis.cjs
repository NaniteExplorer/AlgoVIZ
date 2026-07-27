const { suite, check, checkTrue } = require('./harness.cjs');

const B = '../.verify-build';
const { MetricSeries } = require(`${B}/core/analysis/MetricSeries`);
const { bestFit, fitCurve, CURVES, curveForLabel } = require(`${B}/core/analysis/ComplexityModel`);

module.exports = function runAnalysisChecks() {
  suite('Analysis');

  // MetricSeries: record-once semantics are what make scrubbing free.
  {
    const series = new MetricSeries(['a'], 10);
    series.record(0, { a: 5 });
    series.record(0, { a: 999 }); // must be ignored
    check('series: a cursor is recorded only once', series.column('a')[0], 5);
    check('series: tracks the highest filled cursor', series.filledUpTo, 0);

    for (let i = 1; i < 10; i += 1) series.record(i, { a: i * 2 });
    check('series: filledUpTo follows the run', series.filledUpTo, 9);
    check('series: max reads the peak', series.max('a'), 18);
    check('series: out-of-range writes are dropped', series.has(99), false);

    const samples = series.samples('a', 4);
    checkTrue('series: down-sampling respects the point cap', samples.length <= 5);
    check('series: down-sampling keeps the final point', samples[samples.length - 1][0], 9);

    series.reset(3, ['b']);
    check('series: reset clears the old columns', series.column('a'), undefined);
    check('series: reset rewinds the cursor', series.filledUpTo, -1);
  }

  // Curve fitting: each curve must win on data generated from itself.
  {
    let wrong = 0;
    for (const curve of CURVES) {
      // Exponential explodes past Number.MAX_SAFE_INTEGER on this range and
      // constant is degenerate, so both are excluded from the round-trip.
      if (curve.kind === 'exponential' || curve.kind === 'constant') continue;
      const samples = [8, 16, 32, 64, 128, 256].map((n) => ({ n, value: 3.5 * curve.f(n) }));
      const fit = bestFit(samples);
      if (fit?.curve.kind !== curve.kind) {
        wrong += 1;
        console.log(`        ${curve.label} data was best fit by ${fit?.curve.label}`);
      }
    }
    check('complexity: every curve is identified from its own data', wrong, 0);
  }

  // The fitted scale must actually recover the constant factor.
  {
    const linear = CURVES.find((c) => c.kind === 'linear');
    const samples = [10, 20, 40, 80].map((n) => ({ n, value: 7 * n }));
    const fit = fitCurve(linear, samples);
    checkTrue('complexity: recovers the constant factor', Math.abs(fit.scale - 7) < 1e-9);
    checkTrue('complexity: a perfect fit scores R² = 1', fit.r2 > 0.9999);
  }

  // Noisy quadratic data must still be recognised as quadratic.
  {
    const samples = [10, 20, 40, 80, 160].map((n, i) => ({
      n,
      value: 2 * n * n + (i % 2 === 0 ? 40 : -40),
    }));
    check('complexity: survives noise', bestFit(samples).curve.kind, 'quadratic');
  }

  // Label lookup has to match the strings actually used on the cards.
  {
    check('complexity: parses "O(n log n)"', curveForLabel('O(n log n)')?.kind, 'linearithmic');
    check('complexity: parses "O(n²)"', curveForLabel('O(n²)')?.kind, 'quadratic');
    check('complexity: ignores unknown notation', curveForLabel('O(V+E)'), undefined);
  }

  // Too few points must refuse to guess rather than fit noise.
  {
    check('complexity: declines to fit two points', bestFit([{ n: 1, value: 1 }, { n: 2, value: 4 }]), undefined);
  }
};
