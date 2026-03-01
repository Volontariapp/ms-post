import { Controller } from '@nestjs/common';
import {
  PostServiceController,
  PostServiceControllerMethods,
  CreatePostRequest,
  CreatePostResponse,
  GetPostRequest,
  GetPostResponse,
  UpdatePostRequest,
  UpdatePostResponse,
  DeletePostRequest,
  DeletePostResponse,
  ListPostsRequest,
  ListPostsResponse,
} from '@volontariapp/contracts';

@Controller()
@PostServiceControllerMethods()
export class PostGrpcController implements PostServiceController {
  async getPost(_request: GetPostRequest): Promise<GetPostResponse> {
    throw new Error('Method not implemented.');
  }

  async listPosts(_request: ListPostsRequest): Promise<ListPostsResponse> {
    throw new Error('Method not implemented.');
  }

  async createPost(_request: CreatePostRequest): Promise<CreatePostResponse> {
    throw new Error('Method not implemented.');
  }

  async updatePost(_request: UpdatePostRequest): Promise<UpdatePostResponse> {
    throw new Error('Method not implemented.');
  }

  async deletePost(_request: DeletePostRequest): Promise<DeletePostResponse> {
    throw new Error('Method not implemented.');
  }
}
