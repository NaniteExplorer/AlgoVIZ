import type { MetadataRoute } from 'next';
import { ACTIVE_CATEGORIES, CATALOG, algorithmHref } from '@/catalog';
import { SITE_URL } from '@/lib/site';

/**
 * Sitemap, derived from the catalog.
 *
 * Generated rather than hand-listed so a new algorithm becomes crawlable the
 * moment it is registered — there is no second list to forget.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/algorithms', '/compare', '/learn'].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1 : 0.8,
  }));

  const categoryRoutes = ACTIVE_CATEGORIES.map((info) => ({
    url: `${SITE_URL}/algorithms/${info.category}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const algorithmRoutes = CATALOG.map((entry) => ({
    url: `${SITE_URL}${algorithmHref(entry)}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...algorithmRoutes];
}
