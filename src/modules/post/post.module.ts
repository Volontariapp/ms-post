import { Module } from '@nestjs/common';
import { PostCommandController } from './controllers/post.command.controller.js';
import { PostQueryController } from './controllers/post.query.controller.js';
import { PostTransformer } from './transformers/index.js';
import { PostService, CommentService, PostgresCommentRepository } from '@volontariapp/domain-post';
import { PostgresPostRepository } from '@volontariapp/domain-post';

@Module({
  controllers: [PostCommandController, PostQueryController],
  providers: [
    PostgresCommentRepository,
    PostgresPostRepository,
    PostService,
    CommentService,
    PostTransformer,
  ],
  exports: [PostService, CommentService, PostTransformer],
})
export class PostModule {}
