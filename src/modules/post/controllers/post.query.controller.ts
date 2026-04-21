import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  type PostQuery,
  type GetPostResponse,
  type ListPostsQuery,
  type ListPostsResponse,
} from '@volontariapp/contracts';
import { GRPC_SERVICES, POST_METHODS } from '@volontariapp/contracts-nest';

@Controller()
export class PostQueryController {
  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.GET_POST)
  getPost(_query: PostQuery): Promise<GetPostResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.LIST_POSTS)
  listPosts(_query: ListPostsQuery): Promise<ListPostsResponse> {
    throw new Error('Method not implemented.');
  }
}
