import type { Post } from '@volontariapp/contracts-nest';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdatePostDataDTO implements Partial<Post> {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsUUID()
  authorId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
