import { BoundedTtlCache, type CacheClock } from '../../../common/cache/bounded-ttl-cache.js';

/** Post to event links of the given posts, or undefined when the lookup failed (nothing cached). */
export type PostEventLinksLoader = (
  postIds: string[],
) => Promise<Record<string, string> | undefined>;

/** A post linked to an event: the link rarely changes, ms-social is spared for 30 s. */
export const POST_EVENT_LINKED_TTL_MS = 30_000;
/** A post without link: short, so a link created on another pod shows within 5 s. */
export const POST_EVENT_UNLINKED_TTL_MS = 5_000;
/**
 * About 250 bytes per entry (two UUIDs and the entry object), so about 1.3 MB per pod at most.
 * 5000 posts is 250 pages of 20, far above the posts read within 30 s on one pod.
 */
export const POST_EVENT_LINKS_CACHE_CAPACITY = 5000;

/**
 * Per-pod cache of the post to event links read from ms-social (GetEventsRelatedToPosts).
 * One entry per post id: the event id when linked, null when the post has no link.
 * Only the posts missing from the cache are asked to ms-social.
 */
export class PostEventLinksCache extends BoundedTtlCache<string | null> {
  constructor(
    now: CacheClock = Date.now,
    private readonly linkedTtlMs: number = POST_EVENT_LINKED_TTL_MS,
    private readonly unlinkedTtlMs: number = POST_EVENT_UNLINKED_TTL_MS,
    capacity: number = POST_EVENT_LINKS_CACHE_CAPACITY,
    name = 'post-event-links',
  ) {
    super(now, linkedTtlMs, capacity, name);
  }

  async resolve(postIds: string[], load: PostEventLinksLoader): Promise<Record<string, string>> {
    const links: Record<string, string> = {};
    const missing: string[] = [];

    for (const postId of new Set(postIds)) {
      const cached = this.get(postId);
      if (cached === undefined) {
        missing.push(postId);
      } else if (cached !== null) {
        links[postId] = cached;
      }
    }

    if (missing.length === 0) return links;

    const loaded = await load(missing);
    if (loaded === undefined) return links;

    for (const postId of missing) {
      const eventId = loaded[postId];
      if (eventId) {
        links[postId] = eventId;
        this.set(postId, eventId, this.linkedTtlMs);
      } else {
        this.set(postId, null, this.unlinkedTtlMs);
      }
    }
    return links;
  }
}
