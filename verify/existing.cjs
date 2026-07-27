const { suite, check, checkTrue, seeded } = require('./harness.cjs');

const B = '../.verify-build';
const { algorithmRegistry } = require(`${B}/core/algorithms/index`);
const { AlgorithmCategory } = require(`${B}/core/algorithms/types`);
const { ArrayModel } = require(`${B}/core/model/ArrayModel`);
const { SearchModel } = require(`${B}/core/model/SearchModel`);

/**
 * Cross-cutting checks over the pre-existing families.
 *
 * These are property-based rather than example-based: "every sort actually
 * sorts", "every search finds a present target". That scales to the ~60
 * algorithms this platform is heading for, where hand-writing expectations per
 * algorithm would not.
 */
module.exports = function runExistingChecks() {
  suite('Registry');

  const ids = algorithmRegistry.listMeta().map((m) => m.id);
  check('no duplicate algorithm ids', new Set(ids).size, ids.length);
  checkTrue('registry is populated', ids.length >= 30);
  checkTrue(
    'every algorithm has a non-empty description',
    algorithmRegistry.listMeta().every((m) => m.description.length > 40),
  );
  checkTrue(
    'every id is URL-safe',
    ids.every((id) => /^[a-z0-9-]+$/.test(id)),
  );

  suite('Sorting — every sort actually sorts');
  {
    const random = seeded(97);
    const sorts = algorithmRegistry.listByCategory(AlgorithmCategory.Sorting);
    checkTrue('sorting family is registered', sorts.length >= 13);

    let wrong = 0;
    let nonDeterministic = 0;
    let scrubMismatch = 0;

    for (const algo of sorts) {
      // A mix of sizes catches off-by-one bugs at the boundaries that a single
      // fixed size would sail straight past.
      for (const size of [1, 2, 5, 17, 40]) {
        const input = Array.from({ length: size }, () => Math.floor(random() * 100) + 1);
        const expected = [...input].sort((a, b) => a - b);

        const steps = algo.run(input);
        if (JSON.stringify(algo.run(input)) !== JSON.stringify(steps)) nonDeterministic += 1;

        const model = new ArrayModel();
        model.reset(input);
        for (const step of steps) model.apply(step);
        const actual = Array.from({ length: size }, (_, i) => model.value(i));
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          wrong += 1;
          console.log(`        ${algo.meta.id} n=${size}: ${actual} ≠ ${expected}`);
        }

        // `run` must not mutate the caller's array — the race view hands the
        // same instance to several algorithms.
        model.rewind();
        for (const step of steps) model.apply(step);
        const replayed = Array.from({ length: size }, (_, i) => model.value(i));
        if (JSON.stringify(replayed) !== JSON.stringify(actual)) scrubMismatch += 1;
      }
    }

    check('all sorts produce sorted output', wrong, 0);
    check('all sorts are deterministic', nonDeterministic, 0);
    check('all sorts survive rewind + replay', scrubMismatch, 0);
  }

  suite('Searching — every search finds what is there');
  {
    const random = seeded(53);
    const searches = algorithmRegistry.listByCategory(AlgorithmCategory.Searching);
    checkTrue('searching family is registered', searches.length >= 6);

    let missed = 0;
    let falsePositive = 0;

    for (const algo of searches) {
      for (let trial = 0; trial < 6; trial += 1) {
        const size = 8 + Math.floor(random() * 30);
        const values = [];
        let v = 2;
        for (let i = 0; i < size; i += 1) {
          values.push(v);
          v += 2 + Math.floor(random() * 10);
        }

        // Present target: must be located.
        const index = Math.floor(random() * size);
        const present = algo.run({ values, target: values[index] });
        const model = new SearchModel();
        model.reset({ values, target: values[index] });
        for (const step of present) model.apply(step);
        if (!present.some((s) => s.kind === 'found')) {
          missed += 1;
          console.log(`        ${algo.meta.id}: missed present target ${values[index]}`);
        }

        // Absent target sitting in a gap: must not be "found".
        const absent = algo.run({ values, target: values[index] + 1 });
        if (absent.some((s) => s.kind === 'found')) {
          falsePositive += 1;
          console.log(`        ${algo.meta.id}: reported an absent target as found`);
        }
      }
    }

    check('all searches find a present target', missed, 0);
    check('no search reports a false positive', falsePositive, 0);
  }

  suite('Pseudocode registry');
  {
    const { pseudocodeRegistry } = require(`${B}/core/pseudocode/index`);
    const annotated = ids.filter((id) => pseudocodeRegistry.has(id));
    checkTrue('some algorithms have pseudocode', annotated.length > 0);

    // A line reference pointing past the end of the listing would highlight
    // nothing and look like the pane is broken.
    let outOfRange = 0;
    for (const algo of algorithmRegistry.list()) {
      const code = pseudocodeRegistry.get(algo.meta.id);
      if (!code) continue;
      const input = sampleInputFor(algo.meta.category);
      if (!input) continue;
      for (const step of algo.run(input)) {
        if (step.line !== undefined && (step.line < 0 || step.line >= code.lines.length)) {
          outOfRange += 1;
          console.log(`        ${algo.meta.id}: line ${step.line} is outside its listing`);
          break;
        }
      }
    }
    check('no pseudocode line reference is out of range', outOfRange, 0);
  }
};

/** A minimal valid instance per category, for smoke-running any algorithm. */
function sampleInputFor(category) {
  switch (category) {
    case AlgorithmCategory.Sorting:
      return [5, 3, 8, 1, 9, 2, 7];
    case AlgorithmCategory.Searching:
      return { values: [2, 5, 9, 14, 20, 27, 33], target: 14 };
    default:
      // Graph/tree/DP instances need a generator; those families are covered by
      // their own suites.
      return null;
  }
}
