import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  POST_SERVICE_NAME,
  type PostQuery,
  type GetPostResponse,
  type ListPostsQuery,
  type ListPostsResponse,
} from '@volontariapp/contracts';

@Controller()
export class PostQueryController {
  @GrpcMethod(POST_SERVICE_NAME, 'getPost')
  async getPost(_query: PostQuery): Promise<GetPostResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(POST_SERVICE_NAME, 'listPosts')
  async listPosts(_query: ListPostsQuery): Promise<ListPostsResponse> {
    throw new Error('Method not implemented.');
  }
}
