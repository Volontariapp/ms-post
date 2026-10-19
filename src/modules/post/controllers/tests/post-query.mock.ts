export interface MockPostQueryService {
  findById: jest.Mock;
  listPosts: jest.Mock;
  listRecentByAuthors: jest.Mock;
  listByIds: jest.Mock;
}

export interface MockCommentQueryService {
  listPaginatedByPostId: jest.Mock;
  listByAuthor: jest.Mock;
}

export interface MockSocialEventPostClient {
  getEventRelatedToPost: jest.Mock;
  getEventsRelatedToPosts: jest.Mock;
}

export const createMockPostQueryService = (): MockPostQueryService => ({
  findById: jest.fn(),
  listPosts: jest.fn(),
  listRecentByAuthors: jest.fn(),
  listByIds: jest.fn(),
});

export const createMockCommentQueryService = (): MockCommentQueryService => ({
  listPaginatedByPostId: jest.fn(),
  listByAuthor: jest.fn(),
});

export const createMockSocialEventPostClient = (): MockSocialEventPostClient => ({
  getEventRelatedToPost: jest.fn(),
  getEventsRelatedToPosts: jest.fn(),
});
