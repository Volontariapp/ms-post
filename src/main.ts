import './tracing.js';
import 'reflect-metadata';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { GRPC_SERVICES, getGrpcOptions } from '@volontariapp/contracts';
import { AppConfigService } from './config/app-config.service.js';
import { loadConfig } from '@volontariapp/config';
import { CustomConfig } from './config/base-config.js';
import { Logger } from '@volontariapp/logger';

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
  const logger = new Logger({ context: 'MS-POST', format: 'json' });
  logger.debug(`app config: ${JSON.stringify(appConfig)}`);
  const app = await NestFactory.create(AppModule.register(appConfig), {
    logger,
  });
  app.useLogger(logger);
  const configService = app.get(AppConfigService);

  app.connectMicroservice(
    getGrpcOptions(
      GRPC_SERVICES.POST,
      configService.config.microServices.msPostUrl,
    ),
  );

  await app.startAllMicroservices();
  await app.listen(configService.config.port);
}
void bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
