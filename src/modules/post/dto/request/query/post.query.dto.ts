import type { GetPostQuery, ListPostsQuery } from '@volontariapp/contracts-nest';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { PaginationRequestDTO } from '../../common/pagination.dto.js';

export class PostQueryDTO implements GetPostQuery {
  @IsUUID()
  id!: string;
}

export class ListPostsQueryDTO implements ListPostsQuery {
  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationRequestDTO)
  pagination: PaginationRequestDTO | undefined;

  @IsOptional()
  @IsString()
  authorId?: string;
}
