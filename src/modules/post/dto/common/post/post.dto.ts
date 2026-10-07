import { Post, PostMediaStatus } from '@volontariapp/contracts-nest';

import { TimestampDTO } from '../timestamp.dto.js';
import { PostMediaDTO } from './post-media.dto.js';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PostDTO implements Post {
  @IsUUID()
  id!: string;

  @IsString()
  authorId!: string;

  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TimestampDTO)
  createdAt: TimestampDTO | undefined;

  @IsOptional()
  @ValidateNested()
  @Type(() => TimestampDTO)
  updatedAt: TimestampDTO | undefined;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostMediaDTO)
  media!: PostMediaDTO[];

  @IsEnum(PostMediaStatus)
  mediaStatus!: PostMediaStatus;
}
