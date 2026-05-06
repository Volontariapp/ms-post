import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GRPC_SERVICES, POST_QUERY_METHODS } from '@volontariapp/contracts-nest';
import { PostQueryDTO, ListPostsQueryDTO } from '../dto/request/query/post.query.dto.js';
import { PostTransformer } from '../transformers/index.js';
import { Logger } from '@volontariapp/logger';

@Controller()
export class PostQueryController {
  private readonly logger = new Logger({
    context: PostQueryController.name,
  });

  constructor(private readonly postTransformer: PostTransformer) {}

  @GrpcMethod(GRPC_SERVICES.POST_QUERY_SERVICE, POST_QUERY_METHODS.GET_POST)
  async getPost(query: PostQueryDTO): Promise<any> {
    this.logger.log(`gRPC: Getting post with id: ${query.id}`);
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(GRPC_SERVICES.POST_QUERY_SERVICE, POST_QUERY_METHODS.LIST_POSTS)
  async listPosts(query: ListPostsQueryDTO): Promise<any> {
    this.logger.log(`gRPC: Listing posts for event: ${query.eventId}`);
    throw new Error('Method not implemented.');
  }
}
