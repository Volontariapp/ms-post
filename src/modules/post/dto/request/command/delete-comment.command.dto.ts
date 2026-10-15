import type { DeleteCommentCommand } from '@volontariapp/contracts-nest';

import { IsUUID } from 'class-validator';

export class DeleteCommentCommandDTO implements DeleteCommentCommand {
  @IsUUID()
  id!: string;

  @IsUUID()
  postId!: string;
}
