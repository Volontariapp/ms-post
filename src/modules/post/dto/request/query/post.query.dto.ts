import type {
  GetPostQuery,
  ListPostsQuery,
  ListRecentPostsByAuthorsQuery,
  ListPostsByIdsQuery,
} from '@volontariapp/contracts-nest';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationRequestDTO } from '../../common/pagination.dto.js';
import { TimestampDTO } from '../../common/timestamp.dto.js';

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

export class ListRecentPostsByAuthorsQueryDTO implements ListRecentPostsByAuthorsQuery {
  /** Capped at 200 by the domain. Ignored when allAuthors is true. */
  @IsArray()
  @IsString({ each: true })
  authorIds!: string[];

  @IsBoolean()
  allAuthors!: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => TimestampDTO)
  since: TimestampDTO | undefined;

  /** 0 means no per-author cap beyond the global one. */
  @IsInt()
  @Min(0)
  perAuthorLimit!: number;

  /** 0 means the maximum of 300. */
  @IsInt()
  @Min(0)
  limit!: number;
}

export class ListPostsByIdsQueryDTO implements ListPostsByIdsQuery {
  /** Capped at 100 by the domain. */
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}
