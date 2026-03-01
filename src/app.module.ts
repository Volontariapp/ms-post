import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './providers/database/database.module';
import { PostModule } from './modules/post/post.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, PostModule],
})
export class AppModule {}
