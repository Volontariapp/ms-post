import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostCommandController } from './controllers/post.command.controller.js';
import { PostQueryController } from './controllers/post.query.controller.js';
import { PostTransformer } from './transformers/index.js';
import {
  PostService,
  PostModel,
  CommentService,
  CommentModel,
  PostgresCommentRepository,
} from '@volontariapp/domain-post';
import { PostgresPostRepository } from '@volontariapp/domain-post';

@Module({
  imports: [TypeOrmModule.forFeature([PostModel, CommentModel])],
  controllers: [PostCommandController, PostQueryController],
  providers: [
    { provide: 'IPostRepository', useClass: PostgresPostRepository },
    { provide: 'ICommentRepository', useClass: PostgresCommentRepository },
    PostgresPostRepository,
    PostgresCommentRepository,
    PostService,
    CommentService,
    PostTransformer,
  ],
  exports: [PostService, CommentService, PostTransformer],
})
export class PostModule {}
