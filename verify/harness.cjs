/**
 * Minimal assertion harness for the algorithm-correctness suite.
 *
 * The project ships no test framework, and the layer that most needs checking —
 * the pure algorithms — is exactly the layer that needs no framework: it has no
 * DOM, no async, no mocking. A hundred lines of plain Node buys the coverage
 * that matters without adding a dependency to a bundle whose whole selling
 * point is being small next to Three.js.
 */

const results = [];
let currentSuite = '(root)';

function suite(name) {
  currentSuite = name;
  console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 58 - name.length))}`);
}

function check(name, actual, expected) {
  const pass = Object.is(actual, expected) || JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ suite: currentSuite, name, pass });
  const status = pass ? '[32mPASS[0m' : '[31mFAIL[0m';
  console.log(`  ${status}  ${name}`);
  if (!pass) console.log(`        got ${format(actual)}, want ${format(expected)}`);
  return pass;
}

function checkTrue(name, actual) {
  return check(name, Boolean(actual), true);
}

function format(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text !== undefined && text.length > 160 ? `${text.slice(0, 160)}…` : String(text);
}

/**
 * Small, fast seeded PRNG. Generators take `random` as a parameter precisely so
 * the suite can pin instances — an algorithm that only fails on one in fifty
 * random inputs is useless to debug otherwise.
 */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Drive a timeline through a model and hand back the final state.
 *
 * Also asserts the two invariants the whole playback layer rests on:
 * `run()` is deterministic, and rewind-then-replay reproduces the exact same
 * state. Backward scrubbing is implemented as replay-from-start, so if either
 * of these breaks, every scrubber in the app silently lies.
 */
function replay(algorithm, input, model, label) {
  const first = algorithm.run(input);
  const second = algorithm.run(input);
  check(`${label}: run() is deterministic`, JSON.stringify(first), JSON.stringify(second));

  model.reset(input);
  for (const step of first) model.apply(step);
  const after = JSON.stringify(model.metrics);

  model.rewind();
  for (const step of first) model.apply(step);
  check(`${label}: rewind + replay is identical`, JSON.stringify(model.metrics), after);

  return { steps: first, model };
}

function report() {
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) {
    console.log('\nFailures:');
    for (const f of failed) console.log(`  ${f.suite} › ${f.name}`);
  }
  process.exit(failed.length ? 1 : 0);
}

module.exports = { suite, check, checkTrue, seeded, replay, report };
