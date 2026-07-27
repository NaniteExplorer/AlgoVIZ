import { lessonRegistry } from '@/core/learning/LessonRegistry';

/**
 * Lesson loader registration.
 *
 * Each entry is a dynamic import, so a lesson's prose is fetched only when a
 * learner actually opens it. Adding a lesson means writing the content file and
 * adding one line here.
 */
lessonRegistry
  .registerLoader('bubble-sort', () => import('./bubble-sort'))
  .registerLoader('binary-search', () => import('./binary-search'))
  .registerLoader('knapsack-01', () => import('./knapsack-01'))
  .registerLoader('dijkstra', () => import('./dijkstra'));

export { lessonRegistry };
