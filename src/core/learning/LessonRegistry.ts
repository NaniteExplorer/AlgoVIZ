import type { Lesson } from './types';

/**
 * Lazily code-split lesson store.
 *
 * Lesson prose is bulky and at most one lesson is ever on screen, so content
 * sits behind dynamic imports keyed by algorithm id. The studio bundle
 * therefore never carries text it will not show — which matters when the
 * catalog is heading for sixty algorithms.
 */
export class LessonRegistry {
  private readonly loaders = new Map<string, () => Promise<{ lesson: Lesson }>>();
  private readonly cache = new Map<string, Promise<Lesson>>();

  registerLoader(algorithmId: string, load: () => Promise<{ lesson: Lesson }>): this {
    this.loaders.set(algorithmId, load);
    return this;
  }

  has(algorithmId: string): boolean {
    return this.loaders.has(algorithmId);
  }

  /** Algorithm ids that have a lesson, for the /learn index. */
  ids(): string[] {
    return [...this.loaders.keys()];
  }

  /** Load and memoise. Concurrent callers share one import. */
  load(algorithmId: string): Promise<Lesson> | undefined {
    const loader = this.loaders.get(algorithmId);
    if (!loader) return undefined;

    let pending = this.cache.get(algorithmId);
    if (!pending) {
      pending = loader().then((module) => module.lesson);
      this.cache.set(algorithmId, pending);
    }
    return pending;
  }
}

export const lessonRegistry = new LessonRegistry();
