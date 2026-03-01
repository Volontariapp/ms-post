import { Module } from '@nestjs/common';
import { PostController } from './post.controller.js';
import { PostGrpcController } from './post.grpc.controller.js';

@Module({
  controllers: [PostController, PostGrpcController],
})
export class PostModule {}
