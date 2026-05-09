import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GRPC_SERVICES, POST_METHODS } from '@volontariapp/contracts-nest';
import { PostService } from '@volontariapp/domain-post';
import { PostQueryDTO, ListPostsQueryDTO } from '../dto/request/query/post.query.dto.js';
import { PostTransformer } from '../transformers/index.js';
import { Logger } from '@volontariapp/logger';
import { GetPostResponseDTO, ListPostsResponseDTO } from '../dto/response/post.response.dto.js';

@Controller()
export class PostQueryController {
  private readonly logger = new Logger({
    context: PostQueryController.name,
  });

  constructor(
    private readonly postTransformer: PostTransformer,
    private readonly postService: PostService,
  ) {}

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.GET_POST)
  async getPost(query: PostQueryDTO): Promise<GetPostResponseDTO> {
    this.logger.log(`gRPC: Getting post with id: ${query.id}`);

    const entity = await this.postService.findById(query.id);
    const response = new GetPostResponseDTO();
    response.post = this.postTransformer.toPostDTO(entity);
    return response;
  }

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.LIST_POSTS)
  async listPosts(query: ListPostsQueryDTO): Promise<ListPostsResponseDTO> {
    this.logger.log(`gRPC: Listing posts for author: ${query.authorId ?? 'all'}`);

    const entities = query.authorId
      ? await this.postService.findByAuthorId(query.authorId)
      : await this.postService.findAll();

    const response = new ListPostsResponseDTO();
    response.posts = entities.map((entity) => this.postTransformer.toPostDTO(entity));
    response.pagination = undefined;
    return response;
  }
}
