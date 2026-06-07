import { UpdatePostCommand, type Post } from '@volontariapp/contracts-nest';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { UpdatePostDataDTO } from '../../common/post/update-post-data.dto.js';

export class UpdatePostCommandDTO implements UpdatePostCommand {
  @IsArray()
  @IsString({ each: true })
  updateMask!: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePostDataDTO)
  post!: Post;
}
