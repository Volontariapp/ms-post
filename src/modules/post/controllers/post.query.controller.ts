import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  POST_SERVICE_NAME,
  POST_GRPC_METHODS,
  type PostQuery,
  type GetPostResponse,
  type ListPostsQuery,
  type ListPostsResponse,
} from '@volontariapp/contracts';

@Controller()
export class PostQueryController {
  @GrpcMethod(POST_SERVICE_NAME, POST_GRPC_METHODS.GET_POST)
  getPost(_query: PostQuery): Promise<GetPostResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(POST_SERVICE_NAME, POST_GRPC_METHODS.LIST_POSTS)
  listPosts(_query: ListPostsQuery): Promise<ListPostsResponse> {
    throw new Error('Method not implemented.');
  }
}
