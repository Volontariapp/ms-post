import { describe, expect, it } from '@jest/globals';
import { PostsTotalCache } from '../../../../modules/post/providers/posts-total-cache.provider.js';

describe('PostsTotalCache', () => {
  const createClock = (start = 1000) => {
    let current = start;
    return {
      now: () => current,
      advance: (ms: number) => {
        current += ms;
      },
    };
  };

  it('returns undefined on a miss', () => {
    const cache = new PostsTotalCache(createClock().now);
    expect(cache.get('a|anon')).toBeUndefined();
  });

  it('returns the stored total on a hit before expiry', () => {
    const clock = createClock();
    const cache = new PostsTotalCache(clock.now, 10_000, 10);
    cache.set('a|anon', 42);
    clock.advance(9_999);
    expect(cache.get('a|anon')).toBe(42);
  });

  it('expires the entry once the ttl has elapsed', () => {
    const clock = createClock();
    const cache = new PostsTotalCache(clock.now, 10_000, 10);
    cache.set('a|anon', 42);
    clock.advance(10_000);
    expect(cache.get('a|anon')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('evicts the oldest entry when the capacity is reached', () => {
    const cache = new PostsTotalCache(createClock().now, 10_000, 2);
    cache.set('k1', 1);
    cache.set('k2', 2);
    cache.set('k3', 3);
    expect(cache.get('k1')).toBeUndefined();
    expect(cache.get('k2')).toBe(2);
    expect(cache.get('k3')).toBe(3);
    expect(cache.size).toBe(2);
  });

  it('does not evict when overwriting an existing key at capacity', () => {
    const cache = new PostsTotalCache(createClock().now, 10_000, 2);
    cache.set('k1', 1);
    cache.set('k2', 2);
    cache.set('k2', 20);
    expect(cache.get('k1')).toBe(1);
    expect(cache.get('k2')).toBe(20);
  });

  describe('buildKey', () => {
    it('builds one key per reader', () => {
      expect(PostsTotalCache.buildKey('author', 'reader-1')).toBe('author|reader:reader-1');
      expect(PostsTotalCache.buildKey('author', 'reader-2')).toBe('author|reader:reader-2');
    });

    it('uses the self mode when the author reads their own posts', () => {
      expect(PostsTotalCache.buildKey('author', 'author')).toBe('author|self');
    });

    it('uses the anon mode without reader and a wildcard without author', () => {
      expect(PostsTotalCache.buildKey('author', undefined)).toBe('author|anon');
      expect(PostsTotalCache.buildKey(undefined, undefined)).toBe('*|anon');
      expect(PostsTotalCache.buildKey(undefined, 'reader-1')).toBe('*|reader:reader-1');
    });
  });
});
