import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { BaseConfig as SharedBaseConfig } from '@volontariapp/config';

export class MSURLs {
  @IsDefined()
  @IsNotEmpty()
  msPostUrl!: string;

  @IsDefined()
  @IsNotEmpty()
  msUserUrl!: string;

  @IsDefined()
  @IsNotEmpty()
  msEventUrl!: string;
}

export class CustomConfig extends SharedBaseConfig {
  @IsDefined()
  @Type(() => Number)
  @IsNumber()
  declare port: number;

  @IsDefined()
  @ValidateNested()
  @Type(() => MSURLs)
  declare microServices: MSURLs;
}
