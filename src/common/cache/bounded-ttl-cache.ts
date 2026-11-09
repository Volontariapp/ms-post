import type { CacheStats, CacheStatsSource } from './cache-stats.js';

export type CacheClock = () => number;

interface BoundedTtlEntry<V> {
  readonly value: V;
  readonly expiresAt: number;
}

/**
 * Per-pod bounded TTL cache. The oldest entry is evicted first once the capacity is reached.
 * Each entry may carry its own TTL; the default applies otherwise. Hits, misses and evictions
 * are plain counters, read and restarted every minute by the CacheStatsReporter.
 */
export class BoundedTtlCache<V> implements CacheStatsSource {
  private readonly entries = new Map<string, BoundedTtlEntry<V>>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(
    private readonly now: CacheClock,
    private readonly defaultTtlMs: number,
    private readonly capacity: number,
    private readonly name: string,
  ) {}

  get(key: string): V | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) {
      this.misses++;
      return undefined;
    }
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      this.misses++;
      return undefined;
    }
    this.hits++;
    return entry.value;
  }

  set(key: string, value: V, ttlMs: number = this.defaultTtlMs): void {
    this.entries.delete(key);
    while (this.entries.size >= this.capacity) {
      const oldest = this.entries.keys().next();
      if (oldest.done === true) {
        break;
      }
      this.entries.delete(oldest.value);
      this.evictions++;
    }
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
  }

  get size(): number {
    return this.entries.size;
  }

  stats(): CacheStats {
    return {
      name: this.name,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      size: this.entries.size,
      capacity: this.capacity,
    };
  }

  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }
}
