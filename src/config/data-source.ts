import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { CustomConfig } from './base-config.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

import { loadConfig } from '@volontariapp/config';
import { EventQueueModel, JobsOutboxModel } from '@volontariapp/database';

function resolveConfigDirectory(): string {
  const currentFileDir = dirname(fileURLToPath(import.meta.url));
  const repositoryRootDir = join(currentFileDir, '..', '..');
  const rootConfigDir = join(repositoryRootDir, 'config');
  if (existsSync(rootConfigDir)) {
    return rootConfigDir;
  }
  throw new Error(`Config directory not found: ${rootConfigDir}`);
}

const appConfig = loadConfig(resolveConfigDirectory(), CustomConfig);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: appConfig.db.host,
  port: appConfig.db.port,
  username: appConfig.db.username,
  password: appConfig.db.password,
  database: appConfig.db.database,
  ssl: appConfig.db.ssl ? { rejectUnauthorized: false } : false,
  entities: [EventQueueModel, JobsOutboxModel],
  migrations: [join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations', '*.ts')],
  synchronize: false,
});
