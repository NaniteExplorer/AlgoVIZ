/**
 * Union–Find with path compression and union by rank.
 *
 * Shared by Kruskal and by the Union-Find demo itself. The `onLink` callback is
 * what makes it visualizable: every time a root is re-parented, the caller gets
 * told, so the disjoint-set forest can be drawn as live edges on top of the
 * graph rather than staying invisible bookkeeping.
 */
export class DisjointSet {
  private readonly parent: number[];
  private readonly rank: number[];
  private _components: number;

  /** Called whenever `child` is re-parented onto `root`. */
  onLink?: (child: number, root: number) => void;
  /** Called for each pointer rewritten during path compression. */
  onCompress?: (node: number, root: number) => void;

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array<number>(size).fill(0);
    this._components = size;
  }

  get components(): number {
    return this._components;
  }

  /** Representative of `x`'s set, compressing the path on the way back. */
  find(x: number): number {
    let root = x;
    while (this.parent[root] !== root) root = this.parent[root];

    // Second pass rewrites every pointer on the path directly to the root —
    // the "compression" half of the near-constant amortised cost.
    let cur = x;
    while (this.parent[cur] !== root) {
      const next = this.parent[cur];
      this.parent[cur] = root;
      this.onCompress?.(cur, root);
      cur = next;
    }
    return root;
  }

  /** Merge two sets. Returns false if they were already the same set. */
  union(a: number, b: number): boolean {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false;

    // Attaching the shorter tree under the taller one keeps depth logarithmic
    // even before compression kicks in.
    if (this.rank[ra] < this.rank[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra;
    if (this.rank[ra] === this.rank[rb]) this.rank[ra] += 1;
    this._components -= 1;
    this.onLink?.(rb, ra);
    return true;
  }

  connected(a: number, b: number): boolean {
    return this.find(a) === this.find(b);
  }
}
