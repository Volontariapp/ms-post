import {
  FileStatus,
  ScanStatus,
  ValidationMode,
  type ConfirmFileAttachmentResponse,
  type FileMetadata,
} from '@volontariapp/contracts-nest';
import {
  PostEntity,
  PostMediaEntity,
  PostMediaScanStatus,
  PostMediaStatus,
} from '@volontariapp/domain-post';
import { SagaStatus } from '@volontariapp/shared';
import type { ScanStatusOnWire } from '../post.command.controller.js';
import type { CreatePostCommandDTO } from '../../dto/request/command/create-post.command.dto.js';

export class PostCommandFactory {
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

  /**
   * Reponse telle que le client gRPC la decode (`enums: String` dans getGrpcOptions) :
   * le statut de scan est un nom ('SCAN_STATUS_CLEAN'), pas le nombre des types generes.
   */
  static createConfirmResponseOnWire(
    files: { id: string; scanStatus: ScanStatusOnWire }[],
  ): ConfirmFileAttachmentResponse {
    const metadata = files.map((file) =>
      Object.assign(PostCommandFactory.createFileMetadata({ id: file.id }), {
        scanStatus: file.scanStatus,
      }),
    );
    return { success: true, updatedCount: metadata.length, files: metadata };
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
    if (overrides.eventId) {
      post.eventId = overrides.eventId;
    }
    return post;
  }

  static createPostMedia(overrides: Partial<PostMediaEntity> = {}): PostMediaEntity {
    const media = new PostMediaEntity();
    media.id = overrides.id ?? 'default-media-id';
    media.postId = overrides.postId ?? 'default-post-id';
    media.fileId = overrides.fileId ?? 'default-file-id';
    media.position = overrides.position ?? 0;
    media.scanStatus = overrides.scanStatus ?? PostMediaScanStatus.CLEAN;
    return media;
  }
}
