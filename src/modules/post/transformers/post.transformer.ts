import { Injectable } from '@nestjs/common';
import { Logger } from '@volontariapp/logger';
import { GrpcDateMapper } from '@volontariapp/contracts-nest';
import { PostEntity } from '@volontariapp/domain-post';
import { PostDTO } from '../dto/common/post/post.dto.js';
import { CreatePostCommandDTO } from '../dto/request/command/create-post.command.dto.js';

@Injectable()
export class PostTransformer {
  private readonly logger = new Logger({ context: PostTransformer.name });

  /**
   * CreatePostCommandDTO → PostEntity
   */
  fromCreateCommand(dto: CreatePostCommandDTO, authorId: string): PostEntity {
    const entity = new PostEntity();

    this.logger.debug(`Mapping CreatePostCommandDTO: ${JSON.stringify(dto)}`);

    entity.title = dto.title;
    entity.content = dto.content;
    entity.authorId = authorId;
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

    return dto;
  }
}
