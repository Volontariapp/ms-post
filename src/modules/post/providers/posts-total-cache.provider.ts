export type PostsTotalClock = () => number;

interface PostsTotalEntry {
  readonly total: number;
  readonly expiresAt: number;
}

export const POSTS_TOTAL_CACHE_TTL_MS = 10_000;
export const POSTS_TOTAL_CACHE_CAPACITY = 2000;

/**
 * Bounded TTL cache of the posts-list total (the COUNT is the costly part of a page).
 * The oldest entry is evicted first once the capacity is reached.
 */
export class PostsTotalCache {
  private readonly entries = new Map<string, PostsTotalEntry>();

  constructor(
    private readonly now: PostsTotalClock = Date.now,
    private readonly ttlMs: number = POSTS_TOTAL_CACHE_TTL_MS,
    private readonly capacity: number = POSTS_TOTAL_CACHE_CAPACITY,
  ) {}

  /**
   * The count depends on the reader: own posts with pending media are visible to their
   * author only, so the key carries the mode.
   */
  static buildKey(authorId: string | undefined, readerId: string | undefined): string {
    let mode = 'anon';
    if (readerId !== undefined && authorId === readerId) {
      mode = 'self';
    } else if (readerId !== undefined) {
      mode = `reader:${readerId}`;
    }
    return `${authorId ?? '*'}|${mode}`;
  }

  get(key: string): number | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) {
      return undefined;
    }
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.total;
  }

  set(key: string, total: number): void {
    this.entries.delete(key);
    while (this.entries.size >= this.capacity) {
      const oldest = this.entries.keys().next();
      if (oldest.done === true) {
        break;
      }
      this.entries.delete(oldest.value);
    }
    this.entries.set(key, { total, expiresAt: this.now() + this.ttlMs });
  }

  get size(): number {
    return this.entries.size;
  }
}
