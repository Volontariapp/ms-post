import './tracing.js';
import 'reflect-metadata';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AppConfigService } from './config/app-config.service.js';
import { loadConfig } from '@volontariapp/config';
import { CustomConfig } from './config/base-config.js';
import { Logger } from '@volontariapp/logger';
import {
  GRPC_MICROSERVICES,
  getGrpcOptions,
} from '@volontariapp/contracts-nest';

function resolveConfigDirectory(): string {
  const currentFileDir = dirname(fileURLToPath(import.meta.url));
  const repositoryRootDir = join(currentFileDir, '..');
  const rootConfigDir = join(repositoryRootDir, 'config');
  if (existsSync(rootConfigDir)) {
    return rootConfigDir;
  }

  throw new Error(`Config directory not found: ${rootConfigDir}`);
}

async function bootstrap() {
  const appConfig = loadConfig(resolveConfigDirectory(), CustomConfig);
  const logger = new Logger({
    context: 'MS-POST',
    format: appConfig.logger.format,
  });
  const app = await NestFactory.create(AppModule.register(appConfig), {
    logger,
  });
  const configService = app.get(AppConfigService);

  app.connectMicroservice(
    getGrpcOptions(
      GRPC_MICROSERVICES.POST,
      configService.config.microServices.msPostUrl,
    ),
    {
      inheritAppConfig: true,
    },
  );

  await app.startAllMicroservices();
  await app.listen(configService.config.port);
}
void bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
