import { jest } from '@jest/globals';
import type {
  GetEventRelatedToPostResponse,
  GetEventsRelatedToPostsResponse,
} from '@volontariapp/contracts-nest';
import type { Observable } from 'rxjs';

export interface MockEventPostLinkQueryService {
  getEventRelatedToPost: jest.Mock<() => Observable<GetEventRelatedToPostResponse>>;
  getEventsRelatedToPosts: jest.Mock<
    (request: { postIds: string[] }) => Observable<GetEventsRelatedToPostsResponse>
  >;
}

export interface MockSocialGrpcClient {
  getService: jest.Mock<() => MockEventPostLinkQueryService>;
  getClientByServiceName: jest.Mock<() => MockEventPostLinkQueryService>;
}

/** gRPC client of ms-social whose EventPostLinkQueryService is the returned query service mock. */
export const createSocialGrpcClientMock = (): {
  client: MockSocialGrpcClient;
  queryService: MockEventPostLinkQueryService;
} => {
  const queryService: MockEventPostLinkQueryService = {
    getEventRelatedToPost: jest.fn<() => Observable<GetEventRelatedToPostResponse>>(),
    getEventsRelatedToPosts:
      jest.fn<(request: { postIds: string[] }) => Observable<GetEventsRelatedToPostsResponse>>(),
  };
  const client: MockSocialGrpcClient = {
    getService: jest.fn(() => queryService),
    getClientByServiceName: jest.fn(() => queryService),
  };
  return { client, queryService };
};
