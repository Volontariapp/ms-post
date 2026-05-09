import { DeletePostCommand } from '@volontariapp/contracts-nest';
import { IsUUID } from 'class-validator';

export class DeletePostCommandDTO implements DeletePostCommand {
  @IsUUID()
  id!: string;
}
