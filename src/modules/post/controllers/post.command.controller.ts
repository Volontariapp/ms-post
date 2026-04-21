import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  type CreatePostCommand,
  type CreatePostResponse,
  type UpdatePostCommand,
  type UpdatePostResponse,
  type DeletePostCommand,
  type DeletePostResponse,
} from '@volontariapp/contracts';
import { GRPC_SERVICES, POST_METHODS } from '@volontariapp/contracts-nest';

@Controller()
export class PostCommandController {
  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.CREATE_POST)
  createPost(_command: CreatePostCommand): Promise<CreatePostResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.UPDATE_POST)
  updatePost(_command: UpdatePostCommand): Promise<UpdatePostResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.DELETE_POST)
  deletePost(_command: DeletePostCommand): Promise<DeletePostResponse> {
    throw new Error('Method not implemented.');
  }
}
