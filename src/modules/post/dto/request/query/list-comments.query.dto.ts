import type { ListCommentsQuery, ListCommentsByAuthorQuery } from '@volontariapp/contracts-nest';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { PaginationRequestDTO } from '../../common/pagination.dto.js';
import { TimestampDTO } from '../../common/timestamp.dto.js';

export class ListCommentsQueryDTO implements ListCommentsQuery {
  @IsUUID()
  postId!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationRequestDTO)
  pagination: PaginationRequestDTO | undefined;
}

export class ListCommentsByAuthorQueryDTO implements ListCommentsByAuthorQuery {
  @IsString()
  authorId!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TimestampDTO)
  since: TimestampDTO | undefined;

  /** 0 means the maximum of 200. */
  @IsInt()
  @Min(0)
  limit!: number;
}
