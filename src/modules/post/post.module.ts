import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostCommandController } from './controllers/post.command.controller.js';
import { PostQueryController } from './controllers/post.query.controller.js';
import { PostTransformer } from './transformers/index.js';
import { PostService, PostModel } from '@volontariapp/domain-post';
import { PostgresPostRepository } from '@volontariapp/domain-post';

@Module({
  imports: [TypeOrmModule.forFeature([PostModel])],
  controllers: [PostCommandController, PostQueryController],
  providers: [PostgresPostRepository, PostService, PostTransformer],
  exports: [PostService, PostTransformer],
})
export class PostModule {}
