import { Module } from '@nestjs/common';
import { PostCommandController } from './controllers/post.command.controller.js';
import { PostQueryController } from './controllers/post.query.controller.js';
import { PostTransformer } from './transformers/index.js';
import { PostService, CommentService, PostgresCommentRepository } from '@volontariapp/domain-post';
import { PostgresPostRepository } from '@volontariapp/domain-post';
import { SocialEventPostLinkQueryClientService } from './clients/social-event-post.query-client.js';
import { StorageClientModule } from '@volontariapp/storage-client';
import { AppConfigService } from '../../config/app-config.service.js';

@Module({
  imports: [
    StorageClientModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (rawConfig: unknown) => {
        const config = rawConfig as AppConfigService;
        return {
          url: config.msStorageUrl,
          timeoutMs: 2000,
        };
      },
    }),
  ],
  controllers: [PostCommandController, PostQueryController],
  providers: [
    PostgresCommentRepository,
    PostgresPostRepository,
    PostService,
    CommentService,
    PostTransformer,
    SocialEventPostLinkQueryClientService,
  ],
  exports: [PostService, CommentService, PostTransformer, SocialEventPostLinkQueryClientService],
})
export class PostModule {}
