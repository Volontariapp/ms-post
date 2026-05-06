import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GRPC_SERVICES, POST_METHODS } from '@volontariapp/contracts-nest';
import { CreatePostCommandDTO } from '../dto/request/command/create-post.command.dto.js';
import { UpdatePostCommandDTO } from '../dto/request/command/update-post.command.dto.js';
import { PostTransformer } from '../transformers/index.js';
import { Logger } from '@volontariapp/logger';

@Controller()
export class PostCommandController {
  private readonly logger = new Logger({
    context: PostCommandController.name,
  });

  constructor(private readonly postTransformer: PostTransformer) {}

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.CREATE_POST)
  async createPost(data: CreatePostCommandDTO): Promise<any> {
    this.logger.log(`gRPC: Creating post for event: ${data.eventId}`);
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.UPDATE_POST)
  async updatePost(data: UpdatePostCommandDTO): Promise<any> {
    this.logger.log(`gRPC: Updating post with id: ${data.id}`);
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.DELETE_POST)
  async deletePost(data: { id: string }): Promise<any> {
    this.logger.log(`gRPC: Deleting post with id: ${data.id}`);
    throw new Error('Method not implemented.');
  }
}
