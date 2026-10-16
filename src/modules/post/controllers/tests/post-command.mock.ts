export interface MockPostService {
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

export interface MockCommentService {
  create: jest.Mock;
  delete: jest.Mock;
  findById: jest.Mock;
}

export interface MockStorageClientService {
  confirmPostAttachment: jest.Mock;
}

export interface MockAppConfigService {
  postIdNamespace: string;
}

export const TEST_POST_NAMESPACE = 'a2d04a60-9d04-4e4b-97e3-0d3f23c7c2b5';

export const createMockPostService = (): MockPostService => ({
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

export const createMockCommentService = (): MockCommentService => ({
  create: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
});

export const createMockStorageClientService = (): MockStorageClientService => ({
  confirmPostAttachment: jest.fn(),
});

export const createMockAppConfigService = (): MockAppConfigService => ({
  postIdNamespace: TEST_POST_NAMESPACE,
});
