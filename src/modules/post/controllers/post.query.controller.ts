import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GRPC_SERVICES, POST_METHODS } from '@volontariapp/contracts-nest';
import { PostService, CommentService, CommentEntity } from '@volontariapp/domain-post';
import { PostQueryDTO, ListPostsQueryDTO } from '../dto/request/query/post.query.dto.js';
import { PostTransformer } from '../transformers/index.js';
import { Logger } from '@volontariapp/logger';
import { GetPostResponseDTO, ListPostsResponseDTO } from '../dto/response/post.response.dto.js';
import { ListCommentsQueryDTO } from '../dto/request/query/list-comments.query.dto.js';
import { ListCommentsResponseDTO } from '../dto/response/comment.response.dto.js';
import { Metadata } from '@grpc/grpc-js';
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
  async getPost(query: PostQueryDTO, metadata: Metadata): Promise<GetPostResponseDTO> {
    this.logger.log(`gRPC: Getting post with id: ${query.id}`);

    const token = metadata.get('x-internal-token')[0]?.toString() || '';
    const entity = await this.postService.findById(query.id);

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
  async listPosts(query: ListPostsQueryDTO, metadata: Metadata): Promise<ListPostsResponseDTO> {
    this.logger.log(`gRPC: Listing posts for author: ${query.authorId ?? 'all'}`);

    const token = metadata.get('x-internal-token')[0]?.toString() || '';
    const page = query.pagination?.page ?? 1;
    const limit = query.pagination?.limit ?? 10;

    const paginatedResult = await this.postService.listPosts(page, limit, query.authorId);

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
  async listComments(query: ListCommentsQueryDTO): Promise<ListCommentsResponseDTO> {
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
}
