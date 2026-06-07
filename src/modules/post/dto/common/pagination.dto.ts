import type { PaginationRequest } from '@volontariapp/contracts-nest';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class PaginationRequestDTO implements PaginationRequest {
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page!: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit!: number;
}
