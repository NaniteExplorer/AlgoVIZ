import type { Pseudocode } from '../PseudocodeRegistry';

/**
 * Pseudocode listings for the sorting family.
 *
 * Line indices here are load-bearing: each algorithm's `tracer.at(n)` calls
 * point at these arrays, so reordering a line without updating the algorithm
 * will silently highlight the wrong row. Keep the two in view when editing.
 */
export const SORTING_PSEUDOCODE: Record<string, Pseudocode> = {
  'bubble-sort': {
    lines: [
      /* 0 */ 'procedure bubbleSort(A)',
      /* 1 */ '  n ← length(A)',
      /* 2 */ '  for i ← 0 to n - 2 do',
      /* 3 */ '    swapped ← false',
      /* 4 */ '    for j ← 0 to n - i - 2 do',
      /* 5 */ '      if A[j] > A[j + 1] then',
      /* 6 */ '        swap A[j], A[j + 1]',
      /* 7 */ '        swapped ← true',
      /* 8 */ '    A[n - i - 1] is now in final position',
      /* 9 */ '    if not swapped then break',
    ],
  },

  'insertion-sort': {
    lines: [
      /* 0 */ 'procedure insertionSort(A)',
      /* 1 */ '  for i ← 1 to length(A) - 1 do',
      /* 2 */ '    key ← A[i]',
      /* 3 */ '    j ← i - 1',
      /* 4 */ '    while j ≥ 0 and A[j] > key do',
      /* 5 */ '      A[j + 1] ← A[j]',
      /* 6 */ '      j ← j - 1',
      /* 7 */ '    A[j + 1] ← key',
    ],
  },

  'selection-sort': {
    lines: [
      /* 0 */ 'procedure selectionSort(A)',
      /* 1 */ '  for i ← 0 to length(A) - 2 do',
      /* 2 */ '    min ← i',
      /* 3 */ '    for j ← i + 1 to length(A) - 1 do',
      /* 4 */ '      if A[j] < A[min] then',
      /* 5 */ '        min ← j',
      /* 6 */ '    swap A[i], A[min]',
      /* 7 */ '    A[i] is now in final position',
    ],
  },

  'merge-sort': {
    lines: [
      /* 0 */ 'procedure mergeSort(A, lo, hi)',
      /* 1 */ '  if lo ≥ hi then return',
      /* 2 */ '  mid ← (lo + hi) / 2',
      /* 3 */ '  mergeSort(A, lo, mid)',
      /* 4 */ '  mergeSort(A, mid + 1, hi)',
      /* 5 */ '  merge(A, lo, mid, hi)',
      /* 6 */ '',
      /* 7 */ 'procedure merge(A, lo, mid, hi)',
      /* 8 */ '  L ← A[lo..mid],  R ← A[mid+1..hi]',
      /* 9 */ '  i ← 0,  j ← 0,  k ← lo',
      /* 10 */ '  while i < |L| and j < |R| do',
      /* 11 */ '    if L[i] ≤ R[j] then A[k++] ← L[i++]',
      /* 12 */ '    else                A[k++] ← R[j++]',
      /* 13 */ '  copy any remainder of L, then of R',
    ],
  },

  'quick-sort': {
    lines: [
      /* 0 */ 'procedure quickSort(A, lo, hi)',
      /* 1 */ '  if lo ≥ hi then return',
      /* 2 */ '  p ← partition(A, lo, hi)',
      /* 3 */ '  A[p] is now in final position',
      /* 4 */ '  quickSort(A, lo, p - 1)',
      /* 5 */ '  quickSort(A, p + 1, hi)',
      /* 6 */ '',
      /* 7 */ 'procedure partition(A, lo, hi)   // Lomuto',
      /* 8 */ '  pivot ← A[hi]',
      /* 9 */ '  i ← lo - 1',
      /* 10 */ '  for j ← lo to hi - 1 do',
      /* 11 */ '    if A[j] < pivot then',
      /* 12 */ '      i ← i + 1;  swap A[i], A[j]',
      /* 13 */ '  swap A[i + 1], A[hi]',
      /* 14 */ '  return i + 1',
    ],
  },

  'heap-sort': {
    lines: [
      /* 0 */ 'procedure heapSort(A)',
      /* 1 */ '  buildMaxHeap(A)',
      /* 2 */ '  for end ← length(A) - 1 down to 1 do',
      /* 3 */ '    swap A[0], A[end]        // largest to its place',
      /* 4 */ '    A[end] is now in final position',
      /* 5 */ '    siftDown(A, 0, end)',
      /* 6 */ '',
      /* 7 */ 'procedure siftDown(A, root, end)',
      /* 8 */ '  while 2·root + 1 < end do',
      /* 9 */ '    child ← larger of the two children',
      /* 10 */ '    if A[root] ≥ A[child] then return',
      /* 11 */ '    swap A[root], A[child]',
      /* 12 */ '    root ← child',
    ],
  },
};
