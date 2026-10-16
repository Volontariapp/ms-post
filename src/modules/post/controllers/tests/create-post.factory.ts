import {
  FileStatus,
  ScanStatus,
  ValidationMode,
  type ConfirmFileAttachmentResponse,
  type FileMetadata,
} from '@volontariapp/contracts-nest';
import { PostEntity, PostMediaStatus } from '@volontariapp/domain-post';
import { SagaStatus } from '@volontariapp/shared';
import type { CreatePostCommandDTO } from '../../dto/request/command/create-post.command.dto.js';

export class CreatePostFactory {
  static createCommand(overrides: Partial<CreatePostCommandDTO> = {}): CreatePostCommandDTO {
    return {
      title: overrides.title ?? 'Post Title',
      content: overrides.content ?? 'Post Content',
      fileIds: overrides.fileIds ?? [],
      idempotencyKey: overrides.idempotencyKey ?? 'key-default',
    };
  }

  static createFileMetadata(overrides: Partial<FileMetadata> = {}): FileMetadata {
    return {
      id: overrides.id ?? 'default-file-id',
      ownerId: overrides.ownerId ?? 'default-owner-id',
      objectKey: overrides.objectKey ?? 'post/file.webp',
      mimeType: overrides.mimeType ?? 'image/jpeg',
      status: overrides.status ?? FileStatus.FILE_STATUS_ATTACHED,
      validationMode: overrides.validationMode ?? ValidationMode.VALIDATION_MODE_SYNC,
      isPublic: overrides.isPublic ?? true,
      uploadExpiresAt: overrides.uploadExpiresAt,
      createdAt: overrides.createdAt,
      updatedAt: overrides.updatedAt,
      scanStatus: overrides.scanStatus ?? ScanStatus.SCAN_STATUS_CLEAN,
      rejectionReason: overrides.rejectionReason,
      publicUrl: overrides.publicUrl,
      entityType: overrides.entityType,
      entityId: overrides.entityId,
    };
  }

  static createConfirmResponse(files: FileMetadata[]): ConfirmFileAttachmentResponse {
    return { success: true, updatedCount: files.length, files };
  }

  static createPostEntity(overrides: Partial<PostEntity> = {}): PostEntity {
    const post = new PostEntity();
    post.id = overrides.id ?? 'default-post-id';
    post.authorId = overrides.authorId ?? 'default-author-id';
    post.title = overrides.title ?? 'default-title';
    post.content = overrides.content ?? 'default-content';
    post.saga_status = overrides.saga_status ?? SagaStatus.PENDING;
    post.media_status = overrides.media_status ?? PostMediaStatus.NONE;
    post.media = overrides.media ?? [];
    post.createdAt = overrides.createdAt ?? new Date();
    post.updatedAt = overrides.updatedAt ?? new Date();
    return post;
  }
}
