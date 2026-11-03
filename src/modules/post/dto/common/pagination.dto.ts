import type { PaginationRequest } from '@volontariapp/contracts-nest';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

/**
 * Plafond de taille de page accepte par ListPosts et ListComments.
 * 1000 et non 100: la gateway appelle certains ms avec limit 1000.
 * A abaisser plus tard une fois ces appelants migres.
 */
export const MAX_PAGINATION_LIMIT = 100;

export class PaginationRequestDTO implements PaginationRequest {
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page!: number;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(MAX_PAGINATION_LIMIT)
  limit!: number;
}
