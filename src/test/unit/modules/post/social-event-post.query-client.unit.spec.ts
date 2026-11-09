import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { SOCIAL_PACKAGE } from '../../../../grpc/grpc-packages.js';
import { SocialEventPostLinkQueryClientService } from '../../../../modules/post/clients/social-event-post.query-client.js';
import { PostEventLinksCache } from '../../../../modules/post/providers/post-event-links-cache.provider.js';
import {
  createSocialGrpcClientMock,
  type MockEventPostLinkQueryService,
} from '../../../helpers/mocks/social-event-post-grpc.mock.js';

describe('SocialEventPostLinkQueryClientService links cache', () => {
  let service: SocialEventPostLinkQueryClientService;
  let queryService: MockEventPostLinkQueryService;
  let clock: number;

  beforeEach(async () => {
    clock = 0;
    const grpc = createSocialGrpcClientMock();
    queryService = grpc.queryService;
    const module = await Test.createTestingModule({
      providers: [
        SocialEventPostLinkQueryClientService,
        { provide: SOCIAL_PACKAGE, useValue: grpc.client },
        {
          provide: PostEventLinksCache,
          useFactory: (): PostEventLinksCache =>
            new PostEventLinksCache(() => clock, 30_000, 5_000, 100),
        },
      ],
    }).compile();
    await module.init();
    service = module.get(SocialEventPostLinkQueryClientService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('asks ms-social only for the posts missing from the cache', async () => {
    queryService.getEventsRelatedToPosts.mockReturnValueOnce(
      of({ links: [{ postId: 'p1', eventId: 'e1' }] }),
    );
    await service.getEventsRelatedToPosts(['p1', 'p2'], 'token');

    queryService.getEventsRelatedToPosts.mockReturnValueOnce(
      of({ links: [{ postId: 'p3', eventId: 'e3' }] }),
    );
    const links = await service.getEventsRelatedToPosts(['p1', 'p2', 'p3'], 'token');

    expect(queryService.getEventsRelatedToPosts).toHaveBeenCalledTimes(2);
    expect(queryService.getEventsRelatedToPosts.mock.calls[1]?.[0]).toEqual({ postIds: ['p3'] });
    expect(links).toEqual({ p1: 'e1', p3: 'e3' });
  });

  it('makes no call when every post is cached', async () => {
    queryService.getEventsRelatedToPosts.mockReturnValueOnce(of({ links: [] }));
    await service.getEventsRelatedToPosts(['p1'], 'token');

    const links = await service.getEventsRelatedToPosts(['p1'], 'token');

    expect(queryService.getEventsRelatedToPosts).toHaveBeenCalledTimes(1);
    expect(links).toEqual({});
  });

  it('does not cache an ms-social error and asks again on the next page', async () => {
    queryService.getEventsRelatedToPosts.mockReturnValueOnce(
      throwError(() => new Error('UNAVAILABLE')),
    );
    expect(await service.getEventsRelatedToPosts(['p1'], 'token')).toEqual({});

    queryService.getEventsRelatedToPosts.mockReturnValueOnce(
      of({ links: [{ postId: 'p1', eventId: 'e1' }] }),
    );
    expect(await service.getEventsRelatedToPosts(['p1'], 'token')).toEqual({ p1: 'e1' });
    expect(queryService.getEventsRelatedToPosts).toHaveBeenCalledTimes(2);
  });

  it('asks again for an unlinked post after 5 s and keeps a linked post for 30 s', async () => {
    queryService.getEventsRelatedToPosts.mockReturnValueOnce(
      of({ links: [{ postId: 'linked', eventId: 'e1' }] }),
    );
    await service.getEventsRelatedToPosts(['linked', 'unlinked'], 'token');

    clock = 5_000;
    queryService.getEventsRelatedToPosts.mockReturnValueOnce(of({ links: [] }));
    await service.getEventsRelatedToPosts(['linked', 'unlinked'], 'token');

    expect(queryService.getEventsRelatedToPosts.mock.calls[1]?.[0]).toEqual({
      postIds: ['unlinked'],
    });
  });

  it('makes no call for an empty page', async () => {
    expect(await service.getEventsRelatedToPosts([], 'token')).toEqual({});
    expect(queryService.getEventsRelatedToPosts).not.toHaveBeenCalled();
  });
});
