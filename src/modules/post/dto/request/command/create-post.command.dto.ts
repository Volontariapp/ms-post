import { CreatePostCommand } from '@volontariapp/contracts-nest';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePostCommandDTO implements CreatePostCommand {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  fileIds: string[] = [];

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}
