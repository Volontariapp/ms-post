import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import type { Timestamp } from '@volontariapp/contracts-nest';

export class TimestampDTO implements Timestamp {
  @IsNumber()
  @Type(() => Number)
  seconds!: number;

  @IsNumber()
  @Type(() => Number)
  nanos!: number;
}
