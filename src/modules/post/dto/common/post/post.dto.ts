import { Post } from '@volontariapp/contracts-nest';

import { TimestampDTO } from '../timestamp.dto.js';
import { IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PostDTO implements Post {
  @IsUUID()
  id!: string;

  @IsUUID()
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
}
