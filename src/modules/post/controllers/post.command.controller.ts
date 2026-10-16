import { Controller } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { GRPC_SERVICES, POST_METHODS, ScanStatus } from '@volontariapp/contracts-nest';
import { POST_NOT_FOUND, POST_ALREADY_EXISTS } from '@volontariapp/errors-nest';
import { CurrentUser, InternalToken } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { UserRoles } from '@volontariapp/shared';
import {
  PostService,
  PostEntity,
  CommentService,
  PostMediaStatus,
  PostMediaScanStatus,
} from '@volontariapp/domain-post';
import { isBaseError } from '@volontariapp/errors';
import { StorageClientService, isStorageUnavailable } from '@volontariapp/storage-client';
import { v5 as uuidv5 } from 'uuid';
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
import { AppConfigService } from '../../../config/app-config.service.js';

@Controller()
export class PostCommandController {
  private readonly logger = new Logger({
    context: PostCommandController.name,
  });

  constructor(
    private readonly postTransformer: PostTransformer,
    private readonly postService: PostService,
    private readonly commentService: CommentService,
    private readonly storageClientService: StorageClientService,
    private readonly appConfigService: AppConfigService,
  ) {}

  @GrpcMethod(GRPC_SERVICES.POST_SERVICE, POST_METHODS.CREATE_POST)
  async createPost(
    @Payload() data: CreatePostCommandDTO,
    @CurrentUser() user: AuthUser,
    @InternalToken() internalToken?: string,
  ): Promise<CreatePostResponseDTO> {
    const postId = uuidv5(
      `${user.id}:${data.idempotencyKey}`,
      this.appConfigService.postIdNamespace,
    );
    this.logger.log(
      `gRPC: Creating post with id: ${postId}, title: ${data.title} by user: ${user.id}`,
    );

    let fileScanStatuses: Record<string, PostMediaScanStatus> | undefined;
    let mediaStatus: PostMediaStatus | undefined =
      data.fileIds.length === 0 ? PostMediaStatus.NONE : undefined;

    if (data.fileIds.length > 0) {
      try {
        const response = await this.storageClientService.confirmPostAttachment(
          postId,
          data.fileIds,
          internalToken ? { internalToken } : undefined,
        );
        fileScanStatuses = {};
        for (const file of response.files) {
          fileScanStatuses[file.id] = this.mapScanStatus(file.scanStatus);
        }
      } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : String(error);
        if (isStorageUnavailable(error)) {
          this.logger.warn(
            `ms-storage unavailable for post ${postId}, falling back asynchronously with media_status=PENDING: ${reason}`,
          );
          mediaStatus = PostMediaStatus.PENDING;
        } else {
          this.logger.error(`Failed to confirm file attachment for post ${postId}: ${reason}`);
          throw error;
        }
      }
    }

    const postEntity = this.postTransformer.fromCreateCommand(data, user.id, postId);
    postEntity.id = postId;
    let createdEntity: PostEntity;
    try {
      createdEntity = await this.postService.create(
        Object.assign(postEntity, {
          fileIds: data.fileIds,
          fileScanStatuses,
          media_status: mediaStatus,
        }),
      );
    } catch (error: unknown) {
      if (isBaseError(error) && error.message.includes('failed to insert but was not found')) {
        throw POST_ALREADY_EXISTS(data.title);
      }
      throw error;
    }

    const response = new CreatePostResponseDTO();
    response.post = this.postTransformer.toPostDTO(createdEntity);
    return response;
  }

  private mapScanStatus(status: ScanStatus): PostMediaScanStatus {
    switch (status) {
      case ScanStatus.SCAN_STATUS_CLEAN:
        return PostMediaScanStatus.CLEAN;
      case ScanStatus.SCAN_STATUS_REJECTED:
        return PostMediaScanStatus.REJECTED;
      case ScanStatus.SCAN_STATUS_SCANNING:
        return PostMediaScanStatus.SCANNING;
      case ScanStatus.SCAN_STATUS_AWAITING_UPLOAD:
      case ScanStatus.SCAN_STATUS_UNSPECIFIED:
      default:
        return PostMediaScanStatus.AWAITING_UPLOAD;
    }
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
