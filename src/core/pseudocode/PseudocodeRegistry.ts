/**
 * Pseudocode listings, keyed by algorithm id.
 *
 * Deliberately *not* a field on `AlgorithmMeta`. Meta is a small serialisable
 * payload that gets listed, routed on and sent to Server Components; bolting a
 * 20-line code listing onto every entry would bloat every list render for the
 * benefit of the one algorithm actually on screen. Keeping it in a side registry
 * also means adding pseudocode to an algorithm is a single new file that cannot
 * break registration.
 */

export interface Pseudocode {
  /** One entry per displayed line, 0-indexed. Indentation is literal. */
  readonly lines: readonly string[];
  /** Hint for the syntax tinting in the pseudocode pane. */
  readonly dialect?: 'pseudo' | 'ts';
}

export class PseudocodeRegistry {
  private readonly entries = new Map<string, Pseudocode>();

  register(algorithmId: string, code: Pseudocode): this {
    this.entries.set(algorithmId, code);
    return this;
  }

  registerAll(records: Readonly<Record<string, Pseudocode>>): this {
    for (const [id, code] of Object.entries(records)) this.register(id, code);
    return this;
  }

  get(algorithmId: string): Pseudocode | undefined {
    return this.entries.get(algorithmId);
  }

  /** The pane is hidden entirely for algorithms that haven't been annotated. */
  has(algorithmId: string): boolean {
    return this.entries.has(algorithmId);
  }

  get size(): number {
    return this.entries.size;
  }
}

export const pseudocodeRegistry = new PseudocodeRegistry();
