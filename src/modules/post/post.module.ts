import { Module } from '@nestjs/common';
import { PostCommandController } from './controllers/post.command.controller.js';
import { PostQueryController } from './controllers/post.query.controller.js';
import { PostTransformer } from './transformers/index.js';
import { PostService, CommentService, PostgresCommentRepository } from '@volontariapp/domain-post';
import { PostgresPostRepository } from '@volontariapp/domain-post';
import { SocialEventPostLinkQueryClientService } from './clients/social-event-post.query-client.js';
import { PostsTotalCache } from './providers/posts-total-cache.provider.js';
import { CacheStatsModule } from '../../common/cache/cache-stats.module.js';
import { CacheStatsReporter } from '../../common/cache/cache-stats.reporter.js';
import { StorageClientModule } from '@volontariapp/storage-client';
import {
  StorageClientConfigModule,
  StorageClientConfigService,
} from './storage-client-config.module.js';

@Module({
  imports: [
    CacheStatsModule,
    StorageClientModule.registerAsync({
      imports: [StorageClientConfigModule],
      useExisting: StorageClientConfigService,
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
    {
      provide: PostsTotalCache,
      inject: [CacheStatsReporter],
      useFactory: (reporter: CacheStatsReporter): PostsTotalCache => {
        const cache = new PostsTotalCache();
        reporter.register(cache);
        return cache;
      },
    },
  ],
  exports: [PostService, CommentService, PostTransformer, SocialEventPostLinkQueryClientService],
})
export class PostModule {}
