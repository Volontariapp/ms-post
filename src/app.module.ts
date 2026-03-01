import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module.js';
import { DatabaseModule } from './providers/database/database.module.js';
import { PostModule } from './modules/post/post.module.js';

@Module({
  imports: [AppConfigModule, DatabaseModule, PostModule],
})
export class AppModule {}
