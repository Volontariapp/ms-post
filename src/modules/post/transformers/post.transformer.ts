import { Injectable } from '@nestjs/common';
import { Logger } from '@volontariapp/logger';
import {
  GrpcDateMapper,
  PostMediaStatus as ContractsPostMediaStatus,
} from '@volontariapp/contracts-nest';
import { PostEntity, PostMediaStatus } from '@volontariapp/domain-post';
import { PostDTO } from '../dto/common/post/post.dto.js';
import { PostMediaDTO } from '../dto/common/post/post-media.dto.js';
import { CreatePostCommandDTO } from '../dto/request/command/create-post.command.dto.js';
import { CreateCommentCommandDTO } from '../dto/request/command/create-comment.command.dto.js';
import { CommentEntity } from '@volontariapp/domain-post';
import { CommentDTO } from '../dto/common/post/comment.dto.js';

@Injectable()
export class PostTransformer {
  private readonly logger = new Logger({ context: PostTransformer.name });

  /**
   * CreatePostCommandDTO → PostEntity
   */
  fromCreateCommand(dto: CreatePostCommandDTO, authorId: string, id?: string): PostEntity {
    const entity = new PostEntity();

    this.logger.debug(`Mapping CreatePostCommandDTO: ${JSON.stringify(dto)}`);

    if (id) {
      entity.id = id;
    }
    entity.title = dto.title;
    entity.content = dto.content;
    entity.authorId = authorId;
    entity.eventId = dto.eventId;
    this.logger.log('mapping post', dto);
    return entity;
  }

  /**
   * PostEntity → PostDTO
   */
  toPostDTO(entity: PostEntity): PostDTO {
    const dto = new PostDTO();

    dto.id = entity.id;
    dto.authorId = entity.authorId;
    dto.title = entity.title;
    dto.content = entity.content;
    dto.createdAt = GrpcDateMapper.toTimestamp(entity.createdAt);
    dto.updatedAt = GrpcDateMapper.toTimestamp(entity.updatedAt);
    if (entity.eventId) {
      dto.eventId = entity.eventId;
    }

    dto.media = (entity.media ?? []).map((m) => {
      const mediaDto = new PostMediaDTO();
      mediaDto.fileId = m.fileId;
      mediaDto.position = m.position;
      return mediaDto;
    });

    switch (entity.media_status) {
      case PostMediaStatus.NONE:
        dto.mediaStatus = ContractsPostMediaStatus.POST_MEDIA_STATUS_NONE;
        break;
      case PostMediaStatus.PENDING:
        dto.mediaStatus = ContractsPostMediaStatus.POST_MEDIA_STATUS_PENDING;
        break;
      case PostMediaStatus.READY:
        dto.mediaStatus = ContractsPostMediaStatus.POST_MEDIA_STATUS_READY;
        break;
      case PostMediaStatus.REJECTED:
        dto.mediaStatus = ContractsPostMediaStatus.POST_MEDIA_STATUS_REJECTED;
        break;
      default:
        dto.mediaStatus = ContractsPostMediaStatus.POST_MEDIA_STATUS_NONE;
        break;
    }

    return dto;
  }

  /**
   * CreateCommentCommandDTO → CommentEntity
   */
  fromCreateCommentCommand(dto: CreateCommentCommandDTO, authorId: string): CommentEntity {
    const entity = new CommentEntity();

    this.logger.debug(`Mapping CreateCommentCommandDTO: ${JSON.stringify(dto)}`);

    entity.postId = dto.postId;
    entity.content = dto.content;
    entity.authorId = authorId;
    return entity;
  }

  /**
   * CommentEntity → CommentDTO
   */
  toCommentDTO(entity: CommentEntity): CommentDTO {
    const dto = new CommentDTO();

    dto.id = entity.id;
    dto.postId = entity.postId;
    dto.authorId = entity.authorId;
    dto.content = entity.content;
    dto.createdAt = GrpcDateMapper.toTimestamp(entity.createdAt);
    dto.updatedAt = GrpcDateMapper.toTimestamp(entity.updatedAt);

    return dto;
  }
}
