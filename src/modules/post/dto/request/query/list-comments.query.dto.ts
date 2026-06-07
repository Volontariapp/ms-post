import type { ListCommentsQuery } from '@volontariapp/contracts-nest';
import { Type } from 'class-transformer';
import { IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { PaginationRequestDTO } from '../../common/pagination.dto.js';

export class ListCommentsQueryDTO implements ListCommentsQuery {
  @IsUUID(4)
  postId!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationRequestDTO)
  pagination: PaginationRequestDTO | undefined;
}
