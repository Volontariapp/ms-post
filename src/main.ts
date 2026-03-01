import './tracing.js';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { MicroserviceOptions } from '@nestjs/microservices';
import { GRPC_SERVICES, getGrpcOptions } from '@volontariapp/contracts';
import { AppConfigService } from './config/app-config.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(AppConfigService);

  app.connectMicroservice<MicroserviceOptions>(
    getGrpcOptions(GRPC_SERVICES.POST, configService.msPostUrl),
  );

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
