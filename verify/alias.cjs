const path = require('node:path');
const Module = require('node:module');

/**
 * Resolve the app's `@/*` path alias inside the compiled verification build.
 *
 * `tsc` type-checks path aliases but does not rewrite them at emit — that is
 * normally the bundler's job, and there is no bundler here. Rather than
 * rewriting every source import to a relative path (which would make the app
 * code worse to serve the test harness), this teaches Node's CommonJS resolver
 * the one mapping it is missing.
 */
const BUILD_ROOT = path.resolve(__dirname, '..', '.verify-build');
const original = Module._resolveFilename;

Module._resolveFilename = function resolveWithAlias(request, ...rest) {
  if (request.startsWith('@/')) {
    return original.call(this, path.join(BUILD_ROOT, request.slice(2)), ...rest);
  }
  return original.call(this, request, ...rest);
};
