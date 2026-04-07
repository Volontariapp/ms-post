import './tracing.js';
import 'reflect-metadata';
import { existsSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { GRPC_SERVICES, getGrpcOptions } from '@volontariapp/contracts';
import { AppConfigService } from './config/app-config.service.js';
import { loadConfig } from '@volontariapp/config';
import { CustomConfig } from './config/base-config.js';

function resolveConfigDirectory(): string {
  const rootConfigDir = join(process.cwd(), 'config');
  if (existsSync(rootConfigDir)) {
    return rootConfigDir;
  }

  return join(process.cwd(), 'src/config');
}

async function bootstrap() {
  const appConfig = loadConfig(resolveConfigDirectory(), CustomConfig);
  console.log(`app config: ${JSON.stringify(appConfig)}`);
  const app = await NestFactory.create(AppModule.register(appConfig));
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
bootstrap();
