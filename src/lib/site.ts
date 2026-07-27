/**
 * Canonical origin for absolute URLs (sitemap, Open Graph, canonical links).
 *
 * Reads `NEXT_PUBLIC_SITE_URL` so a preview deployment advertises itself rather
 * than the production domain — otherwise every preview build emits a sitemap
 * pointing at production, and canonical tags fight each other.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://algoviz.app'
).replace(/\/$/, '');

export const SITE_NAME = 'AlgoViz';
