import { CreatePostCommand } from '@volontariapp/contracts-nest';
import { IsString } from 'class-validator';

export class CreatePostCommandDTO implements CreatePostCommand {
  @IsString()
  content!: string;

  @IsString()
  authorId!: string;

  @IsString()
  eventId!: string;
}
