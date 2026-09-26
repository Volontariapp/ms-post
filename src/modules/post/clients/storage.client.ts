import { Inject, Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { STORAGE_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  STORAGE_SERVICE_NAME,
  type StorageServiceClient,
  type VerifyFilesExistResponse,
} from '@volontariapp/contracts-nest';


import { Logger } from '@volontariapp/logger';

@Injectable()
export class StorageClientService implements OnModuleInit {
  private readonly logger = new Logger({ context: StorageClientService.name });
  private storageService!: StorageServiceClient;

  constructor(@Inject(STORAGE_PACKAGE) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.storageService = this.client.getService<StorageServiceClient>(STORAGE_SERVICE_NAME);
    this.logger.log('StorageClientService initialized');
  }

  async verifyFilesExist(fileIds: string[]): Promise<void> {
    if (!fileIds || fileIds.length === 0) return;

    this.logger.debug(`Verifying existence of ${String(fileIds.length)} file_ids`);
    try {
      const response: VerifyFilesExistResponse = await firstValueFrom(
        this.storageService.verifyFilesExist({ fileIds }),
      );

      if (!response.allExist) {
        const missing = response.missingFileIds ? response.missingFileIds.join(', ') : 'inconnu';
        throw new BadRequestException(`Le(s) fichier(s) spécifié(s) n'existe(nt) pas dans ms-storage: ${missing}`);
      }
    } catch (err: unknown) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      const errorObj = err as { code?: number; status?: number; statusCode?: number };
      if (errorObj?.code === 5 || errorObj?.status === 5 || errorObj?.statusCode === 404) {
        throw new BadRequestException(`Le(s) fichier(s) spécifié(s) n'existe(nt) pas dans ms-storage`);
      }
      this.logger.error('Failed to verify files existence in ms-storage', err as Error);
      throw err;
    }
  }
}
