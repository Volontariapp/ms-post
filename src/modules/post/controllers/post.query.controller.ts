import { Controller } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { GRPC_SERVICES, GrpcDateMapper, POST_METHODS } from '@volontariapp/contracts-nest';
import { PostService, CommentService, CommentEntity } from '@volontariapp/domain-post';
import {
  PostQueryDTO,
  ListPostsQueryDTO,
  ListRecentPostsByAuthorsQueryDTO,
  ListPostsByIdsQueryDTO,
} from '../dto/request/query/post.query.dto.js';
import { PostTransformer } from '../transformers/index.js';
import { Logger } from '@volontariapp/logger';
import {
  GetPostResponseDTO,
  ListPostsResponseDTO,
  ListRecentPostsByAuthorsResponseDTO,
  ListPostsByIdsResponseDTO,
} from '../dto/response/post.response.dto.js';
import {
  ListCommentsQueryDTO,
  ListCommentsByAuthorQueryDTO,
} from '../dto/request/query/list-comments.query.dto.js';
import {
  ListCommentsResponseDTO,
  ListCommentsByAuthorResponseDTO,
} from '../dto/response/comment.response.dto.js';
import { CurrentUser, InternalToken } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { SocialEventPostLinkQueryClientService } from '../clients/social-event-post.query-client.js';

@Controller()
export class PostQueryController {
  private readonly logger = new Logger({
    context: PostQueryController.name,
  });

  constructor(
    private readonly postTransformer: PostTransformer,
    private readonly postService: PostService,
    private readonly commentService: CommentService,
    private readonly socialEventPostClient: SocialEventPostLinkQueryClientService,
  ) {}

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.GET_POST)
  async getPost(
    @Payload() query: PostQueryDTO,
    @InternalToken() token: string | undefined,
    @CurrentUser() user: AuthUser | undefined,
  ): Promise<GetPostResponseDTO> {
    this.logger.log(`gRPC: Getting post with id: ${query.id}`);

    // The reader id lets an author read their own post while its media is still PENDING.
    const entity = await this.postService.findById(query.id, user?.id, ['media']);

    if (token) {
      const eventId = await this.socialEventPostClient.getEventRelatedToPost(entity.id, token);
      if (eventId) {
        entity.eventId = eventId;
      }
    }

    const response = new GetPostResponseDTO();
    response.post = this.postTransformer.toPostDTO(entity);
    return response;
  }

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.LIST_POSTS)
  async listPosts(
    @Payload() query: ListPostsQueryDTO,
    @InternalToken() token: string | undefined,
    @CurrentUser() user: AuthUser | undefined,
  ): Promise<ListPostsResponseDTO> {
    this.logger.log(`gRPC: Listing posts for author: ${query.authorId ?? 'all'}`);

    const page = query.pagination?.page ?? 1;
    const limit = query.pagination?.limit ?? 10;

    const paginatedResult = await this.postService.listPosts(page, limit, query.authorId, user?.id);

    if (token && paginatedResult.data.length > 0) {
      const postIds = paginatedResult.data.map((p) => p.id);
      const eventIdsMap = await this.socialEventPostClient.getEventsRelatedToPosts(postIds, token);
      for (const entity of paginatedResult.data) {
        if (eventIdsMap[entity.id]) {
          entity.eventId = eventIdsMap[entity.id];
        }
      }
    }

    const response = new ListPostsResponseDTO();
    response.posts = paginatedResult.data.map((entity) => this.postTransformer.toPostDTO(entity));
    response.pagination = {
      page: paginatedResult.page,
      limit: paginatedResult.limit,
      total: paginatedResult.total,
      totalPages: Math.ceil(paginatedResult.total / paginatedResult.limit),
    };
    return response;
  }

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, 'ListComments')
  async listComments(@Payload() query: ListCommentsQueryDTO): Promise<ListCommentsResponseDTO> {
    this.logger.log(`gRPC: Listing comments for post: ${query.postId}`);

    await this.postService.findById(query.postId);

    const page = query.pagination?.page ?? 1;
    const limit = query.pagination?.limit ?? 10;

    const paginatedResult = await this.commentService.listPaginatedByPostId(
      query.postId,
      page,
      limit,
    );

    const response = new ListCommentsResponseDTO();
    response.comments = paginatedResult.data.map((entity: CommentEntity) =>
      this.postTransformer.toCommentDTO(entity),
    );
    response.pagination = {
      page: paginatedResult.page,
      limit: paginatedResult.limit,
      total: paginatedResult.total,
      totalPages: Math.ceil(paginatedResult.total / paginatedResult.limit),
    };
    return response;
  }

  /**
   * Ranking read: recent visible posts of the given authors (or of everyone), newest first.
   * No event enrichment on purpose: this read stays a single query for the ranking workers.
   */
  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, 'ListRecentPostsByAuthors')
  async listRecentPostsByAuthors(
    @Payload() query: ListRecentPostsByAuthorsQueryDTO,
  ): Promise<ListRecentPostsByAuthorsResponseDTO> {
    this.logger.log(
      `gRPC: Listing recent posts for ${query.allAuthors ? 'all authors' : `${String(query.authorIds.length)} authors`}`,
    );

    const entities = await this.postService.listRecentByAuthors({
      authorIds: query.authorIds,
      allAuthors: query.allAuthors,
      since: GrpcDateMapper.toDate(query.since),
      perAuthorLimit: query.perAuthorLimit,
      limit: query.limit,
    });

    const response = new ListRecentPostsByAuthorsResponseDTO();
    response.posts = entities.map((entity) => this.postTransformer.toPostDTO(entity));
    return response;
  }

  /** Ranking read: the visible posts among the given ids. Absent ids are ignored, never an error. */
  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, 'ListPostsByIds')
  async listPostsByIds(
    @Payload() query: ListPostsByIdsQueryDTO,
  ): Promise<ListPostsByIdsResponseDTO> {
    this.logger.log(`gRPC: Listing posts by ${String(query.ids.length)} ids`);

    const entities = await this.postService.listByIds(query.ids);

    const response = new ListPostsByIdsResponseDTO();
    response.posts = entities.map((entity) => this.postTransformer.toPostDTO(entity));
    return response;
  }

  /** Ranking read: recent comments of an author, newest first. */
  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, 'ListCommentsByAuthor')
  async listCommentsByAuthor(
    @Payload() query: ListCommentsByAuthorQueryDTO,
  ): Promise<ListCommentsByAuthorResponseDTO> {
    this.logger.log(`gRPC: Listing comments of author: ${query.authorId}`);

    const entities = await this.commentService.listByAuthor(
      query.authorId,
      GrpcDateMapper.toDate(query.since),
      query.limit,
    );

    const response = new ListCommentsByAuthorResponseDTO();
    response.comments = entities.map((entity: CommentEntity) =>
      this.postTransformer.toCommentDTO(entity),
    );
    return response;
  }
}
