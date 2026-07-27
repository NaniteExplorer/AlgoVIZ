/**
 * Correctness suite for AlgoVIZ's pure algorithm layer.
 *
 * Run with `npm run verify`, which compiles `src/core/{algorithms,model,playback}`
 * to CommonJS first (see `verify/tsconfig.json`) and then executes this file.
 *
 * Scope is deliberate: the renderers are judged by eye, but an algorithm that
 * produces a subtly wrong timeline looks completely convincing on screen. These
 * are the checks a human reviewer cannot perform by watching.
 */
// Must come first: teaches Node how to resolve the app's `@/*` imports.
require('./alias.cjs');

const { report } = require('./harness.cjs');

require('./dp.cjs')();
require('./backtracking.cjs')();
require('./graph.cjs')();
require('./structures.cjs')();
require('./analysis.cjs')();
require('./existing.cjs')();

report();
