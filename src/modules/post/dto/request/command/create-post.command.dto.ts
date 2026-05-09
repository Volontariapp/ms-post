import { CreatePostCommand } from '@volontariapp/contracts-nest';
import { IsString } from 'class-validator';

export class CreatePostCommandDTO implements CreatePostCommand {
  @IsString()
  title!: string;

  @IsString()
  content!: string;
}
