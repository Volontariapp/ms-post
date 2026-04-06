import './tracing.js';
import 'reflect-metadata';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { createRequire } from 'module';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppConfigService } from './config/app-config.service.js';
import { loadConfig } from '@volontariapp/config';
import { CustomConfig } from './config/base-config.js';

const require = createRequire(import.meta.url);

const contractsPath = dirname(
  require.resolve('@volontariapp/contracts/package.json'),
);

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

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'volontariapp.post',
      protoPath: join(
        contractsPath,
        'proto/volontariapp/post/post.services.proto',
      ),
      url: configService.config.microServices.msPostUrl,
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
  await app.listen(configService.config.port);
}
bootstrap();
