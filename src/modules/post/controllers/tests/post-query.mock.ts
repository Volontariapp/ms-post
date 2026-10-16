export interface MockPostQueryService {
  findById: jest.Mock;
  listPosts: jest.Mock;
}

export interface MockCommentQueryService {
  listPaginatedByPostId: jest.Mock;
}

export interface MockSocialEventPostClient {
  getEventRelatedToPost: jest.Mock;
  getEventsRelatedToPosts: jest.Mock;
}

export const createMockPostQueryService = (): MockPostQueryService => ({
  findById: jest.fn(),
  listPosts: jest.fn(),
});

export const createMockCommentQueryService = (): MockCommentQueryService => ({
  listPaginatedByPostId: jest.fn(),
});

export const createMockSocialEventPostClient = (): MockSocialEventPostClient => ({
  getEventRelatedToPost: jest.fn(),
  getEventsRelatedToPosts: jest.fn(),
});
