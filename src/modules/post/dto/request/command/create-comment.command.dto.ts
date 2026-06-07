import type { CreateCommentCommand } from '@volontariapp/contracts-nest';

import { IsString, IsUUID } from 'class-validator';

export class CreateCommentCommandDTO implements CreateCommentCommand {
  @IsUUID(4)
  postId!: string;

  @IsString()
  content!: string;
}
