import { Module } from '@nestjs/common';
import { PostCommandController } from './controllers/post.command.controller.js';
import { PostQueryController } from './controllers/post.query.controller.js';
import { PostTransformer } from './transformers/index.js';

@Module({
  controllers: [PostCommandController, PostQueryController],
  providers: [PostTransformer],
  exports: [PostTransformer],
})
export class PostModule {}
