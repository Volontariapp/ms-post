import type { DeleteCommentCommand } from '@volontariapp/contracts-nest';

import { IsUUID } from 'class-validator';

export class DeleteCommentCommandDTO implements DeleteCommentCommand {
  @IsUUID(4)
  id!: string;

  @IsUUID(4)
  postId!: string;
}
