import { BackendConfig, PostgresConfig, MSURLsConfig } from '@volontariapp/config';
import { Type } from 'class-transformer';
import { IsDefined, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class ExtendedMSURLsConfig extends MSURLsConfig {
  @IsString()
  msStorageUrl!: string;
}

export class CustomConfig extends BackendConfig {
  @IsDefined()
  @Type(() => Number)
  declare port: number;

  @IsDefined()
  @ValidateNested()
  @Type(() => ExtendedMSURLsConfig)
  declare microServices: ExtendedMSURLsConfig;

  @IsDefined()
  @ValidateNested()
  @Type(() => PostgresConfig)
  db!: PostgresConfig;

  @IsOptional()
  @IsUUID()
  postIdNamespace?: string;
}
