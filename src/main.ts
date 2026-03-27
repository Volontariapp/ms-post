import './tracing.js';
import 'reflect-metadata';
import { dirname, join } from 'path';
import { createRequire } from 'module';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppConfigService } from './config/app-config.service.js';

const require = createRequire(import.meta.url);

const contractsPath = dirname(
  require.resolve('@volontariapp/contracts/package.json'),
);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(AppConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'volontariapp.post',
      protoPath: join(
        contractsPath,
        'proto/volontariapp/post/post.services.proto',
      ),
      url: configService.msPostUrl,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [join(contractsPath, 'proto')],
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
