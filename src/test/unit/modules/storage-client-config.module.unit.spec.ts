import { describe, expect, it } from '@jest/globals';
import { Global, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  StorageClientConfigModule,
  StorageClientConfigService,
} from '../../../modules/post/storage-client-config.module.js';
import { AppConfigService } from '../../../config/app-config.service.js';
import {
  StorageClientModule,
  STORAGE_CLIENT_OPTIONS,
  type StorageClientOptions,
} from '@volontariapp/storage-client';

describe('StorageClientConfigModule', () => {
  it('should create storage options from AppConfigService', () => {
    const mockAppConfigService = {
      msStorageUrl: 'ms-storage:50055',
    } as AppConfigService;

    const service = new StorageClientConfigService(mockAppConfigService);
    const options = service.createStorageClientOptions();

    expect(options).toEqual({
      url: 'ms-storage:50055',
      timeoutMs: 2000,
    });
  });

  it('should compile StorageClientModule.registerAsync with StorageClientConfigModule', async () => {
    const mockAppConfigService = {
      msStorageUrl: 'ms-storage:50055',
    };

    @Global()
    @Module({
      providers: [
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
        },
      ],
      exports: [AppConfigService],
    })
    class GlobalTestConfigModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [
        GlobalTestConfigModule,
        StorageClientConfigModule,
        StorageClientModule.registerAsync({
          imports: [StorageClientConfigModule],
          useExisting: StorageClientConfigService,
        }),
      ],
    }).compile();

    const options = moduleRef.get<StorageClientOptions>(STORAGE_CLIENT_OPTIONS);
    expect(options).toEqual({
      url: 'ms-storage:50055',
      timeoutMs: 2000,
    });
  });
});
