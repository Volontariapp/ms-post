import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CommentEntity, PostService, CommentService } from '@volontariapp/domain-post';
import { PostQueryController } from '../post.query.controller.js';
import { PostTransformer } from '../../transformers/index.js';
import { SocialEventPostLinkQueryClientService } from '../../clients/social-event-post.query-client.js';
import {
  ListPostsByIdsQueryDTO,
  ListRecentPostsByAuthorsQueryDTO,
} from '../../dto/request/query/post.query.dto.js';
import { ListCommentsByAuthorQueryDTO } from '../../dto/request/query/list-comments.query.dto.js';
import { PostCommandFactory } from './post-command.factory.js';
import {
  createMockCommentQueryService,
  createMockPostQueryService,
  createMockSocialEventPostClient,
} from './post-query.mock.js';

const AUTHOR_A = '11111111-1111-4111-8111-111111111111';
const AUTHOR_B = '33333333-3333-4333-8333-333333333333';
const POST_ID = '22222222-2222-4222-8222-222222222222';

describe('PostQueryController ranking reads', () => {
  let controller: PostQueryController;
  let postService: PostService;
  let commentService: CommentService;
  let socialClient: SocialEventPostLinkQueryClientService;

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
    commentService = module.get(CommentService);
    socialClient = module.get(SocialEventPostLinkQueryClientService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('listRecentPostsByAuthors', () => {
    it('hands the authors, the caps and the converted date to the domain, in the order returned', async () => {
      const first = PostCommandFactory.createPostEntity({ id: POST_ID, authorId: AUTHOR_A });
      const second = PostCommandFactory.createPostEntity({ authorId: AUTHOR_B });
      const listRecent = jest
        .spyOn(postService, 'listRecentByAuthors')
        .mockResolvedValue([first, second]);
      const query = plainToInstance(ListRecentPostsByAuthorsQueryDTO, {
        authorIds: [AUTHOR_A, AUTHOR_B],
        allAuthors: false,
        since: { seconds: 1_760_000_000, nanos: 0 },
        perAuthorLimit: 5,
        limit: 300,
      });

      const response = await controller.listRecentPostsByAuthors(query);

      expect(listRecent).toHaveBeenCalledWith({
        authorIds: [AUTHOR_A, AUTHOR_B],
        allAuthors: false,
        since: new Date(1_760_000_000_000),
        perAuthorLimit: 5,
        limit: 300,
      });
      expect(response.posts.map((post) => post.authorId)).toEqual([AUTHOR_A, AUTHOR_B]);
    });

    it('sends no date when since is absent', async () => {
      const listRecent = jest.spyOn(postService, 'listRecentByAuthors').mockResolvedValue([]);
      const query = plainToInstance(ListRecentPostsByAuthorsQueryDTO, {
        authorIds: [],
        allAuthors: true,
        perAuthorLimit: 0,
        limit: 0,
      });

      await controller.listRecentPostsByAuthors(query);

      expect(listRecent).toHaveBeenCalledWith(expect.objectContaining({ since: undefined }));
    });

    it('does not call another service: the read stays a single query', async () => {
      const eventsLink = jest.spyOn(socialClient, 'getEventsRelatedToPosts');
      const eventLink = jest.spyOn(socialClient, 'getEventRelatedToPost');
      jest
        .spyOn(postService, 'listRecentByAuthors')
        .mockResolvedValue([PostCommandFactory.createPostEntity()]);

      await controller.listRecentPostsByAuthors(
        plainToInstance(ListRecentPostsByAuthorsQueryDTO, {
          authorIds: [AUTHOR_A],
          allAuthors: false,
          perAuthorLimit: 5,
          limit: 100,
        }),
      );

      expect(eventsLink).not.toHaveBeenCalled();
      expect(eventLink).not.toHaveBeenCalled();
    });

    it('rejects a negative cap', async () => {
      const query = plainToInstance(ListRecentPostsByAuthorsQueryDTO, {
        authorIds: [],
        allAuthors: true,
        perAuthorLimit: -1,
        limit: 10,
      });

      const errors = await validate(query);

      expect(errors.map((error) => error.property)).toContain('perAuthorLimit');
    });
  });

  describe('listPostsByIds', () => {
    it('returns the posts found by the domain without any error for the missing ones', async () => {
      const found = PostCommandFactory.createPostEntity({ id: POST_ID });
      const listByIds = jest.spyOn(postService, 'listByIds').mockResolvedValue([found]);
      const query = plainToInstance(ListPostsByIdsQueryDTO, { ids: [POST_ID, AUTHOR_A] });

      const response = await controller.listPostsByIds(query);

      expect(listByIds).toHaveBeenCalledWith([POST_ID, AUTHOR_A]);
      expect(response.posts.map((post) => post.id)).toEqual([POST_ID]);
    });

    it('accepts an empty list', async () => {
      jest.spyOn(postService, 'listByIds').mockResolvedValue([]);

      const response = await controller.listPostsByIds(
        plainToInstance(ListPostsByIdsQueryDTO, { ids: [] }),
      );

      expect(response.posts).toEqual([]);
    });
  });

  describe('listCommentsByAuthor', () => {
    it('hands the author, the date and the cap to the domain', async () => {
      const comment = Object.assign(new CommentEntity(), {
        id: POST_ID,
        postId: AUTHOR_B,
        authorId: AUTHOR_A,
        content: 'hello',
        createdAt: new Date('2026-10-01T00:00:00Z'),
        updatedAt: new Date('2026-10-01T00:00:00Z'),
      });
      const listByAuthor = jest.spyOn(commentService, 'listByAuthor').mockResolvedValue([comment]);
      const query = plainToInstance(ListCommentsByAuthorQueryDTO, {
        authorId: AUTHOR_A,
        since: { seconds: 1_760_000_000, nanos: 0 },
        limit: 200,
      });

      const response = await controller.listCommentsByAuthor(query);

      expect(listByAuthor).toHaveBeenCalledWith(AUTHOR_A, new Date(1_760_000_000_000), 200);
      expect(response.comments.map((item) => item.authorId)).toEqual([AUTHOR_A]);
    });
  });
});
