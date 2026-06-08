import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  EVENT_POST_LINK_QUERY_SERVICE_NAME,
  EventPostLinkQueryServiceClient,
  GetEventRelatedToPostQuery,
  GetEventRelatedToPostResponse,
  GetEventsRelatedToPostsQuery,
  GetEventsRelatedToPostsResponse,
} from '@volontariapp/contracts-nest';
import { firstValueFrom, Observable } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { Logger } from '@volontariapp/logger';

interface QueryServiceWithMetadata extends EventPostLinkQueryServiceClient {
  getEventRelatedToPost(
    request: GetEventRelatedToPostQuery,
    metadata?: Metadata,
  ): Observable<GetEventRelatedToPostResponse>;
  getEventsRelatedToPosts(
    request: GetEventsRelatedToPostsQuery,
    metadata?: Metadata,
  ): Observable<GetEventsRelatedToPostsResponse>;
}

@Injectable()
export class SocialEventPostLinkQueryClientService implements OnModuleInit {
  private readonly logger = new Logger({ context: SocialEventPostLinkQueryClientService.name });
  private queryService!: QueryServiceWithMetadata;

  constructor(@Inject(SOCIAL_PACKAGE) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.queryService = this.client.getService<EventPostLinkQueryServiceClient>(
      EVENT_POST_LINK_QUERY_SERVICE_NAME,
    ) as QueryServiceWithMetadata;
    this.logger.log('SocialEventPostLinkQueryClientService initialized');
  }

  async getEventRelatedToPost(postId: string, token: string): Promise<string | null> {
    this.logger.debug(`Calling getEventRelatedToPost with postId=${postId}`);
    const request: GetEventRelatedToPostQuery = { postId };

    const outboundMetadata = new Metadata();
    if (token) {
      outboundMetadata.set('x-internal-token', token);
    }

    try {
      const response: GetEventRelatedToPostResponse = await firstValueFrom(
        this.queryService.getEventRelatedToPost(request, outboundMetadata),
      );
      return response.eventId || null;
    } catch (err) {
      this.logger.error(`Error fetching related event for post ${postId}`, err as Error);
      return null;
    }
  }

  async getEventsRelatedToPosts(postIds: string[], token: string): Promise<Record<string, string>> {
    this.logger.debug(`Calling getEventsRelatedToPosts for ${String(postIds.length)} posts`);
    if (postIds.length === 0) return {};

    const request: GetEventsRelatedToPostsQuery = { postIds };

    const outboundMetadata = new Metadata();
    if (token) {
      outboundMetadata.set('x-internal-token', token);
    }

    try {
      const response: GetEventsRelatedToPostsResponse = await firstValueFrom(
        this.queryService.getEventsRelatedToPosts(request, outboundMetadata),
      );

      const map: Record<string, string> = {};
      for (const link of response.links) {
        map[link.postId] = link.eventId;
      }
      return map;
    } catch (err) {
      this.logger.error(`Error fetching related events for batch posts`, err as Error);
      return {};
    }
  }
}
