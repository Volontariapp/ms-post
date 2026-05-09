import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GRPC_SERVICES, POST_METHODS } from '@volontariapp/contracts-nest';
import { PostService, PostEntity } from '@volontariapp/domain-post';
import { CurrentUser } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { CreatePostCommandDTO } from '../dto/request/command/create-post.command.dto.js';
import { DeletePostCommandDTO } from '../dto/request/command/delete-post.command.dto.js';
import { UpdatePostCommandDTO } from '../dto/request/command/update-post.command.dto.js';
import { PostTransformer } from '../transformers/index.js';
import { Logger } from '@volontariapp/logger';
import {
  CreatePostResponseDTO,
  UpdatePostResponseDTO,
  DeletePostResponseDTO,
} from '../dto/response/post.response.dto.js';

@Controller()
export class PostCommandController {
  private readonly logger = new Logger({
    context: PostCommandController.name,
  });

  constructor(
    private readonly postTransformer: PostTransformer,
    private readonly postService: PostService,
  ) {}

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.CREATE_POST)
  async createPost(
    data: CreatePostCommandDTO,
    @CurrentUser() user: AuthUser,
  ): Promise<CreatePostResponseDTO> {
    this.logger.log(`gRPC: Creating post with title: ${data.title} by user: ${user.id}`);
    const entity = await this.postService.create(
      this.postTransformer.fromCreateCommand(data, user.id),
    );
    const response = new CreatePostResponseDTO();
    response.post = this.postTransformer.toPostDTO(entity);
    return response;
  }

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.UPDATE_POST)
  async updatePost(data: UpdatePostCommandDTO): Promise<UpdatePostResponseDTO> {
    const postId = data.post.id;
    if (!postId) {
      throw new Error('Post id is required for update');
    }

    this.logger.log(`gRPC: Updating post with id: ${postId}`);

    const updateData: Partial<PostEntity> = {};
    updateData.title = data.post.title;
    updateData.content = data.post.content;

    const entity = await this.postService.update(postId, updateData);
    const response = new UpdatePostResponseDTO();
    response.post = this.postTransformer.toPostDTO(entity);
    return response;
  }

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.DELETE_POST)
  async deletePost(data: DeletePostCommandDTO): Promise<DeletePostResponseDTO> {
    this.logger.log(`gRPC: Deleting post with id: ${data.id}`);
    await this.postService.delete(data.id);
    const response = new DeletePostResponseDTO();
    response.success = true;
    return response;
  }
}
