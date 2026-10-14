import { Injectable, Module } from '@nestjs/common';
import {
  STORAGE_CLIENT_OPTIONS,
  type StorageClientOptions,
  type StorageClientOptionsFactory,
} from '@volontariapp/storage-client';
import { AppConfigService } from '../../config/app-config.service.js';

@Injectable()
export class StorageClientConfigService implements StorageClientOptionsFactory {
  constructor(private readonly appConfigService: AppConfigService) {}

  createStorageClientOptions(): StorageClientOptions {
    return {
      url: this.appConfigService.msStorageUrl,
      timeoutMs: 2000,
    };
  }
}

@Module({
  providers: [
    StorageClientConfigService,
    {
      provide: STORAGE_CLIENT_OPTIONS,
      inject: [StorageClientConfigService],
      useFactory: (factory: StorageClientConfigService): StorageClientOptions =>
        factory.createStorageClientOptions(),
    },
  ],
  exports: [StorageClientConfigService, STORAGE_CLIENT_OPTIONS],
})
export class StorageClientConfigModule {}
