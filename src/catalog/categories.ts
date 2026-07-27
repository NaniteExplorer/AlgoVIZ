import { AlgorithmCategory } from '@/core/algorithms/types';
import type { CatalogCategory } from './types';

/**
 * Families in canonical display order.
 *
 * The nav filters this down to families that actually have registered
 * algorithms, so a family lights up the moment its barrel is imported — no
 * second place to remember to update.
 */
export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    category: AlgorithmCategory.Sorting,
    label: 'Sorting',
    title: 'Sorting Algorithms',
    blurb:
      'Watch comparison and distribution sorts order a field of glowing 3D bars, step by step.',
  },
  {
    category: AlgorithmCategory.Searching,
    label: 'Searching',
    title: 'Searching Algorithms',
    blurb: 'Hunt for a target value across a sorted field, with live search windows and probes.',
  },
  {
    category: AlgorithmCategory.Graph,
    label: 'Graphs',
    title: 'Graph Algorithms',
    blurb:
      'Traverse, connect and find shortest paths over a 3D node-link network as frontiers expand.',
  },
  {
    category: AlgorithmCategory.Tree,
    label: 'Trees',
    title: 'Tree Algorithms',
    blurb: 'Build, search and traverse a binary search tree laid out in space.',
  },
  {
    category: AlgorithmCategory.Structures,
    label: 'Data Structures',
    title: 'Data Structures',
    blurb:
      'See lists, heaps, hash tables, tries and balanced trees reshape themselves under each operation.',
  },
];

export function catalogCategory(category: AlgorithmCategory): CatalogCategory {
  const info = CATALOG_CATEGORIES.find((c) => c.category === category);
  if (!info) throw new Error(`No presentation metadata for category "${category}".`);
  return info;
}
