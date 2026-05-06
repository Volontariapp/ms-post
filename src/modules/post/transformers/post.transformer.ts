import { Injectable } from '@nestjs/common';
import { PostDTO } from '../dto/common/post/post.dto.js';
import { CreatePostCommandDTO } from '../dto/request/command/create-post.command.dto.js';

@Injectable()
export class PostTransformer {
  /**
   * CreatePostCommandDTO → PostEntity
   */
  fromCreateCommand(dto: CreatePostCommandDTO): any {
    return {};
  }

  /**
   * PostEntity → PostDTO
   */
  toPostDTO(entity: any): PostDTO {
    return new PostDTO();
  }
}
