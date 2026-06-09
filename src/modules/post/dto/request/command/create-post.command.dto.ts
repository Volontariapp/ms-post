import { CreatePostCommand } from '@volontariapp/contracts-nest';
import { IsOptional, IsString } from 'class-validator';

export class CreatePostCommandDTO implements CreatePostCommand {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  eventId?: string;
}
