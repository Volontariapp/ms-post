import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PostService, CommentService } from '@volontariapp/domain-post';
import type { AuthUser } from '@volontariapp/auth';
import { PostQueryController } from '../post.query.controller.js';
import { PostTransformer } from '../../transformers/index.js';
import { SocialEventPostLinkQueryClientService } from '../../clients/social-event-post.query-client.js';
import { PostsTotalCache } from '../../providers/posts-total-cache.provider.js';
import { ListPostsQueryDTO } from '../../dto/request/query/post.query.dto.js';
import {
  createMockCommentQueryService,
  createMockPostQueryService,
  createMockSocialEventPostClient,
} from './post-query.mock.js';

const AUTHOR_ID = '11111111-1111-4111-8111-111111111111';
const READER_A: AuthUser = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', role: 'USER' };
const READER_B: AuthUser = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', role: 'USER' };

const page = (total: number) => ({
  data: [],
  total,
  page: 1,
  limit: 10,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

describe('PostQueryController posts total cache', () => {
  let controller: PostQueryController;
  let postService: PostService;
  let clock: number;

  beforeEach(async () => {
    clock = 0;
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostQueryController],
      providers: [
        PostTransformer,
        { provide: PostService, useValue: createMockPostQueryService() },
        { provide: CommentService, useValue: createMockCommentQueryService() },
        {
          provide: SocialEventPostLinkQueryClientService,
          useValue: createMockSocialEventPostClient(),
        },
        {
          provide: PostsTotalCache,
          useFactory: (): PostsTotalCache => new PostsTotalCache(() => clock, 10_000, 10),
        },
      ],
    }).compile();

    controller = module.get(PostQueryController);
    postService = module.get(PostService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const query = Object.assign(new ListPostsQueryDTO(), { authorId: AUTHOR_ID });

  it('counts on a miss, then reuses the total on a hit', async () => {
    const listPosts = jest.spyOn(postService, 'listPosts').mockResolvedValue(page(7));

    await controller.listPosts(query, undefined, READER_A);
    const second = await controller.listPosts(query, undefined, READER_A);

    expect(listPosts).toHaveBeenNthCalledWith(1, 1, 10, AUTHOR_ID, READER_A.id);
    expect(listPosts).toHaveBeenNthCalledWith(2, 1, 10, AUTHOR_ID, READER_A.id, {
      knownTotal: 7,
    });
    expect(second.pagination?.total).toBe(7);
  });

  it('counts again once the ttl has elapsed', async () => {
    const listPosts = jest.spyOn(postService, 'listPosts').mockResolvedValue(page(7));

    await controller.listPosts(query, undefined, READER_A);
    clock = 10_000;
    await controller.listPosts(query, undefined, READER_A);

    expect(listPosts).toHaveBeenNthCalledWith(2, 1, 10, AUTHOR_ID, READER_A.id);
  });

  it('does not share the total between readers', async () => {
    const listPosts = jest.spyOn(postService, 'listPosts').mockResolvedValue(page(7));

    await controller.listPosts(query, undefined, READER_A);
    await controller.listPosts(query, undefined, READER_B);

    expect(listPosts).toHaveBeenNthCalledWith(2, 1, 10, AUTHOR_ID, READER_B.id);
  });

  it('never caches when the count fails', async () => {
    const listPosts = jest
      .spyOn(postService, 'listPosts')
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValue(page(3));

    await expect(controller.listPosts(query, undefined, READER_A)).rejects.toThrow('db down');
    await controller.listPosts(query, undefined, READER_A);

    expect(listPosts).toHaveBeenNthCalledWith(2, 1, 10, AUTHOR_ID, READER_A.id);
  });
});
