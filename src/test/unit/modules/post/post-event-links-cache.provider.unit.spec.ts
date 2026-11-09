import { describe, expect, it, jest } from '@jest/globals';
import {
  PostEventLinksCache,
  type PostEventLinksLoader,
} from '../../../../modules/post/providers/post-event-links-cache.provider.js';

describe('PostEventLinksCache', () => {
  const createClock = (start = 1000) => {
    let current = start;
    return {
      now: () => current,
      advance: (ms: number) => {
        current += ms;
      },
    };
  };

  const createCache = (clock = createClock(), capacity = 100) =>
    new PostEventLinksCache(clock.now, 30_000, 5_000, capacity);

  const loaderReturning = (links: Record<string, string> | undefined) =>
    jest.fn<PostEventLinksLoader>(() => Promise.resolve(links));

  it('loads every post on a cold cache and returns the links found', async () => {
    const cache = createCache();
    const load = loaderReturning({ p1: 'e1' });

    const links = await cache.resolve(['p1', 'p2'], load);

    expect(load).toHaveBeenCalledWith(['p1', 'p2']);
    expect(links).toEqual({ p1: 'e1' });
  });

  it('does not call the loader when every post is cached, linked or not', async () => {
    const cache = createCache();
    await cache.resolve(['p1', 'p2'], loaderReturning({ p1: 'e1' }));
    const load = loaderReturning({});

    const links = await cache.resolve(['p1', 'p2'], load);

    expect(load).not.toHaveBeenCalled();
    expect(links).toEqual({ p1: 'e1' });
  });

  it('loads only the missing posts and merges them with the cached links', async () => {
    const cache = createCache();
    await cache.resolve(['p1', 'p2'], loaderReturning({ p1: 'e1' }));
    const load = loaderReturning({ p3: 'e3' });

    const links = await cache.resolve(['p1', 'p2', 'p3', 'p4'], load);

    expect(load).toHaveBeenCalledWith(['p3', 'p4']);
    expect(links).toEqual({ p1: 'e1', p3: 'e3' });
  });

  it('asks once for a post id repeated in the request', async () => {
    const cache = createCache();
    const load = loaderReturning({});

    await cache.resolve(['p1', 'p1'], load);

    expect(load).toHaveBeenCalledWith(['p1']);
  });

  it('keeps a link for the linked ttl and an absence for the shorter unlinked ttl', async () => {
    const clock = createClock();
    const cache = createCache(clock);
    await cache.resolve(['linked', 'unlinked'], loaderReturning({ linked: 'e1' }));

    clock.advance(4_999);
    const beforeShortTtl = loaderReturning({});
    await cache.resolve(['linked', 'unlinked'], beforeShortTtl);
    expect(beforeShortTtl).not.toHaveBeenCalled();

    clock.advance(1);
    const afterShortTtl = loaderReturning({ unlinked: 'e2' });
    const links = await cache.resolve(['linked', 'unlinked'], afterShortTtl);
    expect(afterShortTtl).toHaveBeenCalledWith(['unlinked']);
    expect(links).toEqual({ linked: 'e1', unlinked: 'e2' });

    clock.advance(25_000);
    const afterLongTtl = loaderReturning({});
    const expired = await cache.resolve(['linked'], afterLongTtl);
    expect(afterLongTtl).toHaveBeenCalledWith(['linked']);
    expect(expired).toEqual({});
  });

  it('caches nothing when the loader fails and still returns the cached links', async () => {
    const cache = createCache();
    await cache.resolve(['p1'], loaderReturning({ p1: 'e1' }));

    const links = await cache.resolve(['p1', 'p2'], loaderReturning(undefined));
    expect(links).toEqual({ p1: 'e1' });

    const retry = loaderReturning({});
    await cache.resolve(['p2'], retry);
    expect(retry).toHaveBeenCalledWith(['p2']);
  });

  it('ignores links returned for posts that were not asked for', async () => {
    const cache = createCache();
    await cache.resolve(['p1'], loaderReturning({ p1: 'e1', other: 'e9' }));

    const load = loaderReturning({});
    await cache.resolve(['other'], load);

    expect(load).toHaveBeenCalledWith(['other']);
  });

  it('returns an empty map without calling the loader for no post', async () => {
    const cache = createCache();
    const load = loaderReturning({});

    expect(await cache.resolve([], load)).toEqual({});
    expect(load).not.toHaveBeenCalled();
  });

  it('stays bounded by its capacity and reports its stats under its name', async () => {
    const cache = createCache(createClock(), 2);
    await cache.resolve(['p1', 'p2', 'p3'], loaderReturning({}));

    expect(cache.size).toBe(2);
    expect(cache.stats()).toEqual({
      name: 'post-event-links',
      hits: 0,
      misses: 3,
      evictions: 1,
      size: 2,
      capacity: 2,
    });
  });
});
