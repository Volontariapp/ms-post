import { Controller } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { GRPC_SERVICES, POST_METHODS } from '@volontariapp/contracts-nest';
import { POST_NOT_FOUND } from '@volontariapp/errors-nest';
import { CurrentUser } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { UserRoles } from '@volontariapp/shared';
import { PostService, PostEntity, CommentService } from '@volontariapp/domain-post';
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
import { CreateCommentCommandDTO } from '../dto/request/command/create-comment.command.dto.js';
import { DeleteCommentCommandDTO } from '../dto/request/command/delete-comment.command.dto.js';
import {
  CreateCommentResponseDTO,
  DeleteCommentResponseDTO as CommentDeleteResponseDTO,
} from '../dto/response/comment.response.dto.js';

@Controller()
export class PostCommandController {
  private readonly logger = new Logger({
    context: PostCommandController.name,
  });

  constructor(
    private readonly postTransformer: PostTransformer,
    private readonly postService: PostService,
    private readonly commentService: CommentService,
  ) {}

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.CREATE_POST)
  async createPost(
    @Payload() data: CreatePostCommandDTO,
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
  async updatePost(
    @Payload() data: UpdatePostCommandDTO,
    @CurrentUser() user: AuthUser,
  ): Promise<UpdatePostResponseDTO> {
    const postId = data.post.id;
    if (!postId) {
      throw new Error('Post id is required for update');
    }

    this.logger.log(`gRPC: Updating post with id: ${postId}`);

    const updateData: Partial<PostEntity> = {};
    updateData.title = data.post.title;
    updateData.content = data.post.content;

    const entity = await this.postService.update(
      postId,
      updateData,
      user.id,
      user.role as UserRoles,
    );
    const response = new UpdatePostResponseDTO();
    response.post = this.postTransformer.toPostDTO(entity);
    return response;
  }

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.DELETE_POST)
  async deletePost(
    @Payload() data: DeletePostCommandDTO,
    @CurrentUser() user: AuthUser,
  ): Promise<DeletePostResponseDTO> {
    this.logger.log(`gRPC: Deleting post with id: ${data.id}`);
    await this.postService.delete(data.id, user.id, user.role as UserRoles);
    const response = new DeletePostResponseDTO();
    response.success = true;
    return response;
  }

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, 'CreateComment')
  async createComment(
    @Payload() data: CreateCommentCommandDTO,
    @CurrentUser() user: AuthUser,
  ): Promise<CreateCommentResponseDTO> {
    this.logger.log(`gRPC: Creating comment on post: ${data.postId} by user: ${user.id}`);
    const entity = await this.commentService.create(
      this.postTransformer.fromCreateCommentCommand(data, user.id),
    );
    const response = new CreateCommentResponseDTO();
    response.comment = this.postTransformer.toCommentDTO(entity);
    return response;
  }

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, 'DeleteComment')
  async deleteComment(
    @Payload() data: DeleteCommentCommandDTO,
    @CurrentUser() user: AuthUser,
  ): Promise<CommentDeleteResponseDTO> {
    this.logger.log(`gRPC: Deleting comment with id: ${data.id}`);

    const existing = await this.commentService.findById(data.id);
    if (!existing) {
      throw POST_NOT_FOUND(`Comment with id ${data.id}`);
    }

    await this.commentService.delete(data.id, user.id, user.role as UserRoles);
    const response = new CommentDeleteResponseDTO();
    response.success = true;
    return response;
  }
}
