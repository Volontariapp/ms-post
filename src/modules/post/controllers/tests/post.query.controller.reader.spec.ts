import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PostMediaStatus as ContractsPostMediaStatus } from '@volontariapp/contracts-nest';
import { PostMediaStatus, PostService, CommentService } from '@volontariapp/domain-post';
import type { AuthUser } from '@volontariapp/auth';
import { PostQueryController } from '../post.query.controller.js';
import { PostTransformer } from '../../transformers/index.js';
import { SocialEventPostLinkQueryClientService } from '../../clients/social-event-post.query-client.js';
import { ListPostsQueryDTO, PostQueryDTO } from '../../dto/request/query/post.query.dto.js';
import { PostCommandFactory } from './post-command.factory.js';
import {
  createMockCommentQueryService,
  createMockPostQueryService,
  createMockSocialEventPostClient,
} from './post-query.mock.js';

const AUTHOR: AuthUser = { id: '11111111-1111-4111-8111-111111111111', role: 'USER' };
const POST_ID = '22222222-2222-4222-8222-222222222222';

describe('PostQueryController reader identity', () => {
  let controller: PostQueryController;
  let postService: PostService;

  beforeEach(async () => {
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
      ],
    }).compile();

    controller = module.get(PostQueryController);
    postService = module.get(PostService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getPost', () => {
    const query = Object.assign(new PostQueryDTO(), { id: POST_ID });

    it('hands the reader id to the domain so an author can read their own pending post', async () => {
      const pending = PostCommandFactory.createPostEntity({
        id: POST_ID,
        authorId: AUTHOR.id,
        media_status: PostMediaStatus.PENDING,
      });
      const findById = jest.spyOn(postService, 'findById').mockResolvedValue(pending);

      const response = await controller.getPost(query, undefined, AUTHOR);

      expect(findById).toHaveBeenCalledWith(POST_ID, AUTHOR.id, ['media']);
      expect(response.post.mediaStatus).toBe(ContractsPostMediaStatus.POST_MEDIA_STATUS_PENDING);
    });

    it('keeps the public view when the call carries no user', async () => {
      const findById = jest
        .spyOn(postService, 'findById')
        .mockResolvedValue(PostCommandFactory.createPostEntity({ id: POST_ID }));

      await controller.getPost(query, undefined, undefined);

      expect(findById).toHaveBeenCalledWith(POST_ID, undefined, ['media']);
    });
  });

  describe('listPosts', () => {
    const query = Object.assign(new ListPostsQueryDTO(), { authorId: AUTHOR.id });

    it('hands the reader id to the domain so an author lists their own pending posts', async () => {
      const pending = PostCommandFactory.createPostEntity({
        authorId: AUTHOR.id,
        media_status: PostMediaStatus.PENDING,
      });
      const listPosts = jest.spyOn(postService, 'listPosts').mockResolvedValue({
        data: [pending],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      const response = await controller.listPosts(query, undefined, AUTHOR);

      expect(listPosts).toHaveBeenCalledWith(1, 10, AUTHOR.id, AUTHOR.id);
      expect(response.posts).toHaveLength(1);
      expect(response.posts[0]?.mediaStatus).toBe(
        ContractsPostMediaStatus.POST_MEDIA_STATUS_PENDING,
      );
    });

    it('keeps the public view when the call carries no user', async () => {
      const listPosts = jest.spyOn(postService, 'listPosts').mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      await controller.listPosts(query, undefined, undefined);

      expect(listPosts).toHaveBeenCalledWith(1, 10, AUTHOR.id, undefined);
    });
  });
});
