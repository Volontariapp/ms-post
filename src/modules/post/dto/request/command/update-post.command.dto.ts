import { UpdatePostCommand } from '@volontariapp/contracts-nest';
import { IsString, IsOptional } from 'class-validator';

export class UpdatePostCommandDTO implements UpdatePostCommand {
  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  content?: string;
}
