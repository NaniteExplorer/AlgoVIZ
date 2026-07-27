import type { Pseudocode } from '../PseudocodeRegistry';

/** Pseudocode listings for the searching family. */
export const SEARCHING_PSEUDOCODE: Record<string, Pseudocode> = {
  'linear-search': {
    lines: [
      /* 0 */ 'procedure linearSearch(A, target)',
      /* 1 */ '  for i ← 0 to length(A) - 1 do',
      /* 2 */ '    if A[i] = target then',
      /* 3 */ '      return i',
      /* 4 */ '  return NOT_FOUND',
    ],
  },

  'binary-search': {
    lines: [
      /* 0 */ 'procedure binarySearch(A, target)   // A is sorted',
      /* 1 */ '  lo ← 0,  hi ← length(A) - 1',
      /* 2 */ '  while lo ≤ hi do',
      /* 3 */ '    mid ← (lo + hi) / 2',
      /* 4 */ '    if A[mid] = target then return mid',
      /* 5 */ '    if A[mid] < target then',
      /* 6 */ '      lo ← mid + 1        // discard the left half',
      /* 7 */ '    else',
      /* 8 */ '      hi ← mid - 1        // discard the right half',
      /* 9 */ '  return NOT_FOUND',
    ],
  },

  'jump-search': {
    lines: [
      /* 0 */ 'procedure jumpSearch(A, target)     // A is sorted',
      /* 1 */ '  step ← ⌊√length(A)⌋',
      /* 2 */ '  prev ← 0',
      /* 3 */ '  while A[min(step, n) - 1] < target do',
      /* 4 */ '    prev ← step;  step ← step + ⌊√n⌋',
      /* 5 */ '    if prev ≥ n then return NOT_FOUND',
      /* 6 */ '  for i ← prev to min(step, n) - 1 do',
      /* 7 */ '    if A[i] = target then return i',
      /* 8 */ '  return NOT_FOUND',
    ],
  },
};
