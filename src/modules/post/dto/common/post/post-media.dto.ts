import type { PostMedia } from '@volontariapp/contracts-nest';
import { IsInt, IsUUID, Min } from 'class-validator';

export class PostMediaDTO implements PostMedia {
  @IsUUID()
  fileId!: string;

  @IsInt()
  @Min(0)
  position!: number;
}
