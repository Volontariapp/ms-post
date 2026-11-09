import { BoundedTtlCache, type CacheClock } from '../../../common/cache/bounded-ttl-cache.js';

export type PostsTotalClock = CacheClock;

export const POSTS_TOTAL_CACHE_TTL_MS = 10_000;
export const POSTS_TOTAL_CACHE_CAPACITY = 2000;

/**
 * Bounded TTL cache of the posts-list total (the COUNT is the costly part of a page).
 * The oldest entry is evicted first once the capacity is reached.
 */
export class PostsTotalCache extends BoundedTtlCache<number> {
  constructor(
    now: PostsTotalClock = Date.now,
    ttlMs: number = POSTS_TOTAL_CACHE_TTL_MS,
    capacity: number = POSTS_TOTAL_CACHE_CAPACITY,
    name = 'posts-total',
  ) {
    super(now, ttlMs, capacity, name);
  }

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
}
