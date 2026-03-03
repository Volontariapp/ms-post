import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  POST_SERVICE_NAME,
  type CreatePostCommand,
  type CreatePostResponse,
  type UpdatePostCommand,
  type UpdatePostResponse,
  type DeletePostCommand,
  type DeletePostResponse,
} from '@volontariapp/contracts';

@Controller()
export class PostCommandController {
  @GrpcMethod(POST_SERVICE_NAME, 'createPost')
  async createPost(_command: CreatePostCommand): Promise<CreatePostResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(POST_SERVICE_NAME, 'updatePost')
  async updatePost(_command: UpdatePostCommand): Promise<UpdatePostResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(POST_SERVICE_NAME, 'deletePost')
  async deletePost(_command: DeletePostCommand): Promise<DeletePostResponse> {
    throw new Error('Method not implemented.');
  }
}
