import { CreatePostCommand } from '@volontariapp/contracts-nest';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePostCommandDTO implements CreatePostCommand {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  fileIds?: string[];
}

